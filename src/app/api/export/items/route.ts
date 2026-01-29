import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Map frontend type names to database type names
const typeMapping: Record<string, string> = {
  'CustomObject': 'Object',
  'Object': 'Object',
  'CustomField': 'Field',
  'Field': 'Field',
  'Flow': 'Flow',
  'ApexClass': 'ApexClass',
  'ApexTrigger': 'ApexTrigger',
  'LWC': 'LWC',
  'Layout': 'Layout',
  'FlexiPage': 'FlexiPage',
  'PermissionSet': 'PermissionSet',
  'Profile': 'Profile',
  'Dashboard': 'Dashboard',
  'Report': 'Report',
  'RecordType': 'RecordType',
  'ValidationRule': 'ValidationRule',
};

// Get items of a specific type for selection
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type');
  const search = searchParams.get('search') || '';

  if (!type) {
    return NextResponse.json({ error: 'Type is required' }, { status: 400 });
  }

  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ items: [] });
    }

    // Map the type to database type
    const dbType = typeMapping[type] || type;
    const escapedType = dbType.replace(/'/g, "''");
    const escapedSearch = search.replace(/'/g, "''");

    let query = `
      SELECT id, api_name, label, type
      FROM nodes
      WHERE type = '${escapedType}'
    `;

    if (search) {
      query += ` AND (api_name LIKE '%${escapedSearch}%' OR label LIKE '%${escapedSearch}%')`;
    }

    query += ` ORDER BY api_name LIMIT 200`;

    const result = db.exec(query);
    db.close();

    const items = (result[0]?.values || []).map((row: any) => ({
      id: row[0],
      apiName: row[1],
      label: row[2] || row[1],
      type: row[3],
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error('Error getting items:', error);
    return NextResponse.json({ error: 'Failed to get items' }, { status: 500 });
  }
}
