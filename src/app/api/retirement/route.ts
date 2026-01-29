import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface RetirementCandidate {
  id: number;
  apiName: string;
  label: string | null;
  type: string;
  parentName?: string;
  reason: string[];
  riskLevel: 'safe' | 'low' | 'medium' | 'high';
  dependentCount: number;
  recordCount?: number;
  populationRate?: number;
  lastModified?: string;
}

interface RetirementAnalysis {
  candidates: RetirementCandidate[];
  summary: {
    total: number;
    byType: Record<string, number>;
    byRisk: Record<string, number>;
    safeToRemove: number;
  };
}

// Get retirement candidates
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || '';
  const minPopulationRate = parseFloat(searchParams.get('minPopulationRate') || '0');
  const maxPopulationRate = parseFloat(searchParams.get('maxPopulationRate') || '0.1');
  const includeWithDependents = searchParams.get('includeWithDependents') === 'true';

  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    const candidates: RetirementCandidate[] = [];

    // Build query based on type filter
    let typeFilter = '';
    if (type) {
      typeFilter = `AND n.type = '${type}'`;
    } else {
      // Default to fields and objects for retirement analysis
      typeFilter = `AND n.type IN ('Field', 'Object', 'Flow', 'ApexClass', 'ValidationRule')`;
    }

    // Get nodes with analytics
    const nodesResult = db.exec(`
      SELECT
        n.id,
        n.api_name,
        n.label,
        n.type,
        n.parent_id,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate
      FROM nodes n
      LEFT JOIN analytics a ON n.id = a.node_id
      WHERE 1=1 ${typeFilter}
      GROUP BY n.id
      ORDER BY
        COALESCE(MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END), 0) ASC,
        n.type, n.api_name
      LIMIT 500
    `);

    // Get parent names for fields
    const parentMap = new Map<number, string>();
    const parentIds = new Set<number>();

    (nodesResult[0]?.values || []).forEach((row: any) => {
      if (row[4]) parentIds.add(row[4] as number);
    });

    if (parentIds.size > 0) {
      const parentResult = db.exec(`
        SELECT id, api_name FROM nodes WHERE id IN (${Array.from(parentIds).join(',')})
      `);
      (parentResult[0]?.values || []).forEach((row: any) => {
        parentMap.set(row[0] as number, row[1] as string);
      });
    }

    // Analyze each node
    for (const row of (nodesResult[0]?.values || [])) {
      const nodeId = row[0] as number;
      const apiName = row[1] as string;
      const label = row[2] as string | null;
      const nodeType = row[3] as string;
      const parentId = row[4] as number | null;
      const recordCount = row[5] as number | null;
      const populationRate = row[6] as number | null;

      // Skip standard fields
      if (nodeType === 'Field' && !apiName.endsWith('__c')) {
        continue;
      }

      // Check population rate filter
      if (populationRate !== null) {
        if (populationRate < minPopulationRate || populationRate > maxPopulationRate) {
          continue;
        }
      }

      // Count dependents (things that reference this item)
      const dependentResult = db.exec(`
        SELECT COUNT(DISTINCT source_id) as count
        FROM edges
        WHERE target_id = ${nodeId}
      `);
      const dependentCount = (dependentResult[0]?.values[0]?.[0] as number) || 0;

      // Skip if has dependents and we're not including them
      if (!includeWithDependents && dependentCount > 0) {
        continue;
      }

      // Determine reasons for retirement
      const reasons: string[] = [];

      if (populationRate !== null && populationRate === 0) {
        reasons.push('No data (0% population)');
      } else if (populationRate !== null && populationRate < 0.01) {
        reasons.push('Very low usage (<1% population)');
      } else if (populationRate !== null && populationRate < 0.05) {
        reasons.push('Low usage (<5% population)');
      } else if (populationRate !== null && populationRate < 0.1) {
        reasons.push('Below threshold (<10% population)');
      }

      if (recordCount === 0) {
        reasons.push('No records');
      }

      if (dependentCount === 0) {
        reasons.push('No dependencies');
      }

      // Skip if no reasons found
      if (reasons.length === 0) {
        continue;
      }

      // Calculate risk level
      let riskLevel: RetirementCandidate['riskLevel'] = 'safe';
      if (dependentCount > 5) {
        riskLevel = 'high';
      } else if (dependentCount > 2) {
        riskLevel = 'medium';
      } else if (dependentCount > 0) {
        riskLevel = 'low';
      }

      candidates.push({
        id: nodeId,
        apiName,
        label,
        type: nodeType,
        parentName: parentId ? parentMap.get(parentId) : undefined,
        reason: reasons,
        riskLevel,
        dependentCount,
        recordCount: recordCount ?? undefined,
        populationRate: populationRate ?? undefined,
      });
    }

    db.close();

    // Calculate summary
    const byType: Record<string, number> = {};
    const byRisk: Record<string, number> = { safe: 0, low: 0, medium: 0, high: 0 };

    candidates.forEach(c => {
      byType[c.type] = (byType[c.type] || 0) + 1;
      byRisk[c.riskLevel]++;
    });

    const analysis: RetirementAnalysis = {
      candidates,
      summary: {
        total: candidates.length,
        byType,
        byRisk,
        safeToRemove: byRisk.safe,
      },
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Retirement analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze retirement candidates' }, { status: 500 });
  }
}
