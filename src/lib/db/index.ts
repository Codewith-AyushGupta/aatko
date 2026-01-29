/**
 * Database Module
 *
 * Provides access to:
 * - Multi-client schema and types
 * - Migration system
 * - Repository pattern for data access
 * - Database initialization
 */

// Schema and types
export * from './schema';

// Migrations
export {
  getCurrentVersion,
  getAppliedMigrations,
  runMigrations,
  rollbackMigrations,
  needsMigration,
  getMigrationStatus,
  type MigrationResult,
} from './migrations';

// Repositories
export {
  ClientWorkspaceRepository,
  OrgConnectionRepository,
  SnapshotRunRepository,
  AuditEventRepository,
  createRepositories,
  type CreateClientInput,
  type UpdateClientInput,
  type CreateOrgConnectionInput,
  type UpdateOrgConnectionInput,
  type CreateSnapshotRunInput,
  type UpdateSnapshotRunInput,
  type CreateAuditEventInput,
} from './repositories';

// Re-export the existing database functions from the legacy location
// These will be gradually migrated to use the new multi-client schema
import { getDatabase as getLegacyDatabase } from '../db';
export { getLegacyDatabase };

import { runMigrations } from './migrations';
import { logger } from '../logger';

let _initialized = false;

/**
 * Initialize the multi-client database schema
 * Should be called at application startup
 */
export async function initializeMultiClientDb(): Promise<void> {
  if (_initialized) return;

  const db = await getLegacyDatabase();
  if (!db) {
    logger.warn('Database not available, skipping multi-client initialization');
    return;
  }

  try {
    const result = await runMigrations(db);
    if (result.success) {
      logger.info('Multi-client database initialized', {
        version: result.currentVersion,
        migrationsApplied: result.appliedMigrations.length,
      });
      _initialized = true;
    } else {
      logger.error('Multi-client database initialization failed', {
        error: result.error,
      });
    }
  } finally {
    db.close();
  }
}

/**
 * Get a database connection with repositories
 */
export async function getDbWithRepositories() {
  const db = await getLegacyDatabase();
  if (!db) {
    return null;
  }

  // Ensure multi-client tables exist
  if (!_initialized) {
    await initializeMultiClientDb();
  }

  return {
    db,
    repos: {
      clients: new (await import('./repositories')).ClientWorkspaceRepository(db),
      orgs: new (await import('./repositories')).OrgConnectionRepository(db),
      snapshots: new (await import('./repositories')).SnapshotRunRepository(db),
      audit: new (await import('./repositories')).AuditEventRepository(db),
    },
    close: () => db.close(),
  };
}
