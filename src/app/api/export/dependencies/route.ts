import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Get all dependencies for selected items
export async function POST(request: NextRequest) {
  try {
    const { itemIds, depth = 2 } = await request.json();

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return NextResponse.json({ error: 'itemIds array is required' }, { status: 400 });
    }

    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ items: [], relationships: [] });
    }

    const visited = new Set<number>();
    const allItems: any[] = [];
    const allRelationships: any[] = [];

    const traverse = (ids: number[], currentDepth: number) => {
      if (currentDepth > depth || ids.length === 0) return;

      const unvisited = ids.filter(id => !visited.has(id));
      if (unvisited.length === 0) return;

      unvisited.forEach(id => visited.add(id));

      // Get node details
      const idList = unvisited.join(',');
      const nodesResult = db.exec(`
        SELECT id, api_name, label, type, metadata_json
        FROM nodes
        WHERE id IN (${idList})
      `);

      const nodes = nodesResult[0]?.values || [];
      nodes.forEach((row: any) => {
        allItems.push({
          id: row[0],
          apiName: row[1],
          label: row[2] || row[1],
          type: row[3],
          metadata: row[4] ? JSON.parse(row[4]) : {},
        });
      });

      // Get outgoing edges (what this item references)
      const outgoingResult = db.exec(`
        SELECT e.source_id, e.target_id, e.edge_type,
               t.api_name as target_name, t.type as target_type
        FROM edges e
        JOIN nodes t ON e.target_id = t.id
        WHERE e.source_id IN (${idList})
      `);

      // Get incoming edges (what references this item)
      const incomingResult = db.exec(`
        SELECT e.source_id, e.target_id, e.edge_type,
               s.api_name as source_name, s.type as source_type
        FROM edges e
        JOIN nodes s ON e.source_id = s.id
        WHERE e.target_id IN (${idList})
      `);

      const nextIds: number[] = [];

      (outgoingResult[0]?.values || []).forEach((row: any) => {
        allRelationships.push({
          sourceId: row[0],
          targetId: row[1],
          edgeType: row[2],
          targetName: row[3],
          targetType: row[4],
        });
        if (!visited.has(row[1])) {
          nextIds.push(row[1]);
        }
      });

      (incomingResult[0]?.values || []).forEach((row: any) => {
        allRelationships.push({
          sourceId: row[0],
          targetId: row[1],
          edgeType: row[2],
          sourceName: row[3],
          sourceType: row[4],
        });
        if (!visited.has(row[0])) {
          nextIds.push(row[0]);
        }
      });

      // Recurse for next level
      if (nextIds.length > 0) {
        traverse(Array.from(new Set(nextIds)), currentDepth + 1);
      }
    };

    traverse(itemIds, 0);
    db.close();

    // Dedupe relationships
    const uniqueRelationships = Array.from(
      new Map(
        allRelationships.map(r => [`${r.sourceId}-${r.targetId}-${r.edgeType}`, r])
      ).values()
    );

    return NextResponse.json({
      items: allItems,
      relationships: uniqueRelationships,
      summary: {
        totalItems: allItems.length,
        byType: allItems.reduce((acc: Record<string, number>, item) => {
          acc[item.type] = (acc[item.type] || 0) + 1;
          return acc;
        }, {}),
      },
    });
  } catch (error) {
    console.error('Error expanding dependencies:', error);
    return NextResponse.json({ error: 'Failed to expand dependencies' }, { status: 500 });
  }
}
