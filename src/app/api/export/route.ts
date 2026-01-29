import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Universal export endpoint with flexible options
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const format = searchParams.get('format') || 'csv';
  const types = searchParams.get('types')?.split(',') || ['all'];
  const includeRelationships = searchParams.get('relationships') !== 'false';

  try {
    const db = await getDatabase();

    if (!db) {
      return NextResponse.json({ error: 'Database not loaded. Please sync metadata first.' }, { status: 400 });
    }

    let result: any;

    if (format === 'json') {
      result = exportAsJSON(db, types, includeRelationships);
      return NextResponse.json(result, {
        headers: {
          'Content-Disposition': `attachment; filename="salesforce-metadata-export.json"`,
        },
      });
    } else {
      result = exportAsCSV(db, types, includeRelationships);
      return new NextResponse(result, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="salesforce-metadata-export.csv"`,
        },
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    const message = error instanceof Error ? error.message : 'Export failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

function exportAsJSON(db: any, types: string[], includeRelationships: boolean): any {
  const typeFilter = types.includes('all')
    ? ''
    : `WHERE type IN (${types.map(t => `'${t}'`).join(',')})`;

  const nodesResult = db.exec(`
    SELECT id, api_name, type, label, metadata_json
    FROM nodes
    ${typeFilter}
    ORDER BY type, api_name
  `);

  const nodes = (nodesResult[0]?.values || []).map((row: any) => ({
    id: row[0],
    apiName: row[1],
    type: row[2],
    label: row[3] || row[1],
    metadata: row[4] ? JSON.parse(row[4]) : {},
  }));

  const result: any = { nodes, exportDate: new Date().toISOString() };

  if (includeRelationships) {
    const edgesResult = db.exec(`
      SELECT
        s.api_name as source, s.type as source_type,
        t.api_name as target, t.type as target_type,
        e.relation_type
      FROM edges e
      JOIN nodes s ON e.source_id = s.id
      JOIN nodes t ON e.target_id = t.id
    `);

    result.relationships = (edgesResult[0]?.values || []).map((row: any) => ({
      source: row[0],
      sourceType: row[1],
      target: row[2],
      targetType: row[3],
      relationshipType: row[4],
    }));
  }

  return result;
}

function exportAsCSV(db: any, types: string[], includeRelationships: boolean): string {
  const typeFilter = types.includes('all')
    ? ''
    : `WHERE type IN (${types.map(t => `'${t}'`).join(',')})`;

  const nodesResult = db.exec(`
    SELECT id, api_name, type, label
    FROM nodes
    ${typeFilter}
    ORDER BY type, api_name
  `);

  const lines = ['Id,API Name,Type,Label'];

  const nodes = nodesResult[0]?.values || [];
  nodes.forEach((row: any) => {
    const id = row[0];
    const apiName = escapeCSV(row[1]);
    const type = row[2];
    const label = escapeCSV(row[3] || row[1]);
    lines.push(`${id},${apiName},${type},${label}`);
  });

  if (includeRelationships) {
    lines.push('');
    lines.push('--- RELATIONSHIPS ---');
    lines.push('Source,Source Type,Target,Target Type,Relationship');

    const edgesResult = db.exec(`
      SELECT
        s.api_name as source, s.type as source_type,
        t.api_name as target, t.type as target_type,
        e.relation_type
      FROM edges e
      JOIN nodes s ON e.source_id = s.id
      JOIN nodes t ON e.target_id = t.id
    `);

    const edges = edgesResult[0]?.values || [];
    edges.forEach((row: any) => {
      lines.push(`${escapeCSV(row[0])},${row[1]},${escapeCSV(row[2])},${row[3]},${row[4]}`);
    });
  }

  return lines.join('\n');
}

function escapeCSV(value: string): string {
  if (!value) return '';
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
