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
      // Get all nodes
      const nodesResult = db.exec(`
        SELECT id, api_name, label, type, parent_id, metadata_json
        FROM nodes
        ORDER BY type, api_name
      `);

      const nodes = nodesResult.length > 0
        ? nodesResult[0].values.map((row: any[]) => ({
            id: row[0],
            api_name: row[1],
            label: row[2],
            type: row[3],
            parent_id: row[4],
            metadata: row[5] ? JSON.parse(row[5]) : null,
          }))
        : [];

      // Get all edges
      const edgesResult = db.exec(`
        SELECT source_id, target_id, edge_type
        FROM edges
      `);

      const edges = edgesResult.length > 0
        ? edgesResult[0].values.map((row: any[]) => ({
            source_id: row[0],
            target_id: row[1],
            edge_type: row[2],
          }))
        : [];

      // Group nodes by type
      const nodesByType: Record<string, any[]> = {};
      for (const node of nodes) {
        if (!nodesByType[node.type]) {
          nodesByType[node.type] = [];
        }
        nodesByType[node.type].push(node);
      }

      // Create export object
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0',
        summary: {
          totalNodes: nodes.length,
          totalEdges: edges.length,
          nodesByType: Object.fromEntries(
            Object.entries(nodesByType).map(([type, items]) => [type, items.length])
          ),
        },
        nodes: nodesByType,
        edges,
      };

      return NextResponse.json(exportData);
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Error exporting data:', error);
    return NextResponse.json({ error: 'Failed to export data' }, { status: 500 });
  }
}
