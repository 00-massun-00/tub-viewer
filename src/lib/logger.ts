// ── Structured Logger ──
// Lightweight structured logging with log levels, request ID tracing,
// and JSON-formatted output for observability.

import { getConfig } from "./config";

export type LogLevel = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  component: string;
  message: string;
  requestId?: string;
  durationMs?: number;
  data?: Record<string, unknown>;
}

/**
 * Structured logger with component-scoped context.
 * Outputs JSON-formatted log entries with timestamps and optional request ID tracing.
 */
export class Logger {
  private component: string;
  private requestId?: string;

  constructor(component: string, requestId?: string) {
    this.component = component;
    this.requestId = requestId;
  }

  /** Create a child logger with a request ID for tracing */
  withRequestId(requestId: string): Logger {
    return new Logger(this.component, requestId);
  }

  /** Check if a log level should be output */
  private shouldLog(level: LogLevel): boolean {
    const configLevel = getConfig().logLevel;
    return LOG_LEVEL_ORDER[level] >= LOG_LEVEL_ORDER[configLevel];
  }

  /** Format and output a log entry */
  private log(level: LogLevel, message: string, data?: Record<string, unknown>, durationMs?: number): void {
    if (!this.shouldLog(level)) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      component: this.component,
      message,
      ...(this.requestId && { requestId: this.requestId }),
      ...(durationMs !== undefined && { durationMs }),
      ...(data && Object.keys(data).length > 0 && { data }),
    };

    const output = JSON.stringify(entry);

    switch (level) {
      case "error":
        console.error(output);
        break;
      case "warn":
        console.warn(output);
        break;
      case "debug":
        console.debug(output);
        break;
      default:
        console.log(output);
    }
  }

  debug(message: string, data?: Record<string, unknown>): void {
    this.log("debug", message, data);
  }

  info(message: string, data?: Record<string, unknown>): void {
    this.log("info", message, data);
  }

  warn(message: string, data?: Record<string, unknown>): void {
    this.log("warn", message, data);
  }

  error(message: string, data?: Record<string, unknown>): void {
    this.log("error", message, data);
  }

  /** Log with duration measurement */
  timed(level: LogLevel, message: string, durationMs: number, data?: Record<string, unknown>): void {
    this.log(level, message, data, durationMs);
  }
}

/**
 * Generate a unique request ID for tracing.
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

/**
 * Create a logger for a specific component.
 */
export function createLogger(component: string): Logger {
  return new Logger(component);
}

/** Measure execution time of an async function */
export async function withTiming<T>(
  logger: Logger,
  operation: string,
  fn: () => Promise<T>,
): Promise<{ result: T; durationMs: number }> {
  const start = Date.now();
  try {
    const result = await fn();
    const durationMs = Date.now() - start;
    logger.timed("info", `${operation} completed`, durationMs);
    return { result, durationMs };
  } catch (error) {
    const durationMs = Date.now() - start;
    logger.timed("error", `${operation} failed`, durationMs, {
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}
