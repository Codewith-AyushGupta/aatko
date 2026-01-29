import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

interface FieldUsage {
  id: number;
  fieldName: string;
  fieldLabel: string | null;
  objectName: string;
  objectLabel: string | null;
  populationRate: number | null;
  recordCount: number | null;
  dependentCount: number;
  isRequired: boolean;
  fieldType: string | null;
}

interface FieldUsageAnalysis {
  fields: FieldUsage[];
  summary: {
    totalFields: number;
    fieldsWithData: number;
    emptyFields: number;
    lowUsageFields: number;
    averagePopulation: number;
    byObject: Record<string, { total: number; empty: number; lowUsage: number }>;
  };
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const objectFilter = searchParams.get('object') || '';
  const sortBy = searchParams.get('sortBy') || 'population';
  const sortOrder = searchParams.get('sortOrder') || 'asc';

  try {
    const db = await getDatabase();
    if (!db) {
      return NextResponse.json({ error: 'Database not available' }, { status: 500 });
    }

    // Get all custom fields with their parent objects and analytics
    let objectClause = '';
    if (objectFilter) {
      objectClause = `AND parent.api_name = '${objectFilter.replace(/'/g, "''")}'`;
    }

    const fieldsResult = db.exec(`
      SELECT
        f.id,
        f.api_name as field_name,
        f.label as field_label,
        f.metadata_json,
        parent.api_name as object_name,
        parent.label as object_label,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count
      FROM nodes f
      JOIN nodes parent ON f.parent_id = parent.id
      LEFT JOIN analytics a ON f.id = a.node_id
      WHERE f.type = 'Field'
        AND f.api_name LIKE '%__c'
        ${objectClause}
      GROUP BY f.id
      ORDER BY
        CASE WHEN '${sortBy}' = 'population' AND '${sortOrder}' = 'asc' THEN COALESCE(MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END), 0) END ASC,
        CASE WHEN '${sortBy}' = 'population' AND '${sortOrder}' = 'desc' THEN COALESCE(MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END), 0) END DESC,
        CASE WHEN '${sortBy}' = 'name' AND '${sortOrder}' = 'asc' THEN f.api_name END ASC,
        CASE WHEN '${sortBy}' = 'name' AND '${sortOrder}' = 'desc' THEN f.api_name END DESC,
        CASE WHEN '${sortBy}' = 'object' AND '${sortOrder}' = 'asc' THEN parent.api_name END ASC,
        CASE WHEN '${sortBy}' = 'object' AND '${sortOrder}' = 'desc' THEN parent.api_name END DESC,
        parent.api_name, f.api_name
      LIMIT 1000
    `);

    const fields: FieldUsage[] = [];
    const objectStats: Record<string, { total: number; empty: number; lowUsage: number }> = {};

    for (const row of (fieldsResult[0]?.values || [])) {
      const fieldId = row[0] as number;
      const fieldName = row[1] as string;
      const fieldLabel = row[2] as string | null;
      const metadataJson = row[3] as string | null;
      const objectName = row[4] as string;
      const objectLabel = row[5] as string | null;
      const populationRate = row[6] as number | null;
      const recordCount = row[7] as number | null;

      // Parse metadata for field type and required
      let fieldType: string | null = null;
      let isRequired = false;
      if (metadataJson) {
        try {
          const meta = JSON.parse(metadataJson);
          fieldType = meta.type || null;
          isRequired = meta.required === true;
        } catch {
          // Invalid JSON
        }
      }

      // Get dependent count
      const depResult = db.exec(`
        SELECT COUNT(DISTINCT source_id) FROM edges WHERE target_id = ${fieldId}
      `);
      const dependentCount = (depResult[0]?.values[0]?.[0] as number) || 0;

      fields.push({
        id: fieldId,
        fieldName,
        fieldLabel,
        objectName,
        objectLabel,
        populationRate,
        recordCount,
        dependentCount,
        isRequired,
        fieldType,
      });

      // Track object stats
      if (!objectStats[objectName]) {
        objectStats[objectName] = { total: 0, empty: 0, lowUsage: 0 };
      }
      objectStats[objectName].total++;
      if (populationRate === 0) {
        objectStats[objectName].empty++;
      } else if (populationRate !== null && populationRate < 0.1) {
        objectStats[objectName].lowUsage++;
      }
    }

    db.close();

    // Calculate summary
    const fieldsWithData = fields.filter(f => f.populationRate !== null && f.populationRate > 0).length;
    const emptyFields = fields.filter(f => f.populationRate === 0).length;
    const lowUsageFields = fields.filter(f => f.populationRate !== null && f.populationRate > 0 && f.populationRate < 0.1).length;

    const populationRates = fields
      .filter(f => f.populationRate !== null)
      .map(f => f.populationRate!);
    const averagePopulation = populationRates.length > 0
      ? populationRates.reduce((a, b) => a + b, 0) / populationRates.length
      : 0;

    const analysis: FieldUsageAnalysis = {
      fields,
      summary: {
        totalFields: fields.length,
        fieldsWithData,
        emptyFields,
        lowUsageFields,
        averagePopulation,
        byObject: objectStats,
      },
    };

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('Field usage analysis error:', error);
    return NextResponse.json({ error: 'Failed to analyze field usage' }, { status: 500 });
  }
}
