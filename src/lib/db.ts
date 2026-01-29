import path from 'path';
import fs from 'fs';

// Get the monorepo root by finding it relative to this file
// __dirname gives us apps/web/src/lib, so we go up 4 levels to get the root
const getMonorepoRoot = () => {
  // Try __dirname approach first (works in Node.js)
  const fromDirname = path.resolve(__dirname, '..', '..', '..', '..');
  if (fs.existsSync(path.join(fromDirname, 'packages', 'indexer', 'data'))) {
    return fromDirname;
  }

  // Fall back to process.cwd() based approaches
  const cwd = process.cwd();

  // Check if we're running from apps/web
  if (cwd.endsWith('apps/web') || cwd.endsWith('apps\\web')) {
    return path.resolve(cwd, '..', '..');
  }

  // Check if we're running from the monorepo root
  if (fs.existsSync(path.join(cwd, 'packages', 'indexer', 'data'))) {
    return cwd;
  }

  // Last resort: try going up from cwd
  return path.resolve(cwd, '..', '..');
};

const MONOREPO_ROOT = getMonorepoRoot();
const DB_PATH = path.join(MONOREPO_ROOT, 'packages', 'indexer', 'data', 'metadata.db');

// Cache for SQL.js instance
let SQL: any = null;

async function initSql() {
  if (!SQL) {
    // Use require for Node.js compatibility
    const initSqlJs = require('sql.js');
    // Use the wasm file from node_modules
    const wasmPath = path.join(
      process.cwd(),
      'public',
      'wasm',
      'sql-wasm.wasm'
    );

    const wasmBinary = fs.readFileSync(wasmPath);
    SQL = await initSqlJs({
      wasmBinary
    });
  }
  return SQL;
}

export async function getDatabase(): Promise<any | null> {
  if (!fs.existsSync(DB_PATH)) {
    console.log('Database not found at:', DB_PATH);
    return null;
  }
  const SqlJs = await initSql();
  const buffer = fs.readFileSync(DB_PATH);
  return new SqlJs.Database(buffer);
}

export interface Stats {
  objects: number;
  fields: number;
  flows: number;
  apexClasses: number;
  apexTriggers: number;
  lwc: number;
  layouts: number;
  permissionSets: number;
  profiles: number;
  flexiPages: number;
  validationRules: number;
  quickActions: number;
  recordTypes: number;
}

export async function getStats(): Promise<Stats> {
  const db = await getDatabase();
  if (!db) {
    return {
      objects: 0,
      fields: 0,
      flows: 0,
      apexClasses: 0,
      apexTriggers: 0,
      lwc: 0,
      layouts: 0,
      permissionSets: 0,
      profiles: 0,
      flexiPages: 0,
      validationRules: 0,
      quickActions: 0,
      recordTypes: 0,
    };
  }

  try {
    const countByType = (type: string) => {
      const result = db.exec(`SELECT COUNT(*) as count FROM nodes WHERE type = '${type}'`);
      return result[0]?.values[0]?.[0] as number || 0;
    };

    return {
      objects: countByType('Object'),
      fields: countByType('Field'),
      flows: countByType('Flow'),
      apexClasses: countByType('ApexClass'),
      apexTriggers: countByType('ApexTrigger'),
      lwc: countByType('LWC'),
      layouts: countByType('Layout'),
      permissionSets: countByType('PermissionSet'),
      profiles: countByType('Profile'),
      flexiPages: countByType('FlexiPage'),
      validationRules: countByType('ValidationRule'),
      quickActions: countByType('QuickAction'),
      recordTypes: countByType('RecordType'),
    };
  } finally {
    db.close();
  }
}

export interface NodeListItem {
  id: number;
  api_name: string;
  label: string | null;
  type: string;
  metadata_json?: string | null;
  record_count?: number;
  population_rate?: number;
  sf_created_date?: string | null;
  sf_created_by_name?: string | null;
  sf_last_modified_date?: string | null;
  sf_last_modified_by_name?: string | null;
}

function rowsToObjects<T>(result: any): T[] {
  if (!result || result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map((row: any[]) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => {
      obj[col] = row[i];
    });
    return obj as T;
  });
}

export async function getNodes(type: string, limit = 100, offset = 0): Promise<NodeListItem[]> {
  const db = await getDatabase();
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT n.id, n.api_name, n.label, n.type,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate
      FROM nodes n
      LEFT JOIN analytics a ON n.id = a.node_id
      WHERE n.type = '${type}'
      GROUP BY n.id
      ORDER BY n.api_name
      LIMIT ${limit} OFFSET ${offset}
    `);
    return rowsToObjects<NodeListItem>(result);
  } finally {
    db.close();
  }
}

export interface NodeDetail {
  id: number;
  api_name: string;
  label: string | null;
  type: string;
  file_path: string | null;
  metadata_json: string | null;
  parent_id: number | null;
}

export async function getNode(id: number): Promise<NodeDetail | null> {
  const db = await getDatabase();
  if (!db) return null;

  try {
    const result = db.exec(`SELECT * FROM nodes WHERE id = ${id}`);
    const rows = rowsToObjects<NodeDetail>(result);
    return rows[0] || null;
  } finally {
    db.close();
  }
}

export async function getNodeByName(apiName: string, type: string): Promise<NodeDetail | null> {
  const db = await getDatabase();
  if (!db) return null;

  try {
    const escapedName = apiName.replace(/'/g, "''");
    const escapedType = type.replace(/'/g, "''");
    const result = db.exec(`SELECT * FROM nodes WHERE api_name = '${escapedName}' AND type = '${escapedType}'`);
    const rows = rowsToObjects<NodeDetail>(result);
    return rows[0] || null;
  } finally {
    db.close();
  }
}

export async function getChildNodes(parentId: number): Promise<NodeListItem[]> {
  const db = await getDatabase();
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT n.id, n.api_name, n.label, n.type, n.metadata_json,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name,
        MAX(CASE WHEN a.metric_type = 'record_count' THEN a.metric_value END) as record_count,
        MAX(CASE WHEN a.metric_type = 'population_rate' THEN a.metric_value END) as population_rate
      FROM nodes n
      LEFT JOIN analytics a ON n.id = a.node_id
      WHERE n.parent_id = ${parentId}
      GROUP BY n.id
      ORDER BY n.type, n.api_name
    `);
    return rowsToObjects<NodeListItem>(result);
  } finally {
    db.close();
  }
}

export interface EdgeWithNode {
  edge_type: string;
  node_id: number;
  node_api_name: string;
  node_label: string | null;
  node_type: string;
  sf_created_date?: string | null;
  sf_created_by_name?: string | null;
  sf_last_modified_date?: string | null;
  sf_last_modified_by_name?: string | null;
}

export async function getIncomingEdges(nodeId: number): Promise<EdgeWithNode[]> {
  const db = await getDatabase();
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type,
        n.sf_created_date, n.sf_created_by_name, n.sf_last_modified_date, n.sf_last_modified_by_name
      FROM edges e
      JOIN nodes n ON e.source_id = n.id
      WHERE e.target_id = ${nodeId}
      ORDER BY e.edge_type, n.api_name
    `);
    return rowsToObjects<EdgeWithNode>(result);
  } finally {
    db.close();
  }
}

export async function getOutgoingEdges(nodeId: number): Promise<EdgeWithNode[]> {
  const db = await getDatabase();
  if (!db) return [];

  try {
    const result = db.exec(`
      SELECT e.edge_type, n.id as node_id, n.api_name as node_api_name, n.label as node_label, n.type as node_type
      FROM edges e
      JOIN nodes n ON e.target_id = n.id
      WHERE e.source_id = ${nodeId}
      ORDER BY e.edge_type, n.api_name
    `);
    return rowsToObjects<EdgeWithNode>(result);
  } finally {
    db.close();
  }
}

export async function searchNodes(query: string, limit = 50, type?: string): Promise<NodeListItem[]> {
  const db = await getDatabase();
  if (!db) return [];

  try {
    const escapedQuery = query.replace(/'/g, "''");
    const escapedType = type?.replace(/'/g, "''");

    let whereClause = '';
    if (query && type) {
      whereClause = `WHERE (api_name LIKE '%${escapedQuery}%' OR label LIKE '%${escapedQuery}%') AND type = '${escapedType}'`;
    } else if (query) {
      whereClause = `WHERE api_name LIKE '%${escapedQuery}%' OR label LIKE '%${escapedQuery}%'`;
    } else if (type) {
      whereClause = `WHERE type = '${escapedType}'`;
    }

    const result = db.exec(`
      SELECT id, api_name, label, type
      FROM nodes
      ${whereClause}
      ORDER BY
        CASE WHEN api_name LIKE '${escapedQuery}%' THEN 0 ELSE 1 END,
        type, api_name
      LIMIT ${limit}
    `);
    return rowsToObjects<NodeListItem>(result);
  } finally {
    db.close();
  }
}

export async function getGraphData(nodeId: number, depth = 2): Promise<{ nodes: any[]; edges: any[] }> {
  const db = await getDatabase();
  if (!db) return { nodes: [], edges: [] };

  try {
    const visited = new Set<number>();
    const allNodes: any[] = [];
    const allEdges: any[] = [];

    const traverse = (id: number, currentDepth: number) => {
      if (visited.has(id) || currentDepth > depth) return;
      visited.add(id);

      const nodeResult = db.exec(`SELECT * FROM nodes WHERE id = ${id}`);
      const nodes = rowsToObjects<any>(nodeResult);
      if (nodes[0]) {
        const node = nodes[0];
        allNodes.push({
          id: String(node.id),
          type: node.type.toLowerCase(),
          data: { label: node.api_name, nodeType: node.type },
          position: { x: 0, y: 0 },
        });
      }

      const outgoingResult = db.exec(`SELECT * FROM edges WHERE source_id = ${id}`);
      const incomingResult = db.exec(`SELECT * FROM edges WHERE target_id = ${id}`);
      const outgoing = rowsToObjects<any>(outgoingResult);
      const incoming = rowsToObjects<any>(incomingResult);

      for (const edge of [...outgoing, ...incoming]) {
        allEdges.push({
          id: `${edge.source_id}-${edge.target_id}-${edge.edge_type}`,
          source: String(edge.source_id),
          target: String(edge.target_id),
          label: edge.edge_type.replace(/_/g, ' '),
          animated: edge.edge_type.includes('FLOW'),
        });
        const nextId = edge.source_id === id ? edge.target_id : edge.source_id;
        traverse(nextId, currentDepth + 1);
      }
    };

    traverse(nodeId, 0);

    // Deduplicate edges
    const uniqueEdges = Array.from(
      new Map(allEdges.map(e => [e.id, e])).values()
    );

    return { nodes: allNodes, edges: uniqueEdges };
  } finally {
    db.close();
  }
}
