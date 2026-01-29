import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface ImpactNode {
  id: number;
  apiName: string;
  label: string | null;
  type: string;
  edgeType: string;
  depth: number;
}

interface ImpactResult {
  item: {
    id: number;
    apiName: string;
    label: string | null;
    type: string;
  };
  dependents: ImpactNode[];  // What uses this item (would break if removed)
  dependencies: ImpactNode[]; // What this item uses
  riskScore: number;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  summary: {
    totalDependents: number;
    totalDependencies: number;
    dependentsByType: Record<string, number>;
    dependenciesByType: Record<string, number>;
    criticalDependents: string[];
  };
}

// Get impact analysis for a specific node
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const nodeId = searchParams.get('nodeId');
  const depth = parseInt(searchParams.get('depth') || '2');

  if (!nodeId) {
    return NextResponse.json({ error: 'nodeId is required' }, { status: 400 });
  }

  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Get the selected node
    const nodeResult = db.exec(`
      SELECT id, api_name, label, type
      FROM nodes
      WHERE id = ${nodeId}
    `);

    if (!nodeResult[0]?.values?.length) {
      db.close();
      return NextResponse.json({ error: 'Node not found' }, { status: 404 });
    }

    const nodeRow = nodeResult[0].values[0];
    const item = {
      id: nodeRow[0] as number,
      apiName: nodeRow[1] as string,
      label: nodeRow[2] as string | null,
      type: nodeRow[3] as string,
    };

    // Get dependents (what uses this item) - traverse incoming edges
    const dependents: ImpactNode[] = [];
    const visitedDependents = new Set<number>();
    const selectedId = parseInt(nodeId);

    const traverseDependents = (targetIds: number[], currentDepth: number) => {
      if (currentDepth > depth || targetIds.length === 0) return;

      const idList = targetIds.join(',');
      // Find all nodes that REFERENCE these targets (sources of edges pointing to targets)
      const result = db.exec(`
        SELECT DISTINCT n.id, n.api_name, n.label, n.type, e.edge_type
        FROM edges e
        JOIN nodes n ON e.source_id = n.id
        WHERE e.target_id IN (${idList})
          AND e.source_id != ${selectedId}
      `);

      const nextIds: number[] = [];
      (result[0]?.values || []).forEach((row: any) => {
        const nodeId = row[0] as number;
        if (!visitedDependents.has(nodeId)) {
          visitedDependents.add(nodeId);
          dependents.push({
            id: nodeId,
            apiName: row[1],
            label: row[2],
            type: row[3],
            edgeType: row[4],
            depth: currentDepth,
          });
          nextIds.push(nodeId);
        }
      });

      if (nextIds.length > 0) {
        traverseDependents(nextIds, currentDepth + 1);
      }
    };

    // Get dependencies (what this item uses) - traverse outgoing edges
    const dependencies: ImpactNode[] = [];
    const visitedDependencies = new Set<number>();

    const traverseDependencies = (sourceIds: number[], currentDepth: number) => {
      if (currentDepth > depth || sourceIds.length === 0) return;

      const idList = sourceIds.join(',');
      // Find all nodes that these sources REFERENCE (targets of edges from sources)
      const result = db.exec(`
        SELECT DISTINCT n.id, n.api_name, n.label, n.type, e.edge_type
        FROM edges e
        JOIN nodes n ON e.target_id = n.id
        WHERE e.source_id IN (${idList})
          AND e.target_id != ${selectedId}
      `);

      const nextIds: number[] = [];
      (result[0]?.values || []).forEach((row: any) => {
        const nodeId = row[0] as number;
        if (!visitedDependencies.has(nodeId)) {
          visitedDependencies.add(nodeId);
          dependencies.push({
            id: nodeId,
            apiName: row[1],
            label: row[2],
            type: row[3],
            edgeType: row[4],
            depth: currentDepth,
          });
          nextIds.push(nodeId);
        }
      });

      if (nextIds.length > 0) {
        traverseDependencies(nextIds, currentDepth + 1);
      }
    };

    // Start traversal from the selected node
    traverseDependents([selectedId], 1);
    traverseDependencies([selectedId], 1);

    db.close();

    // Calculate summary
    const dependentsByType: Record<string, number> = {};
    const dependenciesByType: Record<string, number> = {};

    dependents.forEach(d => {
      dependentsByType[d.type] = (dependentsByType[d.type] || 0) + 1;
    });

    dependencies.forEach(d => {
      dependenciesByType[d.type] = (dependenciesByType[d.type] || 0) + 1;
    });

    // Identify critical dependents (Flows, Apex, Triggers at depth 1)
    const criticalTypes = ['Flow', 'ApexClass', 'ApexTrigger', 'LWC'];
    const criticalDependents = dependents
      .filter(d => d.depth === 1 && criticalTypes.includes(d.type))
      .map(d => `${d.type}: ${d.apiName}`);

    // Calculate risk score (0-100)
    let riskScore = 0;

    // Base score from number of direct dependents
    const directDependents = dependents.filter(d => d.depth === 1).length;
    riskScore += Math.min(directDependents * 10, 40);

    // Critical dependents add more risk
    riskScore += Math.min(criticalDependents.length * 15, 30);

    // Total dependents (at any depth)
    riskScore += Math.min(dependents.length * 2, 20);

    // Item type matters (objects are higher risk than fields)
    if (item.type === 'Object') riskScore += 10;
    if (item.type === 'ApexClass' || item.type === 'ApexTrigger') riskScore += 5;

    riskScore = Math.min(riskScore, 100);

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical';
    if (riskScore >= 75) riskLevel = 'critical';
    else if (riskScore >= 50) riskLevel = 'high';
    else if (riskScore >= 25) riskLevel = 'medium';
    else riskLevel = 'low';

    const result: ImpactResult = {
      item,
      dependents,
      dependencies,
      riskScore,
      riskLevel,
      summary: {
        totalDependents: dependents.length,
        totalDependencies: dependencies.length,
        dependentsByType,
        dependenciesByType,
        criticalDependents,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error('Error analyzing impact:', error);
    return NextResponse.json({ error: 'Failed to analyze impact' }, { status: 500 });
  }
}
