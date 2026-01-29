import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface HealthMetric {
  name: string;
  total: number;
  complete: number;
  percentage: number;
  status: 'good' | 'warning' | 'critical';
}

interface HealthCheckResult {
  overall: {
    score: number;
    status: 'good' | 'warning' | 'critical';
    message: string;
  };
  metrics: HealthMetric[];
  lastSync: {
    metadata: string | null;
    recordCounts: string | null;
    utilization: string | null;
    audit: string | null;
  };
  recommendations: string[];
}

function getStatus(percentage: number): 'good' | 'warning' | 'critical' {
  if (percentage >= 90) return 'good';
  if (percentage >= 50) return 'warning';
  return 'critical';
}

export async function GET() {
  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({
        overall: {
          score: 0,
          status: 'critical',
          message: 'Database not found. Run ingest command first.',
        },
        metrics: [],
        lastSync: {
          metadata: null,
          recordCounts: null,
          utilization: null,
          audit: null,
        },
        recommendations: ['Run: npm run ingest -- --path ./force-app/main/default'],
      } as HealthCheckResult);
    }

    try {
      const metrics: HealthMetric[] = [];
      const recommendations: string[] = [];

      // 1. Check Objects with Record Counts
      const objectsResult = db.exec(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN a.metric_value IS NOT NULL THEN 1 ELSE 0 END) as with_counts
        FROM nodes n
        LEFT JOIN analytics a ON n.id = a.node_id AND a.metric_type = 'record_count'
        WHERE n.type = 'Object'
      `);
      const objectsTotal = objectsResult[0]?.values[0]?.[0] as number || 0;
      const objectsWithCounts = objectsResult[0]?.values[0]?.[1] as number || 0;
      const objectsPercentage = objectsTotal > 0 ? Math.round((objectsWithCounts / objectsTotal) * 100) : 0;

      metrics.push({
        name: 'Objects with Record Counts',
        total: objectsTotal,
        complete: objectsWithCounts,
        percentage: objectsPercentage,
        status: getStatus(objectsPercentage),
      });

      if (objectsPercentage < 90) {
        recommendations.push('Sync record counts: npm run -w @aa-smi/indexer sync record-counts');
      }

      // 2. Check Fields with Population Rates
      const fieldsResult = db.exec(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN a.metric_value IS NOT NULL THEN 1 ELSE 0 END) as with_rates
        FROM nodes n
        LEFT JOIN analytics a ON n.id = a.node_id AND a.metric_type = 'population_rate'
        WHERE n.type = 'Field'
      `);
      const fieldsTotal = fieldsResult[0]?.values[0]?.[0] as number || 0;
      const fieldsWithRates = fieldsResult[0]?.values[0]?.[1] as number || 0;
      const fieldsPercentage = fieldsTotal > 0 ? Math.round((fieldsWithRates / fieldsTotal) * 100) : 0;

      metrics.push({
        name: 'Fields with Utilization Data',
        total: fieldsTotal,
        complete: fieldsWithRates,
        percentage: fieldsPercentage,
        status: getStatus(fieldsPercentage),
      });

      if (fieldsPercentage < 90) {
        recommendations.push('Sync field utilization: npm run -w @aa-smi/indexer sync utilization');
      }

      // 3. Check Nodes with Audit Data (Created/Modified)
      const auditResult = db.exec(`
        SELECT COUNT(*) as total,
               SUM(CASE WHEN sf_created_date IS NOT NULL OR sf_last_modified_date IS NOT NULL THEN 1 ELSE 0 END) as with_audit
        FROM nodes
        WHERE type IN ('Object', 'Field', 'Flow', 'ApexClass', 'ApexTrigger')
      `);
      const auditTotal = auditResult[0]?.values[0]?.[0] as number || 0;
      const auditWithData = auditResult[0]?.values[0]?.[1] as number || 0;
      const auditPercentage = auditTotal > 0 ? Math.round((auditWithData / auditTotal) * 100) : 0;

      metrics.push({
        name: 'Nodes with Audit Data',
        total: auditTotal,
        complete: auditWithData,
        percentage: auditPercentage,
        status: getStatus(auditPercentage),
      });

      if (auditPercentage < 90) {
        recommendations.push('Sync audit data: npm run -w @aa-smi/indexer sync audit');
      }

      // 4. Check Flows indexed
      const flowsResult = db.exec(`SELECT COUNT(*) FROM nodes WHERE type = 'Flow'`);
      const flowsTotal = flowsResult[0]?.values[0]?.[0] as number || 0;

      metrics.push({
        name: 'Flows Indexed',
        total: flowsTotal,
        complete: flowsTotal,
        percentage: flowsTotal > 0 ? 100 : 0,
        status: flowsTotal > 0 ? 'good' : 'warning',
      });

      // 5. Check Apex Classes indexed
      const apexResult = db.exec(`SELECT COUNT(*) FROM nodes WHERE type = 'ApexClass'`);
      const apexTotal = apexResult[0]?.values[0]?.[0] as number || 0;

      metrics.push({
        name: 'Apex Classes Indexed',
        total: apexTotal,
        complete: apexTotal,
        percentage: apexTotal > 0 ? 100 : 0,
        status: apexTotal > 0 ? 'good' : 'warning',
      });

      // 6. Check Relationships (Edges)
      const edgesResult = db.exec(`SELECT COUNT(*) FROM edges`);
      const edgesTotal = edgesResult[0]?.values[0]?.[0] as number || 0;

      metrics.push({
        name: 'Relationships Mapped',
        total: edgesTotal,
        complete: edgesTotal,
        percentage: edgesTotal > 0 ? 100 : 0,
        status: edgesTotal > 0 ? 'good' : 'warning',
      });

      // Calculate overall score
      const scoreMetrics = metrics.filter(m => m.total > 0);
      const overallScore = scoreMetrics.length > 0
        ? Math.round(scoreMetrics.reduce((sum, m) => sum + m.percentage, 0) / scoreMetrics.length)
        : 0;

      const overallStatus = getStatus(overallScore);
      let overallMessage = '';
      if (overallStatus === 'good') {
        overallMessage = 'Data is complete and ready for analysis.';
      } else if (overallStatus === 'warning') {
        overallMessage = 'Some data is missing. Run sync commands for complete analysis.';
      } else {
        overallMessage = 'Critical data missing. Sync required before analysis.';
      }

      // Get last sync timestamps (if tracked)
      // For now, we'll estimate based on data presence
      const lastSync = {
        metadata: objectsTotal > 0 ? 'Available' : null,
        recordCounts: objectsWithCounts > 0 ? 'Available' : null,
        utilization: fieldsWithRates > 0 ? 'Available' : null,
        audit: auditWithData > 0 ? 'Available' : null,
      };

      return NextResponse.json({
        overall: {
          score: overallScore,
          status: overallStatus,
          message: overallMessage,
        },
        metrics,
        lastSync,
        recommendations,
      } as HealthCheckResult);
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('Error running health check:', error);
    return NextResponse.json(
      { error: 'Failed to run health check' },
      { status: 500 }
    );
  }
}
