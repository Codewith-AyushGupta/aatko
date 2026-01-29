import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { name: string } }
) {
  try {
    const pageName = decodeURIComponent(params.name);
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    try {
      const escapedName = pageName.replace(/'/g, "''");
      const result = db.exec(`
        SELECT id, api_name, label, file_path, metadata_json
        FROM nodes
        WHERE api_name = '${escapedName}' AND type = 'FlexiPage'
      `);

      if (!result[0] || !result[0].values[0]) {
        db.close();
        return NextResponse.json({ error: 'FlexiPage not found' }, { status: 404 });
      }

      const row = result[0].values[0];
      const metadata = row[4] ? JSON.parse(row[4] as string) : {};

      // If there's a related object, fetch it
      let relatedObject = null;
      if (metadata.sobjectType) {
        const objResult = db.exec(`
          SELECT id, api_name, label
          FROM nodes
          WHERE api_name = '${metadata.sobjectType.replace(/'/g, "''")}' AND type = 'Object'
        `);
        if (objResult[0] && objResult[0].values[0]) {
          const objRow = objResult[0].values[0];
          relatedObject = {
            id: objRow[0],
            api_name: objRow[1],
            label: objRow[2] || objRow[1],
          };
        }
      }

      db.close();

      return NextResponse.json({
        id: row[0],
        api_name: row[1],
        label: row[2] || row[1],
        file_path: row[3],
        metadata,
        relatedObject,
      });
    } catch (err) {
      db.close();
      throw err;
    }
  } catch (error) {
    console.error('Error fetching flexipage:', error);
    return NextResponse.json({ error: 'Failed to fetch flexipage' }, { status: 500 });
  }
}
