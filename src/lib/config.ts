// ── Application Configuration ──
// Centralized environment variable management with type-safe accessors
// Supports graceful degradation when optional config (e.g. OPENAI_API_KEY) is missing

export interface AppConfig {
  /** OpenAI API key for LLM reasoning pipeline */
  openaiApiKey: string | undefined;
  /** OpenAI model name */
  openaiModel: string;
  /** Microsoft Learn API timeout in ms */
  learnApiTimeout: number;
  /** Maximum retry attempts for external APIs */
  maxApiRetries: number;
  /** Logging level */
  logLevel: "debug" | "info" | "warn" | "error";
  /** Maximum items in export requests */
  maxExportItems: number;
  /** Whether LLM reasoning is enabled */
  enableLlmReasoning: boolean;
  /** Evaluator quality threshold (0-1) */
  evaluatorThreshold: number;
}

/** Validated log levels */
const VALID_LOG_LEVELS = ["debug", "info", "warn", "error"] as const;
type LogLevel = (typeof VALID_LOG_LEVELS)[number];

function parseLogLevel(value: string | undefined): LogLevel {
  const v = (value || "info").toLowerCase();
  if (VALID_LOG_LEVELS.includes(v as LogLevel)) return v as LogLevel;
  return "info";
}

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue;
  return value.toLowerCase() === "true" || value === "1";
}

function parseNumber(value: string | undefined, defaultValue: number, min?: number, max?: number): number {
  if (!value) return defaultValue;
  const num = parseInt(value, 10);
  if (isNaN(num)) return defaultValue;
  if (min !== undefined && num < min) return min;
  if (max !== undefined && num > max) return max;
  return num;
}

/** Singleton config instance */
let _config: AppConfig | null = null;

/**
 * Get application configuration.
 * Reads from process.env with validation and defaults.
 * Singleton — safe to call multiple times.
 */
export function getConfig(): AppConfig {
  if (_config) return _config;

  _config = {
    openaiApiKey: process.env.OPENAI_API_KEY || undefined,
    openaiModel: process.env.OPENAI_MODEL || "gpt-4o",
    learnApiTimeout: parseNumber(process.env.LEARN_API_TIMEOUT, 10000, 1000, 60000),
    maxApiRetries: parseNumber(process.env.MAX_API_RETRIES, 2, 0, 5),
    logLevel: parseLogLevel(process.env.LOG_LEVEL),
    maxExportItems: parseNumber(process.env.MAX_EXPORT_ITEMS, 500, 10, 5000),
    enableLlmReasoning: parseBoolean(process.env.ENABLE_LLM_REASONING, true),
    evaluatorThreshold: parseNumber(process.env.EVALUATOR_THRESHOLD, 0.5, 0, 1),
  };

  return _config;
}

/**
 * Check if LLM reasoning is available (API key set + enabled).
 */
export function isLlmAvailable(): boolean {
  const config = getConfig();
  return !!(config.openaiApiKey && config.enableLlmReasoning);
}

/**
 * Reset config (for testing).
 */
export function resetConfig(): void {
  _config = null;
}
