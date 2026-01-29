import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/db';

export const dynamic = 'force-dynamic';

// Export metadata in formats suitable for Lucidchart import
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const type = searchParams.get('type') || 'objects';
  const format = searchParams.get('format') || 'csv';

  try {
    const db = await getDatabase();
    let data: string;
    let filename: string;

    switch (type) {
      case 'objects':
        data = exportObjectRelationships(db);
        filename = 'salesforce-objects-erd.csv';
        break;
      case 'dependencies':
        data = exportDependencies(db);
        filename = 'salesforce-dependencies.csv';
        break;
      case 'automation':
        data = exportAutomation(db);
        filename = 'salesforce-automation.csv';
        break;
      case 'all':
        data = exportAllForLucidchart(db);
        filename = 'salesforce-metadata-complete.csv';
        break;
      default:
        return NextResponse.json({ error: 'Invalid export type' }, { status: 400 });
    }

    // Return as downloadable CSV
    return new NextResponse(data, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Export failed' }, { status: 500 });
  }
}

function exportObjectRelationships(db: any): string {
  // Get all objects
  const objectsResult = db.exec(`
    SELECT api_name, label, metadata_json
    FROM nodes
    WHERE type = 'CustomObject'
    ORDER BY api_name
  `);

  // Get all lookup/master-detail relationships
  const relationsResult = db.exec(`
    SELECT
      e.source_id, e.target_id, e.relation_type,
      s.api_name as source_name, s.type as source_type,
      t.api_name as target_name, t.type as target_type
    FROM edges e
    JOIN nodes s ON e.source_id = s.id
    JOIN nodes t ON e.target_id = t.id
    WHERE e.relation_type IN ('Lookup', 'MasterDetail', 'Hierarchy')
    ORDER BY s.api_name
  `);

  // Build CSV for Lucidchart ERD import
  // Format: Shape Library, Text Area 1, Text Area 2, Text Area 3, Line Source, Line Destination
  const lines = ['Shape Type,Name,Label,Field Count,Connects From,Connects To,Relationship Type'];

  // Add objects as entities
  const objects = objectsResult[0]?.values || [];
  objects.forEach((row: any) => {
    const apiName = row[0];
    const label = row[1] || apiName;
    const metadata = row[2] ? JSON.parse(row[2]) : {};
    const fieldCount = metadata.fieldCount || 0;
    lines.push(`Entity,${apiName},${label},${fieldCount},,`);
  });

  // Add relationships as connections
  const relations = relationsResult[0]?.values || [];
  relations.forEach((row: any) => {
    const sourceName = row[3];
    const targetName = row[5];
    const relationType = row[2];
    lines.push(`Relationship,${sourceName} -> ${targetName},,${relationType},${sourceName},${targetName},${relationType}`);
  });

  return lines.join('\n');
}

function exportDependencies(db: any): string {
  // Get all dependencies between components
  const depsResult = db.exec(`
    SELECT
      s.api_name as source_name, s.type as source_type,
      t.api_name as target_name, t.type as target_type,
      e.relation_type
    FROM edges e
    JOIN nodes s ON e.source_id = s.id
    JOIN nodes t ON e.target_id = t.id
    ORDER BY s.type, s.api_name
  `);

  const lines = ['Source Name,Source Type,Target Name,Target Type,Relationship'];

  const deps = depsResult[0]?.values || [];
  deps.forEach((row: any) => {
    lines.push(`${row[0]},${row[1]},${row[2]},${row[3]},${row[4]}`);
  });

  return lines.join('\n');
}

function exportAutomation(db: any): string {
  // Get flows, triggers, and process builders
  const automationResult = db.exec(`
    SELECT api_name, type, label, metadata_json
    FROM nodes
    WHERE type IN ('Flow', 'ApexTrigger', 'ProcessBuilder', 'WorkflowRule')
    ORDER BY type, api_name
  `);

  // Get what objects they affect
  const relationsResult = db.exec(`
    SELECT
      s.api_name as automation_name, s.type as automation_type,
      t.api_name as object_name
    FROM edges e
    JOIN nodes s ON e.source_id = s.id
    JOIN nodes t ON e.target_id = t.id
    WHERE s.type IN ('Flow', 'ApexTrigger', 'ProcessBuilder', 'WorkflowRule')
      AND t.type = 'CustomObject'
  `);

  const lines = ['Automation Name,Type,Label,Status,Target Object,Process Type'];

  const automations = automationResult[0]?.values || [];
  const relations = relationsResult[0]?.values || [];

  // Create a map of automation to objects
  const automationObjects: Record<string, string[]> = {};
  relations.forEach((row: any) => {
    const name = row[0];
    const obj = row[2];
    if (!automationObjects[name]) automationObjects[name] = [];
    automationObjects[name].push(obj);
  });

  automations.forEach((row: any) => {
    const apiName = row[0];
    const type = row[1];
    const label = row[2] || apiName;
    const metadata = row[3] ? JSON.parse(row[3]) : {};
    const status = metadata.status || 'Unknown';
    const processType = metadata.processType || '';
    const objects = automationObjects[apiName]?.join('; ') || '';
    lines.push(`${apiName},${type},${label},${status},${objects},${processType}`);
  });

  return lines.join('\n');
}

function exportAllForLucidchart(db: any): string {
  // Comprehensive export for Lucidchart intelligent diagramming
  // This format works well with Lucidchart's "Import Data" feature

  const nodesResult = db.exec(`
    SELECT id, api_name, type, label
    FROM nodes
    ORDER BY type, api_name
  `);

  const edgesResult = db.exec(`
    SELECT
      s.api_name as source, s.type as source_type,
      t.api_name as target, t.type as target_type,
      e.relation_type
    FROM edges e
    JOIN nodes s ON e.source_id = s.id
    JOIN nodes t ON e.target_id = t.id
  `);

  // Lucidchart CSV format for linked data
  const lines = ['Id,Name,Type,Label,Shape'];

  // Add all nodes
  const nodes = nodesResult[0]?.values || [];
  nodes.forEach((row: any) => {
    const id = row[0];
    const name = row[1];
    const type = row[2];
    const label = row[3] || name;
    const shape = getShapeForType(type);
    lines.push(`${id},"${name}","${type}","${label}","${shape}"`);
  });

  // Add blank line then connections
  lines.push('');
  lines.push('Source,Target,Relationship,Line Style');

  const edges = edgesResult[0]?.values || [];
  edges.forEach((row: any) => {
    const source = row[0];
    const target = row[2];
    const relation = row[4];
    const lineStyle = getLineStyleForRelation(relation);
    lines.push(`"${source}","${target}","${relation}","${lineStyle}"`);
  });

  return lines.join('\n');
}

function getShapeForType(type: string): string {
  const shapes: Record<string, string> = {
    'CustomObject': 'Rectangle',
    'CustomField': 'RoundedRectangle',
    'Flow': 'Diamond',
    'ApexClass': 'Parallelogram',
    'ApexTrigger': 'Hexagon',
    'LWC': 'Circle',
    'Layout': 'Document',
    'PermissionSet': 'Pentagon',
  };
  return shapes[type] || 'Rectangle';
}

function getLineStyleForRelation(relation: string): string {
  const styles: Record<string, string> = {
    'Lookup': 'Dashed',
    'MasterDetail': 'Solid',
    'References': 'Dotted',
    'Uses': 'Solid',
  };
  return styles[relation] || 'Solid';
}
