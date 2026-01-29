/**
 * Structured Logging Module
 *
 * Provides consistent logging across the application with:
 * - Correlation IDs for request tracing
 * - Log levels (debug, info, warn, error)
 * - JSON output for production
 * - Human-readable output for development
 * - Automatic redaction of sensitive data
 *
 * CRITICAL: Never log secrets, tokens, passwords, or PII.
 */

import { AsyncLocalStorage } from 'async_hooks';

// Correlation ID storage (per-request context)
const correlationStorage = new AsyncLocalStorage<string>();

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  correlationId?: string;
  context?: Record<string, unknown>;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

// Patterns to redact from logs (case-insensitive)
const REDACT_PATTERNS = [
  /password/i,
  /secret/i,
  /token/i,
  /apikey/i,
  /api_key/i,
  /authorization/i,
  /bearer/i,
  /credential/i,
  /private_key/i,
  /access_token/i,
  /refresh_token/i,
  /client_secret/i,
  /session_id/i,
];

const REDACT_VALUE = '[REDACTED]';

/**
 * Recursively redact sensitive values from an object
 */
function redactSensitive(obj: unknown, depth = 0): unknown {
  // Prevent infinite recursion
  if (depth > 10) return '[MAX_DEPTH]';

  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    // Check if string looks like a token/secret
    if (obj.length > 20 && /^[A-Za-z0-9+/=_-]+$/.test(obj)) {
      return REDACT_VALUE;
    }
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(item => redactSensitive(item, depth + 1));
  }

  if (typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      // Check if key matches sensitive patterns
      const isSensitiveKey = REDACT_PATTERNS.some(pattern => pattern.test(key));
      if (isSensitiveKey) {
        result[key] = REDACT_VALUE;
      } else {
        result[key] = redactSensitive(value, depth + 1);
      }
    }
    return result;
  }

  return obj;
}

/**
 * Format log entry for output
 */
function formatLogEntry(entry: LogEntry): string {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    // Human-readable format for development
    const levelColors: Record<LogLevel, string> = {
      debug: '\x1b[36m', // cyan
      info: '\x1b[32m',  // green
      warn: '\x1b[33m',  // yellow
      error: '\x1b[31m', // red
    };
    const reset = '\x1b[0m';
    const color = levelColors[entry.level];

    let output = `${color}[${entry.level.toUpperCase()}]${reset} ${entry.message}`;

    if (entry.correlationId) {
      output = `\x1b[90m[${entry.correlationId.slice(0, 8)}]${reset} ${output}`;
    }

    if (entry.context && Object.keys(entry.context).length > 0) {
      output += ` ${JSON.stringify(redactSensitive(entry.context))}`;
    }

    if (entry.error) {
      output += `\n  Error: ${entry.error.name}: ${entry.error.message}`;
      if (entry.error.stack) {
        output += `\n${entry.error.stack.split('\n').slice(1, 5).join('\n')}`;
      }
    }

    return output;
  }

  // JSON format for production (easier to parse in CloudWatch, etc.)
  return JSON.stringify({
    ...entry,
    context: redactSensitive(entry.context),
  });
}

/**
 * Get current log level from environment
 */
function getLogLevel(): LogLevel {
  const level = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;
  if (['debug', 'info', 'warn', 'error'].includes(level)) {
    return level;
  }
  return 'info';
}

const LOG_LEVEL_PRIORITY: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * Check if a log level should be output
 */
function shouldLog(level: LogLevel): boolean {
  const currentLevel = getLogLevel();
  return LOG_LEVEL_PRIORITY[level] >= LOG_LEVEL_PRIORITY[currentLevel];
}

/**
 * Create a log entry and output it
 */
function log(level: LogLevel, message: string, context?: Record<string, unknown>, error?: Error): void {
  if (!shouldLog(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    correlationId: correlationStorage.getStore(),
    context,
  };

  if (error) {
    entry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
    };
  }

  const output = formatLogEntry(entry);

  switch (level) {
    case 'error':
      console.error(output);
      break;
    case 'warn':
      console.warn(output);
      break;
    default:
      console.log(output);
  }
}

// =============================================================================
// Public Logger API
// =============================================================================

export const logger = {
  debug: (message: string, context?: Record<string, unknown>) =>
    log('debug', message, context),

  info: (message: string, context?: Record<string, unknown>) =>
    log('info', message, context),

  warn: (message: string, context?: Record<string, unknown>, error?: Error) =>
    log('warn', message, context, error),

  error: (message: string, context?: Record<string, unknown>, error?: Error) =>
    log('error', message, context, error),

  /**
   * Log an error with full context
   */
  exception: (message: string, error: Error, context?: Record<string, unknown>) =>
    log('error', message, context, error),
};

// =============================================================================
// Correlation ID Management
// =============================================================================

/**
 * Generate a new correlation ID
 */
export function generateCorrelationId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Run a function with a correlation ID in context
 */
export function withCorrelationId<T>(correlationId: string, fn: () => T): T {
  return correlationStorage.run(correlationId, fn);
}

/**
 * Run an async function with a correlation ID in context
 */
export async function withCorrelationIdAsync<T>(
  correlationId: string,
  fn: () => Promise<T>
): Promise<T> {
  return correlationStorage.run(correlationId, fn);
}

/**
 * Get the current correlation ID (if any)
 */
export function getCorrelationId(): string | undefined {
  return correlationStorage.getStore();
}

/**
 * Set correlation ID for the current context
 * Returns a function to run code within that context
 */
export function createRequestContext(correlationId?: string): <T>(fn: () => T) => T {
  const id = correlationId || generateCorrelationId();
  return <T>(fn: () => T) => correlationStorage.run(id, fn);
}

// =============================================================================
// Request Logging Middleware Helper
// =============================================================================

export interface RequestLogContext {
  method: string;
  path: string;
  statusCode?: number;
  duration?: number;
  userAgent?: string;
  ip?: string;
}

/**
 * Log an HTTP request
 */
export function logRequest(context: RequestLogContext): void {
  const level: LogLevel = context.statusCode && context.statusCode >= 400 ? 'warn' : 'info';

  log(level, `${context.method} ${context.path}`, {
    statusCode: context.statusCode,
    duration: context.duration ? `${context.duration}ms` : undefined,
    userAgent: context.userAgent,
  });
}

/**
 * Create a timer for measuring request duration
 */
export function createTimer(): () => number {
  const start = Date.now();
  return () => Date.now() - start;
}
