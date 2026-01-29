import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ classes: [] });
    }

    try {
      const result = db.exec(`
        SELECT id, api_name, label, file_path, metadata_json
        FROM nodes
        WHERE type = 'ApexClass'
        ORDER BY api_name
      `);

      const classes = result.length > 0
        ? result[0].values.map((row: any) => ({
            id: row[0],
            api_name: row[1],
            label: row[2] || row[1],
            file_path: row[3],
            metadata: row[4] ? JSON.parse(row[4]) : {},
          }))
        : [];

      return NextResponse.json({ classes });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Error fetching apex classes:', error);
    return NextResponse.json({ error: 'Failed to fetch apex classes' }, { status: 500 });
  }
}
