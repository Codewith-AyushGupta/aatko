/**
 * Storage Provider Abstraction
 *
 * Provides a unified interface for storing and retrieving files.
 * Implementations:
 * - LocalStorageProvider: Filesystem storage (development)
 * - S3StorageProvider: AWS S3 (production) - TODO: Implement after AWS runbook
 *
 * See docs/RUNBOOK.md for AWS configuration requirements.
 */

export interface StorageObject {
  key: string;
  content: Buffer | string;
  contentType: string;
  metadata?: Record<string, string>;
  lastModified?: Date;
  size?: number;
}

export interface StorageListOptions {
  prefix?: string;
  maxKeys?: number;
  continuationToken?: string;
}

export interface StorageListResult {
  objects: Array<{
    key: string;
    lastModified: Date;
    size: number;
  }>;
  continuationToken?: string;
  isTruncated: boolean;
}

export interface StorageUploadOptions {
  contentType?: string;
  metadata?: Record<string, string>;
}

export interface StorageDownloadOptions {
  // For presigned URLs
  expiresIn?: number; // seconds
}

export interface IStorageProvider {
  /**
   * Upload a file to storage
   */
  upload(key: string, content: Buffer | string, options?: StorageUploadOptions): Promise<void>;

  /**
   * Download a file from storage
   */
  download(key: string): Promise<StorageObject | null>;

  /**
   * Check if a file exists
   */
  exists(key: string): Promise<boolean>;

  /**
   * Delete a file from storage
   */
  delete(key: string): Promise<void>;

  /**
   * List files with optional prefix
   */
  list(options?: StorageListOptions): Promise<StorageListResult>;

  /**
   * Get a presigned URL for direct access (S3 only, returns key for local)
   */
  getPresignedUrl(key: string, options?: StorageDownloadOptions): Promise<string>;

  /**
   * Copy a file within storage
   */
  copy(sourceKey: string, destKey: string): Promise<void>;
}

// =============================================================================
// Local Filesystem Implementation (Development)
// =============================================================================

import fs from 'fs/promises';
import path from 'path';

export class LocalStorageProvider implements IStorageProvider {
  private basePath: string;

  constructor(basePath: string) {
    this.basePath = basePath;
  }

  private getFullPath(key: string): string {
    // Prevent path traversal attacks
    const normalized = path.normalize(key).replace(/^(\.\.(\/|\\|$))+/, '');
    return path.join(this.basePath, normalized);
  }

  async upload(key: string, content: Buffer | string, options?: StorageUploadOptions): Promise<void> {
    const fullPath = this.getFullPath(key);
    const dir = path.dirname(fullPath);

    // Ensure directory exists
    await fs.mkdir(dir, { recursive: true });

    // Write file
    await fs.writeFile(fullPath, content);

    // Store metadata in a sidecar file if provided
    if (options?.metadata) {
      const metaPath = fullPath + '.meta.json';
      await fs.writeFile(metaPath, JSON.stringify({
        contentType: options.contentType,
        metadata: options.metadata,
        uploadedAt: new Date().toISOString(),
      }));
    }
  }

  async download(key: string): Promise<StorageObject | null> {
    const fullPath = this.getFullPath(key);

    try {
      const content = await fs.readFile(fullPath);
      const stats = await fs.stat(fullPath);

      // Try to read metadata
      let metadata: Record<string, string> = {};
      let contentType = 'application/octet-stream';
      try {
        const metaPath = fullPath + '.meta.json';
        const metaContent = await fs.readFile(metaPath, 'utf-8');
        const meta = JSON.parse(metaContent);
        metadata = meta.metadata || {};
        contentType = meta.contentType || contentType;
      } catch {
        // No metadata file, use defaults
      }

      return {
        key,
        content,
        contentType,
        metadata,
        lastModified: stats.mtime,
        size: stats.size,
      };
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }

  async exists(key: string): Promise<boolean> {
    const fullPath = this.getFullPath(key);
    try {
      await fs.access(fullPath);
      return true;
    } catch {
      return false;
    }
  }

  async delete(key: string): Promise<void> {
    const fullPath = this.getFullPath(key);
    try {
      await fs.unlink(fullPath);
      // Also delete metadata file if exists
      try {
        await fs.unlink(fullPath + '.meta.json');
      } catch {
        // Ignore if no metadata file
      }
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async list(options?: StorageListOptions): Promise<StorageListResult> {
    const prefix = options?.prefix || '';
    const maxKeys = options?.maxKeys || 1000;
    const searchPath = this.getFullPath(prefix);

    const objects: StorageListResult['objects'] = [];

    async function walk(dir: string, basePath: string): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        for (const entry of entries) {
          if (objects.length >= maxKeys) return;

          const fullPath = path.join(dir, entry.name);
          const relativePath = path.relative(basePath, fullPath).replace(/\\/g, '/');

          if (entry.isDirectory()) {
            await walk(fullPath, basePath);
          } else if (!entry.name.endsWith('.meta.json')) {
            const stats = await fs.stat(fullPath);
            objects.push({
              key: relativePath,
              lastModified: stats.mtime,
              size: stats.size,
            });
          }
        }
      } catch (error: any) {
        if (error.code !== 'ENOENT') {
          throw error;
        }
      }
    }

    await walk(searchPath, this.basePath);

    return {
      objects,
      isTruncated: objects.length >= maxKeys,
    };
  }

  async getPresignedUrl(key: string): Promise<string> {
    // For local storage, just return the file path
    // In production, this would be an S3 presigned URL
    return this.getFullPath(key);
  }

  async copy(sourceKey: string, destKey: string): Promise<void> {
    const sourcePath = this.getFullPath(sourceKey);
    const destPath = this.getFullPath(destKey);

    // Ensure destination directory exists
    await fs.mkdir(path.dirname(destPath), { recursive: true });

    await fs.copyFile(sourcePath, destPath);

    // Copy metadata if exists
    try {
      await fs.copyFile(sourcePath + '.meta.json', destPath + '.meta.json');
    } catch {
      // Ignore if no metadata file
    }
  }
}

// =============================================================================
// S3 Storage Implementation (Production) - TODO: Implement after AWS runbook
// =============================================================================

export class S3StorageProvider implements IStorageProvider {
  private bucket: string;
  private region: string;
  private prefix: string;

  constructor(bucket: string, region: string, prefix: string = '') {
    this.bucket = bucket;
    this.region = region;
    this.prefix = prefix;

    // TODO: Initialize AWS SDK client after AWS runbook provides:
    // - Authentication method (IAM role, access keys, etc.)
    // - Presigned URL strategy
    // - Encryption settings
  }

  async upload(): Promise<void> {
    // TODO: Implement with @aws-sdk/client-s3
    throw new Error('S3StorageProvider not implemented. Awaiting AWS runbook.');
  }

  async download(): Promise<StorageObject | null> {
    throw new Error('S3StorageProvider not implemented. Awaiting AWS runbook.');
  }

  async exists(): Promise<boolean> {
    throw new Error('S3StorageProvider not implemented. Awaiting AWS runbook.');
  }

  async delete(): Promise<void> {
    throw new Error('S3StorageProvider not implemented. Awaiting AWS runbook.');
  }

  async list(): Promise<StorageListResult> {
    throw new Error('S3StorageProvider not implemented. Awaiting AWS runbook.');
  }

  async getPresignedUrl(): Promise<string> {
    // TODO: Implement with @aws-sdk/s3-request-presigner
    throw new Error('S3StorageProvider not implemented. Awaiting AWS runbook.');
  }

  async copy(): Promise<void> {
    throw new Error('S3StorageProvider not implemented. Awaiting AWS runbook.');
  }
}

// =============================================================================
// Factory Function
// =============================================================================

import { getConfig } from '../config';

let _storageProvider: IStorageProvider | null = null;

export function getStorageProvider(): IStorageProvider {
  if (!_storageProvider) {
    const config = getConfig();

    if (config.storage.provider === 's3') {
      if (!config.storage.s3Bucket) {
        throw new Error('S3_BUCKET environment variable required for S3 storage');
      }
      _storageProvider = new S3StorageProvider(
        config.storage.s3Bucket,
        config.storage.s3Region || 'us-east-1',
        config.storage.s3Prefix || ''
      );
    } else {
      _storageProvider = new LocalStorageProvider(
        config.storage.localPath || './data'
      );
    }
  }

  return _storageProvider;
}

export function resetStorageProvider(): void {
  _storageProvider = null;
}
