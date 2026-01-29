import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ objects: [] });
    }

    try {
      const result = db.exec(`
        SELECT
          n.id,
          n.api_name,
          n.label,
          n.metadata_json,
          COUNT(f.id) as field_count,
          MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
          MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate,
          n.sf_created_date,
          n.sf_created_by_name,
          n.sf_last_modified_date,
          n.sf_last_modified_by_name
        FROM nodes n
        LEFT JOIN nodes f ON f.parent_id = n.id AND f.type = 'Field'
        LEFT JOIN analytics a ON n.id = a.node_id
        WHERE n.type = 'Object'
        GROUP BY n.id
        ORDER BY n.api_name
      `);

      const objects = result.length > 0
        ? result[0].values.map((row: any[]) => ({
            id: row[0],
            api_name: row[1],
            label: row[2] || row[1],
            metadata: row[3] ? JSON.parse(row[3]) : {},
            field_count: row[4] || 0,
            record_count: row[5],
            population_rate: row[6],
            created_date: row[7],
            created_by: row[8],
            last_modified_date: row[9],
            last_modified_by: row[10],
          }))
        : [];

      return NextResponse.json({ objects });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Error fetching objects:', error);
    return NextResponse.json({ error: 'Failed to fetch objects' }, { status: 500 });
  }
}
