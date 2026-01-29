/**
 * Database Migration Runner
 *
 * Handles applying and rolling back database migrations.
 * Works with SQLite (dev) and can be extended for PostgreSQL (prod).
 */

import { MIGRATIONS, SCHEMA_VERSION } from './schema';
import { logger } from '../logger';

export interface MigrationResult {
  success: boolean;
  appliedMigrations: number[];
  currentVersion: number;
  error?: string;
}

/**
 * Get the current schema version from the database
 */
export async function getCurrentVersion(db: any): Promise<number> {
  try {
    const result = db.exec('SELECT MAX(version) as version FROM schema_migrations');
    if (result.length > 0 && result[0].values.length > 0) {
      return result[0].values[0][0] as number || 0;
    }
  } catch {
    // Table doesn't exist yet
  }
  return 0;
}

/**
 * Get list of applied migration versions
 */
export async function getAppliedMigrations(db: any): Promise<number[]> {
  try {
    const result = db.exec('SELECT version FROM schema_migrations ORDER BY version');
    if (result.length > 0) {
      return result[0].values.map((row: any[]) => row[0] as number);
    }
  } catch {
    // Table doesn't exist yet
  }
  return [];
}

/**
 * Apply all pending migrations
 */
export async function runMigrations(db: any): Promise<MigrationResult> {
  const appliedMigrations: number[] = [];
  let currentVersion = 0;

  try {
    // Get currently applied migrations
    const applied = await getAppliedMigrations(db);
    currentVersion = applied.length > 0 ? Math.max(...applied) : 0;

    logger.info('Starting migrations', {
      currentVersion,
      targetVersion: SCHEMA_VERSION,
      pendingCount: MIGRATIONS.filter(m => !applied.includes(m.version)).length,
    });

    // Apply each pending migration
    for (const migration of MIGRATIONS) {
      if (applied.includes(migration.version)) {
        logger.debug(`Migration ${migration.version} already applied, skipping`);
        continue;
      }

      logger.info(`Applying migration ${migration.version}: ${migration.name}`);

      try {
        // Run the migration SQL
        db.run(migration.up);

        // Record the migration
        db.run(
          'INSERT INTO schema_migrations (version, name) VALUES (?, ?)',
          [migration.version, migration.name]
        );

        appliedMigrations.push(migration.version);
        currentVersion = migration.version;

        logger.info(`Migration ${migration.version} applied successfully`);
      } catch (error: any) {
        logger.error(`Migration ${migration.version} failed`, { error: error.message });
        throw error;
      }
    }

    logger.info('Migrations completed', {
      appliedCount: appliedMigrations.length,
      currentVersion,
    });

    return {
      success: true,
      appliedMigrations,
      currentVersion,
    };
  } catch (error: any) {
    logger.error('Migration failed', { error: error.message });
    return {
      success: false,
      appliedMigrations,
      currentVersion,
      error: error.message,
    };
  }
}

/**
 * Roll back migrations to a specific version
 */
export async function rollbackMigrations(
  db: any,
  targetVersion: number
): Promise<MigrationResult> {
  const rolledBack: number[] = [];
  let currentVersion = await getCurrentVersion(db);

  try {
    logger.info('Starting rollback', { currentVersion, targetVersion });

    // Get migrations to roll back (in reverse order)
    const toRollback = MIGRATIONS
      .filter(m => m.version > targetVersion && m.version <= currentVersion)
      .sort((a, b) => b.version - a.version);

    for (const migration of toRollback) {
      logger.info(`Rolling back migration ${migration.version}: ${migration.name}`);

      try {
        // Run the down migration
        db.run(migration.down);

        // Remove the migration record
        db.run('DELETE FROM schema_migrations WHERE version = ?', [migration.version]);

        rolledBack.push(migration.version);
        currentVersion = migration.version - 1;

        logger.info(`Migration ${migration.version} rolled back successfully`);
      } catch (error: any) {
        logger.error(`Rollback of migration ${migration.version} failed`, { error: error.message });
        throw error;
      }
    }

    logger.info('Rollback completed', {
      rolledBackCount: rolledBack.length,
      currentVersion,
    });

    return {
      success: true,
      appliedMigrations: rolledBack,
      currentVersion,
    };
  } catch (error: any) {
    logger.error('Rollback failed', { error: error.message });
    return {
      success: false,
      appliedMigrations: rolledBack,
      currentVersion,
      error: error.message,
    };
  }
}

/**
 * Check if database needs migrations
 */
export async function needsMigration(db: any): Promise<boolean> {
  const currentVersion = await getCurrentVersion(db);
  return currentVersion < SCHEMA_VERSION;
}

/**
 * Get migration status information
 */
export async function getMigrationStatus(db: any): Promise<{
  currentVersion: number;
  targetVersion: number;
  pendingMigrations: Array<{ version: number; name: string }>;
  appliedMigrations: Array<{ version: number; name: string; applied_at: string }>;
}> {
  const appliedVersions = await getAppliedMigrations(db);

  // Get applied migration details
  let appliedDetails: Array<{ version: number; name: string; applied_at: string }> = [];
  try {
    const result = db.exec('SELECT version, name, applied_at FROM schema_migrations ORDER BY version');
    if (result.length > 0) {
      appliedDetails = result[0].values.map((row: any[]) => ({
        version: row[0] as number,
        name: row[1] as string,
        applied_at: row[2] as string,
      }));
    }
  } catch {
    // Table doesn't exist
  }

  const pendingMigrations = MIGRATIONS
    .filter(m => !appliedVersions.includes(m.version))
    .map(m => ({ version: m.version, name: m.name }));

  return {
    currentVersion: appliedVersions.length > 0 ? Math.max(...appliedVersions) : 0,
    targetVersion: SCHEMA_VERSION,
    pendingMigrations,
    appliedMigrations: appliedDetails,
  };
}
