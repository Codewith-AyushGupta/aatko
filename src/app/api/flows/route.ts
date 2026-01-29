import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ flows: [] });
    }

    try {
      const result = db.exec(`
        SELECT id, api_name, label, metadata_json
        FROM nodes
        WHERE type = 'Flow'
        ORDER BY label, api_name
      `);

      const flows = result.length > 0
        ? result[0].values.map((row: any) => ({
            id: row[0],
            api_name: row[1],
            label: row[2] || row[1],
            metadata: row[3] ? JSON.parse(row[3]) : {},
          }))
        : [];

      return NextResponse.json({ flows });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Error fetching flows:', error);
    return NextResponse.json({ error: 'Failed to fetch flows' }, { status: 500 });
  }
}
