import { NextResponse } from 'next/server';
import { execSync } from 'child_process';
import { getDatabase } from '@/lib/db';
import path from 'path';
import fs from 'fs';

export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max

const ORG_ALIAS = 'aa-sandbox';

// Objects that can't be queried directly
const SKIP_OBJECTS = [
  'ActivityHistory', 'EmailStatus', 'Name', 'ContentDocumentLink',
  'CombinedAttachment', 'NoteAndAttachment', 'OpenActivity', 'ProcessInstanceHistory',
  'LookedUpFromActivity', 'AttachedContentDocument', 'UserRecordAccess',
  '__Share', '__History', '__Feed', '__ChangeEvent',
];

function shouldSkipObject(objectName: string): boolean {
  return SKIP_OBJECTS.some(skip => objectName.includes(skip));
}

async function getRecordCount(objectName: string): Promise<number | null> {
  if (shouldSkipObject(objectName)) {
    return null;
  }

  try {
    const query = `SELECT COUNT() FROM ${objectName}`;
    const result = execSync(
      `powershell -Command "sf data query --query '${query}' --target-org ${ORG_ALIAS} --json"`,
      { encoding: 'utf-8', maxBuffer: 10 * 1024 * 1024, timeout: 30000 }
    );

    const data = JSON.parse(result);
    if (data.status === 0 && data.result?.totalSize !== undefined) {
      return data.result.totalSize;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export async function POST() {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Get all objects from database
    const result = db.exec(`SELECT id, api_name FROM nodes WHERE type = 'Object' ORDER BY api_name`);
    if (!result[0]) {
      db.close();
      return NextResponse.json({ error: 'No objects found' }, { status: 404 });
    }

    const objects = result[0].values.map((row: any) => ({
      id: row[0],
      api_name: row[1],
    }));

    db.close();

    // Fetch record counts (this will be slow for many objects)
    const counts: { objectName: string; count: number }[] = [];
    let processed = 0;
    let errors = 0;

    for (const obj of objects) {
      const count = await getRecordCount(obj.api_name);
      if (count !== null) {
        counts.push({ objectName: obj.api_name, count });
      } else {
        errors++;
      }
      processed++;

      // Log progress
      if (processed % 10 === 0) {
        console.log(`Processed ${processed}/${objects.length} objects...`);
      }
    }

    // Update database with counts
    const DB_PATH = path.resolve(process.cwd(), '..', '..', 'packages', 'indexer', 'data', 'metadata.db');

    if (!fs.existsSync(DB_PATH)) {
      return NextResponse.json({ error: 'Database file not found' }, { status: 500 });
    }

    // Use sql.js to update
    const initSqlJs = require('sql.js');
    const wasmPath = path.resolve(process.cwd(), '..', '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');
    const wasmBinary = fs.readFileSync(wasmPath);
    const SQL = await initSqlJs({ wasmBinary });

    const buffer = fs.readFileSync(DB_PATH);
    const updateDb = new SQL.Database(buffer);

    let updated = 0;
    for (const { objectName, count } of counts) {
      // Find the node ID
      const nodeResult = updateDb.exec(`SELECT id FROM nodes WHERE api_name = '${objectName.replace(/'/g, "''")}' AND type = 'Object'`);
      if (nodeResult[0]?.values[0]) {
        const nodeId = nodeResult[0].values[0][0];

        // Upsert analytics record
        updateDb.run(`
          INSERT INTO analytics (node_id, metric_type, metric_value, imported_at)
          VALUES (${nodeId}, 'record_count', ${count}, datetime('now'))
          ON CONFLICT(node_id, metric_type)
          DO UPDATE SET metric_value = ${count}, imported_at = datetime('now')
        `);
        updated++;
      }
    }

    // Save database
    const data = updateDb.export();
    const newBuffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, newBuffer);
    updateDb.close();

    return NextResponse.json({
      success: true,
      processed,
      updated,
      errors,
      message: `Updated record counts for ${updated} objects`,
    });
  } catch (error: any) {
    console.error('Error fetching record counts:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch record counts' }, { status: 500 });
  }
}
