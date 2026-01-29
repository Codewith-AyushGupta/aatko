/**
 * Provider Abstractions
 *
 * This module exports interfaces and implementations for:
 * - Storage (local filesystem / S3)
 * - Database (SQLite / PostgreSQL) - TBD
 * - Session (cookies / Cognito / database) - TBD
 * - Jobs (in-process / SQS / Lambda) - TBD
 *
 * AWS-specific implementations will be added after the AWS runbook
 * provides configuration details. See docs/RUNBOOK.md.
 */

// Storage Provider
export {
  type IStorageProvider,
  type StorageObject,
  type StorageListOptions,
  type StorageListResult,
  type StorageUploadOptions,
  type StorageDownloadOptions,
  LocalStorageProvider,
  S3StorageProvider,
  getStorageProvider,
  resetStorageProvider,
} from './storage';

// TODO: Database Provider (Phase 2)
// export { IDatabaseProvider, SqliteProvider, PostgresProvider } from './database';

// TODO: Session Provider (Phase 2)
// export { ISessionStore, CookieSessionStore, DatabaseSessionStore } from './session';

// TODO: Job Runner Provider (Phase 3)
// export { IJobRunner, InProcessJobRunner, SqsJobRunner } from './jobs';
