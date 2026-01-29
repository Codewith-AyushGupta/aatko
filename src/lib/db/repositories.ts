/**
 * Data Access Layer for Multi-Client Entities
 *
 * Repository pattern for CRUD operations on:
 * - ClientWorkspace
 * - OrgConnection
 * - SnapshotRun
 * - Artifact
 * - ExportRun
 * - AuditEvent
 */

import type {
  ClientWorkspace,
  OrgConnection,
  OrgEnvironment,
  AuthType,
  SnapshotRun,
  SnapshotStatus,
  TriggerType,
  Artifact,
  ArtifactType,
  ArtifactStatus,
  ExportRun,
  ExportStatus,
  ExportType,
  AuditEvent,
  EventCategory,
  ActorType,
  UserRoleAssignment,
  UserRole,
} from './schema';
import { toSlug, isValidSlug } from './schema';
import { logger } from '../logger';

// =============================================================================
// Helper Functions
// =============================================================================

function rowsToObjects<T>(result: any): T[] {
  if (!result || result.length === 0) return [];
  const columns = result[0].columns;
  return result[0].values.map((row: any[]) => {
    const obj: any = {};
    columns.forEach((col: string, i: number) => {
      // Convert SQLite integers to booleans for is_* fields
      if (col.startsWith('is_') && typeof row[i] === 'number') {
        obj[col] = row[i] === 1;
      } else {
        obj[col] = row[i];
      }
    });
    return obj as T;
  });
}

function firstRow<T>(result: any): T | null {
  const rows = rowsToObjects<T>(result);
  return rows[0] || null;
}

// =============================================================================
// Client Workspace Repository
// =============================================================================

export interface CreateClientInput {
  name: string;
  slug?: string;
  description?: string;
  created_by?: string;
  settings?: Record<string, any>;
}

export interface UpdateClientInput {
  name?: string;
  description?: string;
  is_active?: boolean;
  settings?: Record<string, any>;
}

export class ClientWorkspaceRepository {
  constructor(private db: any) {}

  async create(input: CreateClientInput): Promise<ClientWorkspace> {
    const slug = input.slug || toSlug(input.name);

    if (!isValidSlug(slug)) {
      throw new Error(`Invalid slug: ${slug}`);
    }

    const settingsJson = JSON.stringify(input.settings || {});

    this.db.run(
      `INSERT INTO client_workspaces (slug, name, description, created_by, settings_json)
       VALUES (?, ?, ?, ?, ?)`,
      [slug, input.name, input.description || null, input.created_by || null, settingsJson]
    );

    const result = this.db.exec('SELECT * FROM client_workspaces WHERE slug = ?', [slug]);
    const client = firstRow<ClientWorkspace>(result);

    if (!client) {
      throw new Error('Failed to create client workspace');
    }

    logger.info('Client workspace created', { clientId: client.id, slug: client.slug });
    return client;
  }

  async findById(id: number): Promise<ClientWorkspace | null> {
    const result = this.db.exec('SELECT * FROM client_workspaces WHERE id = ?', [id]);
    return firstRow<ClientWorkspace>(result);
  }

  async findBySlug(slug: string): Promise<ClientWorkspace | null> {
    const result = this.db.exec('SELECT * FROM client_workspaces WHERE slug = ?', [slug]);
    return firstRow<ClientWorkspace>(result);
  }

  async findAll(includeInactive = false): Promise<ClientWorkspace[]> {
    const query = includeInactive
      ? 'SELECT * FROM client_workspaces ORDER BY name'
      : 'SELECT * FROM client_workspaces WHERE is_active = 1 ORDER BY name';
    const result = this.db.exec(query);
    return rowsToObjects<ClientWorkspace>(result);
  }

  async update(id: number, input: UpdateClientInput): Promise<ClientWorkspace | null> {
    const sets: string[] = [];
    const values: any[] = [];

    if (input.name !== undefined) {
      sets.push('name = ?');
      values.push(input.name);
    }
    if (input.description !== undefined) {
      sets.push('description = ?');
      values.push(input.description);
    }
    if (input.is_active !== undefined) {
      sets.push('is_active = ?');
      values.push(input.is_active ? 1 : 0);
    }
    if (input.settings !== undefined) {
      sets.push('settings_json = ?');
      values.push(JSON.stringify(input.settings));
    }

    if (sets.length === 0) return this.findById(id);

    sets.push("updated_at = datetime('now')");
    values.push(id);

    this.db.run(`UPDATE client_workspaces SET ${sets.join(', ')} WHERE id = ?`, values);

    return this.findById(id);
  }

  async delete(id: number): Promise<boolean> {
    this.db.run('DELETE FROM client_workspaces WHERE id = ?', [id]);
    return true;
  }

  async count(): Promise<number> {
    const result = this.db.exec('SELECT COUNT(*) as count FROM client_workspaces WHERE is_active = 1');
    return result[0]?.values[0]?.[0] as number || 0;
  }
}

// =============================================================================
// Org Connection Repository
// =============================================================================

export interface CreateOrgConnectionInput {
  client_id: number;
  alias: string;
  org_id?: string;
  instance_url?: string;
  environment: OrgEnvironment;
  auth_type: AuthType;
  created_by?: string;
  metadata?: Record<string, any>;
}

export interface UpdateOrgConnectionInput {
  alias?: string;
  org_id?: string;
  instance_url?: string;
  environment?: OrgEnvironment;
  auth_type?: AuthType;
  is_active?: boolean;
  is_default?: boolean;
  connection_status?: string;
  metadata?: Record<string, any>;
}

export class OrgConnectionRepository {
  constructor(private db: any) {}

  async create(input: CreateOrgConnectionInput): Promise<OrgConnection> {
    const metadataJson = JSON.stringify(input.metadata || {});

    this.db.run(
      `INSERT INTO org_connections
       (client_id, alias, org_id, instance_url, environment, auth_type, created_by, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.client_id,
        input.alias,
        input.org_id || null,
        input.instance_url || null,
        input.environment,
        input.auth_type,
        input.created_by || null,
        metadataJson,
      ]
    );

    const result = this.db.exec(
      'SELECT * FROM org_connections WHERE client_id = ? AND alias = ?',
      [input.client_id, input.alias]
    );
    const org = firstRow<OrgConnection>(result);

    if (!org) {
      throw new Error('Failed to create org connection');
    }

    logger.info('Org connection created', { orgId: org.id, alias: org.alias, clientId: org.client_id });
    return org;
  }

  async findById(id: number): Promise<OrgConnection | null> {
    const result = this.db.exec('SELECT * FROM org_connections WHERE id = ?', [id]);
    return firstRow<OrgConnection>(result);
  }

  async findByClientId(clientId: number, includeInactive = false): Promise<OrgConnection[]> {
    const query = includeInactive
      ? 'SELECT * FROM org_connections WHERE client_id = ? ORDER BY is_default DESC, alias'
      : 'SELECT * FROM org_connections WHERE client_id = ? AND is_active = 1 ORDER BY is_default DESC, alias';
    const result = this.db.exec(query, [clientId]);
    return rowsToObjects<OrgConnection>(result);
  }

  async findDefault(clientId: number): Promise<OrgConnection | null> {
    const result = this.db.exec(
      'SELECT * FROM org_connections WHERE client_id = ? AND is_default = 1 AND is_active = 1',
      [clientId]
    );
    return firstRow<OrgConnection>(result);
  }

  async update(id: number, input: UpdateOrgConnectionInput): Promise<OrgConnection | null> {
    const sets: string[] = [];
    const values: any[] = [];

    if (input.alias !== undefined) {
      sets.push('alias = ?');
      values.push(input.alias);
    }
    if (input.org_id !== undefined) {
      sets.push('org_id = ?');
      values.push(input.org_id);
    }
    if (input.instance_url !== undefined) {
      sets.push('instance_url = ?');
      values.push(input.instance_url);
    }
    if (input.environment !== undefined) {
      sets.push('environment = ?');
      values.push(input.environment);
    }
    if (input.auth_type !== undefined) {
      sets.push('auth_type = ?');
      values.push(input.auth_type);
    }
    if (input.is_active !== undefined) {
      sets.push('is_active = ?');
      values.push(input.is_active ? 1 : 0);
    }
    if (input.is_default !== undefined) {
      sets.push('is_default = ?');
      values.push(input.is_default ? 1 : 0);
    }
    if (input.connection_status !== undefined) {
      sets.push('connection_status = ?');
      values.push(input.connection_status);
    }
    if (input.metadata !== undefined) {
      sets.push('metadata_json = ?');
      values.push(JSON.stringify(input.metadata));
    }

    if (sets.length === 0) return this.findById(id);

    sets.push("updated_at = datetime('now')");
    values.push(id);

    this.db.run(`UPDATE org_connections SET ${sets.join(', ')} WHERE id = ?`, values);

    return this.findById(id);
  }

  async setDefault(clientId: number, orgId: number): Promise<void> {
    // Clear existing default
    this.db.run('UPDATE org_connections SET is_default = 0 WHERE client_id = ?', [clientId]);
    // Set new default
    this.db.run('UPDATE org_connections SET is_default = 1 WHERE id = ? AND client_id = ?', [orgId, clientId]);
  }

  async updateLastSync(id: number): Promise<void> {
    this.db.run(
      "UPDATE org_connections SET last_sync_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
      [id]
    );
  }

  async updateConnectionStatus(id: number, status: string): Promise<void> {
    this.db.run(
      "UPDATE org_connections SET connection_status = ?, last_connected_at = datetime('now'), updated_at = datetime('now') WHERE id = ?",
      [status, id]
    );
  }

  async delete(id: number): Promise<boolean> {
    this.db.run('DELETE FROM org_connections WHERE id = ?', [id]);
    return true;
  }
}

// =============================================================================
// Snapshot Run Repository
// =============================================================================

export interface CreateSnapshotRunInput {
  client_id: number;
  org_connection_id: number;
  triggered_by?: string;
  trigger_type?: TriggerType;
}

export interface UpdateSnapshotRunInput {
  status?: SnapshotStatus;
  progress?: number;
  progress_message?: string;
  error_message?: string;
  stats?: Record<string, any>;
}

export class SnapshotRunRepository {
  constructor(private db: any) {}

  async create(input: CreateSnapshotRunInput): Promise<SnapshotRun> {
    this.db.run(
      `INSERT INTO snapshot_runs (client_id, org_connection_id, triggered_by, trigger_type)
       VALUES (?, ?, ?, ?)`,
      [input.client_id, input.org_connection_id, input.triggered_by || null, input.trigger_type || 'manual']
    );

    const result = this.db.exec('SELECT * FROM snapshot_runs WHERE id = last_insert_rowid()');
    const snapshot = firstRow<SnapshotRun>(result);

    if (!snapshot) {
      throw new Error('Failed to create snapshot run');
    }

    logger.info('Snapshot run created', { snapshotId: snapshot.id, clientId: snapshot.client_id });
    return snapshot;
  }

  async findById(id: number): Promise<SnapshotRun | null> {
    const result = this.db.exec('SELECT * FROM snapshot_runs WHERE id = ?', [id]);
    return firstRow<SnapshotRun>(result);
  }

  async findByClientId(clientId: number, limit = 20): Promise<SnapshotRun[]> {
    const result = this.db.exec(
      'SELECT * FROM snapshot_runs WHERE client_id = ? ORDER BY created_at DESC LIMIT ?',
      [clientId, limit]
    );
    return rowsToObjects<SnapshotRun>(result);
  }

  async findByOrgId(orgConnectionId: number, limit = 20): Promise<SnapshotRun[]> {
    const result = this.db.exec(
      'SELECT * FROM snapshot_runs WHERE org_connection_id = ? ORDER BY created_at DESC LIMIT ?',
      [orgConnectionId, limit]
    );
    return rowsToObjects<SnapshotRun>(result);
  }

  async findRunning(): Promise<SnapshotRun[]> {
    const result = this.db.exec("SELECT * FROM snapshot_runs WHERE status IN ('pending', 'running')");
    return rowsToObjects<SnapshotRun>(result);
  }

  async update(id: number, input: UpdateSnapshotRunInput): Promise<SnapshotRun | null> {
    const sets: string[] = [];
    const values: any[] = [];

    if (input.status !== undefined) {
      sets.push('status = ?');
      values.push(input.status);

      if (input.status === 'running') {
        sets.push("started_at = datetime('now')");
      } else if (['completed', 'failed', 'cancelled'].includes(input.status)) {
        sets.push("completed_at = datetime('now')");
      }
    }
    if (input.progress !== undefined) {
      sets.push('progress = ?');
      values.push(input.progress);
    }
    if (input.progress_message !== undefined) {
      sets.push('progress_message = ?');
      values.push(input.progress_message);
    }
    if (input.error_message !== undefined) {
      sets.push('error_message = ?');
      values.push(input.error_message);
    }
    if (input.stats !== undefined) {
      sets.push('stats_json = ?');
      values.push(JSON.stringify(input.stats));
    }

    if (sets.length === 0) return this.findById(id);

    values.push(id);
    this.db.run(`UPDATE snapshot_runs SET ${sets.join(', ')} WHERE id = ?`, values);

    return this.findById(id);
  }
}

// =============================================================================
// Audit Event Repository
// =============================================================================

export interface CreateAuditEventInput {
  client_id?: number;
  org_connection_id?: number;
  event_type: string;
  event_category: EventCategory;
  actor?: string;
  actor_type?: ActorType;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export class AuditEventRepository {
  constructor(private db: any) {}

  async create(input: CreateAuditEventInput): Promise<AuditEvent> {
    const detailsJson = JSON.stringify(input.details || {});

    this.db.run(
      `INSERT INTO audit_events
       (client_id, org_connection_id, event_type, event_category, actor, actor_type,
        resource_type, resource_id, details_json, ip_address, user_agent)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.client_id || null,
        input.org_connection_id || null,
        input.event_type,
        input.event_category,
        input.actor || null,
        input.actor_type || 'user',
        input.resource_type || null,
        input.resource_id || null,
        detailsJson,
        input.ip_address || null,
        input.user_agent || null,
      ]
    );

    const result = this.db.exec('SELECT * FROM audit_events WHERE id = last_insert_rowid()');
    const event = firstRow<AuditEvent>(result);

    if (!event) {
      throw new Error('Failed to create audit event');
    }

    return event;
  }

  async findByClientId(clientId: number, limit = 100): Promise<AuditEvent[]> {
    const result = this.db.exec(
      'SELECT * FROM audit_events WHERE client_id = ? ORDER BY created_at DESC LIMIT ?',
      [clientId, limit]
    );
    return rowsToObjects<AuditEvent>(result);
  }

  async findByCategory(category: EventCategory, clientId?: number, limit = 100): Promise<AuditEvent[]> {
    if (clientId) {
      const result = this.db.exec(
        'SELECT * FROM audit_events WHERE event_category = ? AND client_id = ? ORDER BY created_at DESC LIMIT ?',
        [category, clientId, limit]
      );
      return rowsToObjects<AuditEvent>(result);
    }

    const result = this.db.exec(
      'SELECT * FROM audit_events WHERE event_category = ? ORDER BY created_at DESC LIMIT ?',
      [category, limit]
    );
    return rowsToObjects<AuditEvent>(result);
  }

  async findRecent(limit = 50): Promise<AuditEvent[]> {
    const result = this.db.exec(
      'SELECT * FROM audit_events ORDER BY created_at DESC LIMIT ?',
      [limit]
    );
    return rowsToObjects<AuditEvent>(result);
  }
}

// =============================================================================
// Repository Factory
// =============================================================================

export function createRepositories(db: any) {
  return {
    clients: new ClientWorkspaceRepository(db),
    orgs: new OrgConnectionRepository(db),
    snapshots: new SnapshotRunRepository(db),
    audit: new AuditEventRepository(db),
  };
}
