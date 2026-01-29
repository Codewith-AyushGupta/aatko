/**
 * Multi-Client Database Schema
 *
 * Core domain entities for hosted-first, multi-client architecture:
 * - ClientWorkspace: Client/organization container
 * - OrgConnection: Salesforce org connections per client
 * - SnapshotRun: Metadata extraction jobs
 * - Artifact: Generated outputs (descriptions, reports)
 * - ExportRun: GitHub export attempts
 * - AuditEvent: Append-only audit log
 *
 * All entities are scoped to a ClientWorkspace for data isolation.
 */

// =============================================================================
// SQL Schema Definitions
// =============================================================================

export const SCHEMA_VERSION = 1;

/**
 * Migration scripts - executed in order
 * Each migration is idempotent (safe to run multiple times)
 */
export const MIGRATIONS: Array<{
  version: number;
  name: string;
  up: string;
  down: string;
}> = [
  {
    version: 1,
    name: 'create_multi_client_tables',
    up: `
      -- Schema version tracking
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        applied_at TEXT DEFAULT (datetime('now'))
      );

      -- Client Workspaces (top-level data isolation)
      CREATE TABLE IF NOT EXISTS client_workspaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        created_by TEXT,
        settings_json TEXT DEFAULT '{}'
      );
      CREATE INDEX IF NOT EXISTS idx_client_workspaces_slug ON client_workspaces(slug);
      CREATE INDEX IF NOT EXISTS idx_client_workspaces_active ON client_workspaces(is_active);

      -- Org Connections (Salesforce orgs per client)
      CREATE TABLE IF NOT EXISTS org_connections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL REFERENCES client_workspaces(id) ON DELETE CASCADE,
        alias TEXT NOT NULL,
        org_id TEXT,
        instance_url TEXT,
        environment TEXT NOT NULL CHECK (environment IN ('production', 'sandbox', 'scratch', 'developer')),
        auth_type TEXT NOT NULL CHECK (auth_type IN ('oauth', 'jwt', 'cli')),
        is_active INTEGER DEFAULT 1,
        is_default INTEGER DEFAULT 0,
        last_connected_at TEXT,
        last_sync_at TEXT,
        connection_status TEXT DEFAULT 'disconnected',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        created_by TEXT,
        metadata_json TEXT DEFAULT '{}',
        UNIQUE(client_id, alias)
      );
      CREATE INDEX IF NOT EXISTS idx_org_connections_client ON org_connections(client_id);
      CREATE INDEX IF NOT EXISTS idx_org_connections_active ON org_connections(is_active);
      CREATE INDEX IF NOT EXISTS idx_org_connections_env ON org_connections(environment);

      -- Snapshot Runs (metadata extraction jobs)
      CREATE TABLE IF NOT EXISTS snapshot_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL REFERENCES client_workspaces(id) ON DELETE CASCADE,
        org_connection_id INTEGER NOT NULL REFERENCES org_connections(id) ON DELETE CASCADE,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
        progress INTEGER DEFAULT 0,
        progress_message TEXT,
        started_at TEXT,
        completed_at TEXT,
        triggered_by TEXT,
        trigger_type TEXT DEFAULT 'manual' CHECK (trigger_type IN ('manual', 'scheduled', 'webhook')),
        error_message TEXT,
        stats_json TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_snapshot_runs_client ON snapshot_runs(client_id);
      CREATE INDEX IF NOT EXISTS idx_snapshot_runs_org ON snapshot_runs(org_connection_id);
      CREATE INDEX IF NOT EXISTS idx_snapshot_runs_status ON snapshot_runs(status);
      CREATE INDEX IF NOT EXISTS idx_snapshot_runs_created ON snapshot_runs(created_at);

      -- Artifacts (generated outputs with versioning)
      CREATE TABLE IF NOT EXISTS artifacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL REFERENCES client_workspaces(id) ON DELETE CASCADE,
        org_connection_id INTEGER NOT NULL REFERENCES org_connections(id) ON DELETE CASCADE,
        snapshot_run_id INTEGER REFERENCES snapshot_runs(id) ON DELETE SET NULL,
        artifact_type TEXT NOT NULL CHECK (artifact_type IN ('description', 'analysis', 'report', 'retirement_package', 'export_bundle')),
        name TEXT NOT NULL,
        version INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'review', 'approved', 'published', 'archived')),
        storage_key TEXT,
        content_type TEXT DEFAULT 'application/json',
        size_bytes INTEGER,
        checksum TEXT,
        metadata_json TEXT DEFAULT '{}',
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        created_by TEXT,
        approved_by TEXT,
        approved_at TEXT,
        UNIQUE(client_id, org_connection_id, artifact_type, name, version)
      );
      CREATE INDEX IF NOT EXISTS idx_artifacts_client ON artifacts(client_id);
      CREATE INDEX IF NOT EXISTS idx_artifacts_org ON artifacts(org_connection_id);
      CREATE INDEX IF NOT EXISTS idx_artifacts_snapshot ON artifacts(snapshot_run_id);
      CREATE INDEX IF NOT EXISTS idx_artifacts_type ON artifacts(artifact_type);
      CREATE INDEX IF NOT EXISTS idx_artifacts_status ON artifacts(status);

      -- Export Runs (GitHub export attempts)
      CREATE TABLE IF NOT EXISTS export_runs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER NOT NULL REFERENCES client_workspaces(id) ON DELETE CASCADE,
        org_connection_id INTEGER NOT NULL REFERENCES org_connections(id) ON DELETE CASCADE,
        snapshot_run_id INTEGER REFERENCES snapshot_runs(id) ON DELETE SET NULL,
        artifact_id INTEGER REFERENCES artifacts(id) ON DELETE SET NULL,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
        export_type TEXT NOT NULL DEFAULT 'github_pr' CHECK (export_type IN ('github_pr', 'download', 's3')),
        branch_name TEXT,
        pr_url TEXT,
        pr_number INTEGER,
        commit_sha TEXT,
        manifest_json TEXT,
        error_message TEXT,
        started_at TEXT,
        completed_at TEXT,
        triggered_by TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_export_runs_client ON export_runs(client_id);
      CREATE INDEX IF NOT EXISTS idx_export_runs_org ON export_runs(org_connection_id);
      CREATE INDEX IF NOT EXISTS idx_export_runs_status ON export_runs(status);

      -- Audit Events (append-only log)
      CREATE TABLE IF NOT EXISTS audit_events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER REFERENCES client_workspaces(id) ON DELETE SET NULL,
        org_connection_id INTEGER REFERENCES org_connections(id) ON DELETE SET NULL,
        event_type TEXT NOT NULL,
        event_category TEXT NOT NULL CHECK (event_category IN ('auth', 'client', 'org', 'snapshot', 'artifact', 'export', 'system')),
        actor TEXT,
        actor_type TEXT DEFAULT 'user' CHECK (actor_type IN ('user', 'system', 'webhook')),
        resource_type TEXT,
        resource_id TEXT,
        details_json TEXT DEFAULT '{}',
        ip_address TEXT,
        user_agent TEXT,
        created_at TEXT DEFAULT (datetime('now'))
      );
      CREATE INDEX IF NOT EXISTS idx_audit_events_client ON audit_events(client_id);
      CREATE INDEX IF NOT EXISTS idx_audit_events_type ON audit_events(event_type);
      CREATE INDEX IF NOT EXISTS idx_audit_events_category ON audit_events(event_category);
      CREATE INDEX IF NOT EXISTS idx_audit_events_created ON audit_events(created_at);
      CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit_events(actor);

      -- User Roles (RBAC - simple version for MVP)
      CREATE TABLE IF NOT EXISTS user_roles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        client_id INTEGER REFERENCES client_workspaces(id) ON DELETE CASCADE,
        user_email TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'editor', 'approver', 'viewer')),
        granted_at TEXT DEFAULT (datetime('now')),
        granted_by TEXT,
        is_active INTEGER DEFAULT 1,
        UNIQUE(client_id, user_email)
      );
      CREATE INDEX IF NOT EXISTS idx_user_roles_client ON user_roles(client_id);
      CREATE INDEX IF NOT EXISTS idx_user_roles_email ON user_roles(user_email);

      -- App Settings (key-value store for app-wide settings)
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT,
        updated_at TEXT DEFAULT (datetime('now')),
        updated_by TEXT
      );
    `,
    down: `
      DROP TABLE IF EXISTS app_settings;
      DROP TABLE IF EXISTS user_roles;
      DROP TABLE IF EXISTS audit_events;
      DROP TABLE IF EXISTS export_runs;
      DROP TABLE IF EXISTS artifacts;
      DROP TABLE IF EXISTS snapshot_runs;
      DROP TABLE IF EXISTS org_connections;
      DROP TABLE IF EXISTS client_workspaces;
      DROP TABLE IF EXISTS schema_migrations;
    `,
  },
];

// =============================================================================
// TypeScript Interfaces
// =============================================================================

export interface ClientWorkspace {
  id: number;
  slug: string;
  name: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  settings_json: string;
}

export type OrgEnvironment = 'production' | 'sandbox' | 'scratch' | 'developer';
export type AuthType = 'oauth' | 'jwt' | 'cli';
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'refreshing';

export interface OrgConnection {
  id: number;
  client_id: number;
  alias: string;
  org_id: string | null;
  instance_url: string | null;
  environment: OrgEnvironment;
  auth_type: AuthType;
  is_active: boolean;
  is_default: boolean;
  last_connected_at: string | null;
  last_sync_at: string | null;
  connection_status: ConnectionStatus;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  metadata_json: string;
}

export type SnapshotStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type TriggerType = 'manual' | 'scheduled' | 'webhook';

export interface SnapshotRun {
  id: number;
  client_id: number;
  org_connection_id: number;
  status: SnapshotStatus;
  progress: number;
  progress_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  triggered_by: string | null;
  trigger_type: TriggerType;
  error_message: string | null;
  stats_json: string;
  created_at: string;
}

export type ArtifactType = 'description' | 'analysis' | 'report' | 'retirement_package' | 'export_bundle';
export type ArtifactStatus = 'draft' | 'review' | 'approved' | 'published' | 'archived';

export interface Artifact {
  id: number;
  client_id: number;
  org_connection_id: number;
  snapshot_run_id: number | null;
  artifact_type: ArtifactType;
  name: string;
  version: number;
  status: ArtifactStatus;
  storage_key: string | null;
  content_type: string;
  size_bytes: number | null;
  checksum: string | null;
  metadata_json: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  approved_by: string | null;
  approved_at: string | null;
}

export type ExportStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
export type ExportType = 'github_pr' | 'download' | 's3';

export interface ExportRun {
  id: number;
  client_id: number;
  org_connection_id: number;
  snapshot_run_id: number | null;
  artifact_id: number | null;
  status: ExportStatus;
  export_type: ExportType;
  branch_name: string | null;
  pr_url: string | null;
  pr_number: number | null;
  commit_sha: string | null;
  manifest_json: string | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
  triggered_by: string | null;
  created_at: string;
}

export type EventCategory = 'auth' | 'client' | 'org' | 'snapshot' | 'artifact' | 'export' | 'system';
export type ActorType = 'user' | 'system' | 'webhook';

export interface AuditEvent {
  id: number;
  client_id: number | null;
  org_connection_id: number | null;
  event_type: string;
  event_category: EventCategory;
  actor: string | null;
  actor_type: ActorType;
  resource_type: string | null;
  resource_id: string | null;
  details_json: string;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export type UserRole = 'admin' | 'editor' | 'approver' | 'viewer';

export interface UserRoleAssignment {
  id: number;
  client_id: number | null;
  user_email: string;
  role: UserRole;
  granted_at: string;
  granted_by: string | null;
  is_active: boolean;
}

// =============================================================================
// Slug/Path Safety Utilities
// =============================================================================

/**
 * Convert a string to a safe slug (kebab-case, lowercase, alphanumeric + hyphens)
 */
export function toSlug(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')  // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')       // Remove leading/trailing hyphens
    .substring(0, 50);             // Limit length
}

/**
 * Validate a slug is safe for file paths and URLs
 */
export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) && slug.length <= 50;
}

/**
 * Generate export path following convention:
 * /clients/<client_slug>/orgs/<env>/<org_alias>/snapshots/<YYYY-MM-DD>/<snapshot_id>/
 */
export function generateExportPath(
  clientSlug: string,
  environment: OrgEnvironment,
  orgAlias: string,
  snapshotId: number,
  date?: Date
): string {
  const d = date || new Date();
  const dateStr = d.toISOString().split('T')[0]; // YYYY-MM-DD

  return `clients/${toSlug(clientSlug)}/orgs/${environment}/${toSlug(orgAlias)}/snapshots/${dateStr}/${snapshotId}`;
}

/**
 * Generate branch name for GitHub export:
 * export/<client_slug>/<env>/<YYYYMMDD>-<shortid>
 */
export function generateBranchName(
  clientSlug: string,
  environment: OrgEnvironment,
  shortId: string,
  date?: Date
): string {
  const d = date || new Date();
  const dateStr = d.toISOString().split('T')[0].replace(/-/g, '');

  return `export/${toSlug(clientSlug)}/${environment}/${dateStr}-${shortId}`;
}
