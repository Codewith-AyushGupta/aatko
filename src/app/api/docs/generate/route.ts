import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface DocumentationItem {
  id: number;
  apiName: string;
  label: string | null;
  type: string;
  description: string | null;
  filePath: string | null;
  metadata: Record<string, any>;
  children: {
    id: number;
    apiName: string;
    label: string | null;
    type: string;
    description: string | null;
  }[];
  relationships: {
    direction: 'incoming' | 'outgoing';
    edgeType: string;
    nodeId: number;
    apiName: string;
    label: string | null;
    nodeType: string;
  }[];
  analytics: {
    recordCount?: number;
    populationRate?: number;
  };
}

interface DocumentationResult {
  items: DocumentationItem[];
  generatedAt: string;
  summary: {
    totalItems: number;
    itemsByType: Record<string, number>;
    totalRelationships: number;
    totalChildren: number;
  };
}

// Generate documentation for selected nodes
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nodeIds: number[] = body.nodeIds || [];

    if (!nodeIds.length) {
      return NextResponse.json({ error: 'No nodes selected' }, { status: 400 });
    }

    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const items: DocumentationItem[] = [];

    for (const nodeId of nodeIds) {
      // Get node details
      const nodeResult = db.exec(`
        SELECT id, api_name, label, type, file_path, metadata_json
        FROM nodes
        WHERE id = ${nodeId}
      `);

      if (!nodeResult[0]?.values?.length) continue;

      const nodeRow = nodeResult[0].values[0];
      const metadataJson = nodeRow[5] as string | null;
      let metadata: Record<string, any> = {};
      let description: string | null = null;

      if (metadataJson) {
        try {
          metadata = JSON.parse(metadataJson);
          description = metadata.description || metadata.Description || null;
        } catch {
          // Invalid JSON
        }
      }

      // Get children (fields, validation rules, etc.)
      const childrenResult = db.exec(`
        SELECT id, api_name, label, type, metadata_json
        FROM nodes
        WHERE parent_id = ${nodeId}
        ORDER BY type, api_name
      `);

      const children = (childrenResult[0]?.values || []).map((row: any) => {
        let childDesc = null;
        if (row[4]) {
          try {
            const childMeta = JSON.parse(row[4]);
            childDesc = childMeta.description || childMeta.inlineHelpText || null;
          } catch {
            // Invalid JSON
          }
        }
        return {
          id: row[0] as number,
          apiName: row[1] as string,
          label: row[2] as string | null,
          type: row[3] as string,
          description: childDesc,
        };
      });

      // Get incoming relationships (what references this item)
      const incomingResult = db.exec(`
        SELECT e.edge_type, n.id, n.api_name, n.label, n.type
        FROM edges e
        JOIN nodes n ON e.source_id = n.id
        WHERE e.target_id = ${nodeId}
        ORDER BY e.edge_type, n.api_name
      `);

      // Get outgoing relationships (what this item references)
      const outgoingResult = db.exec(`
        SELECT e.edge_type, n.id, n.api_name, n.label, n.type
        FROM edges e
        JOIN nodes n ON e.target_id = n.id
        WHERE e.source_id = ${nodeId}
        ORDER BY e.edge_type, n.api_name
      `);

      const relationships: DocumentationItem['relationships'] = [];

      (incomingResult[0]?.values || []).forEach((row: any) => {
        relationships.push({
          direction: 'incoming',
          edgeType: row[0],
          nodeId: row[1],
          apiName: row[2],
          label: row[3],
          nodeType: row[4],
        });
      });

      (outgoingResult[0]?.values || []).forEach((row: any) => {
        relationships.push({
          direction: 'outgoing',
          edgeType: row[0],
          nodeId: row[1],
          apiName: row[2],
          label: row[3],
          nodeType: row[4],
        });
      });

      // Get analytics
      const analyticsResult = db.exec(`
        SELECT metric_type, metric_value
        FROM analytics
        WHERE node_id = ${nodeId}
      `);

      const analytics: DocumentationItem['analytics'] = {};
      (analyticsResult[0]?.values || []).forEach((row: any) => {
        if (row[0] === 'record_count') analytics.recordCount = row[1];
        if (row[0] === 'population_rate') analytics.populationRate = row[1];
      });

      items.push({
        id: nodeRow[0] as number,
        apiName: nodeRow[1] as string,
        label: nodeRow[2] as string | null,
        type: nodeRow[3] as string,
        description,
        filePath: nodeRow[4] as string | null,
        metadata,
        children,
        relationships,
        analytics,
      });
    }

    db.close();

    // Calculate summary
    const itemsByType: Record<string, number> = {};
    let totalRelationships = 0;
    let totalChildren = 0;

    items.forEach(item => {
      itemsByType[item.type] = (itemsByType[item.type] || 0) + 1;
      totalRelationships += item.relationships.length;
      totalChildren += item.children.length;
    });

    const result: DocumentationResult = {
      items,
      generatedAt: new Date().toISOString(),
      summary: {
        totalItems: items.length,
        itemsByType,
        totalRelationships,
        totalChildren,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error generating documentation:', error);
    return NextResponse.json({ error: 'Failed to generate documentation' }, { status: 500 });
  }
}
