/**
 * In-memory sliding-window rate limiter for API routes.
 *
 * Each client (identified by IP) is allowed `maxRequests` within
 * the `windowMs` interval. Requests beyond the limit receive 429.
 */

interface ClientRecord {
  timestamps: number[];
}

export interface RateLimiterConfig {
  /** Maximum requests per window (default: 30) */
  maxRequests?: number;
  /** Window size in milliseconds (default: 60 000 = 1 min) */
  windowMs?: number;
}

export class RateLimiter {
  private clients = new Map<string, ClientRecord>();
  private readonly maxRequests: number;
  private readonly windowMs: number;
  private cleanupTimer: ReturnType<typeof setInterval> | null = null;

  constructor(config: RateLimiterConfig = {}) {
    this.maxRequests = config.maxRequests ?? 30;
    this.windowMs = config.windowMs ?? 60_000;

    // Periodic cleanup of stale entries (every 2 minutes)
    if (typeof setInterval !== "undefined") {
      this.cleanupTimer = setInterval(() => this.cleanup(), 120_000);
    }
  }

  /**
   * Check whether the client is within rate limits.
   * @returns `{ allowed: true }` or `{ allowed: false, retryAfterMs }`.
   */
  check(clientId: string): { allowed: true } | { allowed: false; retryAfterMs: number } {
    const now = Date.now();
    const record = this.clients.get(clientId) ?? { timestamps: [] };

    // Remove timestamps outside the current window
    record.timestamps = record.timestamps.filter((t) => now - t < this.windowMs);

    if (record.timestamps.length >= this.maxRequests) {
      const oldest = record.timestamps[0];
      const retryAfterMs = this.windowMs - (now - oldest);
      return { allowed: false, retryAfterMs: Math.max(retryAfterMs, 1) };
    }

    record.timestamps.push(now);
    this.clients.set(clientId, record);
    return { allowed: true };
  }

  /** Remove expired entries to prevent memory leaks. */
  private cleanup() {
    const now = Date.now();
    for (const [key, record] of this.clients.entries()) {
      record.timestamps = record.timestamps.filter((t) => now - t < this.windowMs);
      if (record.timestamps.length === 0) {
        this.clients.delete(key);
      }
    }
  }

  /** Dispose the cleanup timer (for testing). */
  dispose() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

/** Shared rate limiter instance for search API (30 req / 60s per IP). */
export const searchRateLimiter = new RateLimiter({ maxRequests: 30, windowMs: 60_000 });

/** Extract client identifier from request headers. */
export function getClientId(request: Request): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}
