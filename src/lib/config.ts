/**
 * Configuration module with environment validation.
 * Fails fast on missing required variables at startup.
 *
 * AWS-specific configuration is abstracted behind interfaces.
 * See docs/RUNBOOK.md for required AWS inputs.
 */

export interface AppConfig {
  // Environment
  nodeEnv: 'development' | 'production' | 'test';
  isProduction: boolean;
  isDevelopment: boolean;

  // Server
  port: number;
  baseUrl: string;

  // Salesforce OAuth
  salesforce: {
    clientId: string;
    clientSecret: string;
    callbackUrl: string;
    loginUrl: string;
  };

  // Session/Auth (abstracted - implementation TBD by AWS runbook)
  session: {
    secret: string;
    maxAge: number; // seconds
    provider: 'cookie' | 'database' | 'cognito'; // TODO: Add more providers
  };

  // Database (abstracted - implementation TBD by AWS runbook)
  database: {
    provider: 'sqlite' | 'postgresql' | 'mysql';
    connectionString?: string;
    sqlitePath?: string;
  };

  // Storage (abstracted - implementation TBD by AWS runbook)
  storage: {
    provider: 'local' | 's3';
    localPath?: string;
    s3Bucket?: string;
    s3Region?: string;
    s3Prefix?: string;
  };

  // GitHub Export (optional)
  github?: {
    token: string;
    owner: string;
    repo: string;
    baseBranch: string;
  };

  // Feature flags
  features: {
    multiClient: boolean;
    asyncJobs: boolean;
    githubExport: boolean;
  };
}

// Required environment variables that must be present
const REQUIRED_VARS = [
  'SF_CLIENT_ID',
  'SF_CLIENT_SECRET',
  'SF_CALLBACK_URL',
] as const;

// Optional but recommended for production
const RECOMMENDED_VARS = [
  'SESSION_SECRET',
  'DATABASE_URL',
] as const;

/**
 * Validates that all required environment variables are set.
 * Throws an error with details if any are missing.
 */
function validateEnvironment(): void {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const varName of REQUIRED_VARS) {
    if (!process.env[varName]) {
      missing.push(varName);
    }
  }

  if (missing.length > 0) {
    const message = `Missing required environment variables:\n${missing.map(v => `  - ${v}`).join('\n')}\n\nSee .env.example for configuration.`;
    throw new Error(message);
  }

  // Check recommended vars in production
  if (process.env.NODE_ENV === 'production') {
    for (const varName of RECOMMENDED_VARS) {
      if (!process.env[varName]) {
        warnings.push(varName);
      }
    }

    if (warnings.length > 0) {
      console.warn(`[CONFIG] Recommended environment variables not set:\n${warnings.map(v => `  - ${v}`).join('\n')}`);
    }
  }
}

/**
 * Parse database configuration from environment.
 * Supports SQLite (local dev) and PostgreSQL/MySQL (production).
 */
function parseDatabaseConfig(): AppConfig['database'] {
  const provider = (process.env.DATABASE_PROVIDER || 'sqlite') as AppConfig['database']['provider'];

  if (provider === 'sqlite') {
    return {
      provider: 'sqlite',
      sqlitePath: process.env.SQLITE_PATH || './packages/indexer/data/metadata.db',
    };
  }

  return {
    provider,
    connectionString: process.env.DATABASE_URL,
  };
}

/**
 * Parse storage configuration from environment.
 * Supports local filesystem (dev) and S3 (production).
 */
function parseStorageConfig(): AppConfig['storage'] {
  const provider = (process.env.STORAGE_PROVIDER || 'local') as AppConfig['storage']['provider'];

  if (provider === 'local') {
    return {
      provider: 'local',
      localPath: process.env.STORAGE_LOCAL_PATH || './data',
    };
  }

  return {
    provider: 's3',
    s3Bucket: process.env.S3_BUCKET,
    s3Region: process.env.S3_REGION || 'us-east-1',
    s3Prefix: process.env.S3_PREFIX || '',
  };
}

/**
 * Parse session configuration from environment.
 */
function parseSessionConfig(): AppConfig['session'] {
  const provider = (process.env.SESSION_PROVIDER || 'cookie') as AppConfig['session']['provider'];

  // Generate a random secret in development if not provided
  const defaultSecret = process.env.NODE_ENV === 'development'
    ? 'dev-secret-change-in-production-' + Math.random().toString(36)
    : '';

  return {
    provider,
    secret: process.env.SESSION_SECRET || defaultSecret,
    maxAge: parseInt(process.env.SESSION_MAX_AGE || '86400', 10), // 24 hours default
  };
}

/**
 * Parse GitHub configuration (optional).
 */
function parseGitHubConfig(): AppConfig['github'] | undefined {
  const token = process.env.GITHUB_TOKEN;
  if (!token) return undefined;

  return {
    token,
    owner: process.env.GITHUB_OWNER || '',
    repo: process.env.GITHUB_REPO || '',
    baseBranch: process.env.GITHUB_BASE_BRANCH || 'main',
  };
}

/**
 * Parse feature flags from environment.
 */
function parseFeatureFlags(): AppConfig['features'] {
  return {
    multiClient: process.env.FEATURE_MULTI_CLIENT === 'true',
    asyncJobs: process.env.FEATURE_ASYNC_JOBS === 'true',
    githubExport: process.env.FEATURE_GITHUB_EXPORT === 'true',
  };
}

/**
 * Load and validate application configuration.
 * Call this at application startup.
 */
export function loadConfig(): AppConfig {
  // Validate required vars (will throw if missing)
  validateEnvironment();

  const nodeEnv = (process.env.NODE_ENV || 'development') as AppConfig['nodeEnv'];
  const port = parseInt(process.env.PORT || '3456', 10);

  // Determine base URL
  const baseUrl = process.env.BASE_URL ||
    (nodeEnv === 'production' ? '' : `http://localhost:${port}`);

  return {
    nodeEnv,
    isProduction: nodeEnv === 'production',
    isDevelopment: nodeEnv === 'development',
    port,
    baseUrl,

    salesforce: {
      clientId: process.env.SF_CLIENT_ID!,
      clientSecret: process.env.SF_CLIENT_SECRET!,
      callbackUrl: process.env.SF_CALLBACK_URL!,
      loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com',
    },

    session: parseSessionConfig(),
    database: parseDatabaseConfig(),
    storage: parseStorageConfig(),
    github: parseGitHubConfig(),
    features: parseFeatureFlags(),
  };
}

// Singleton config instance (lazy loaded)
let _config: AppConfig | null = null;

/**
 * Get the application configuration.
 * Loads and validates on first call.
 */
export function getConfig(): AppConfig {
  if (!_config) {
    _config = loadConfig();
  }
  return _config;
}

/**
 * Reset config (useful for testing).
 */
export function resetConfig(): void {
  _config = null;
}

// Type-safe environment variable access
export type EnvVarName = typeof REQUIRED_VARS[number] | typeof RECOMMENDED_VARS[number];
