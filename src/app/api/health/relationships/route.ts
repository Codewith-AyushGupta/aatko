import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    try {
      // Count total edges
      const edgesResult = db.exec('SELECT COUNT(*) FROM edges');
      const totalEdges = edgesResult[0]?.values[0]?.[0] || 0;

      // Count fields with parent_id (linked to objects)
      const fieldsResult = db.exec("SELECT COUNT(*) FROM nodes WHERE type = 'Field' AND parent_id IS NOT NULL");
      const fieldsWithParent = fieldsResult[0]?.values[0]?.[0] || 0;

      // Count orphan fields (no parent)
      const orphanFieldsResult = db.exec("SELECT COUNT(*) FROM nodes WHERE type = 'Field' AND parent_id IS NULL");
      const orphanFields = orphanFieldsResult[0]?.values[0]?.[0] || 0;

      // Count record types with parent
      const rtResult = db.exec("SELECT COUNT(*) FROM nodes WHERE type = 'RecordType' AND parent_id IS NOT NULL");
      const recordTypesWithParent = rtResult[0]?.values[0]?.[0] || 0;

      // Count validation rules with parent
      const vrResult = db.exec("SELECT COUNT(*) FROM nodes WHERE type = 'ValidationRule' AND parent_id IS NOT NULL");
      const validationRulesWithParent = vrResult[0]?.values[0]?.[0] || 0;

      // Edge types breakdown
      const edgeTypesResult = db.exec('SELECT edge_type, COUNT(*) FROM edges GROUP BY edge_type ORDER BY COUNT(*) DESC');
      const edgeTypes = edgeTypesResult[0]?.values.map((row: any) => ({
        type: row[0],
        count: row[1],
      })) || [];

      db.close();

      return NextResponse.json({
        totalEdges,
        fieldsWithParent,
        orphanFields,
        recordTypesWithParent,
        validationRulesWithParent,
        edgeTypes,
      });
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Error checking relationships:', error);
    return NextResponse.json({ error: 'Failed to check relationships' }, { status: 500 });
  }
}
