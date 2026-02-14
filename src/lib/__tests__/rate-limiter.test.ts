import { describe, it, expect, afterEach } from "vitest";
import { RateLimiter } from "../rate-limiter";

describe("RateLimiter", () => {
  let limiter: RateLimiter;

  afterEach(() => {
    limiter?.dispose();
  });

  it("allows requests within the limit", () => {
    limiter = new RateLimiter({ maxRequests: 5, windowMs: 60_000 });
    for (let i = 0; i < 5; i++) {
      expect(limiter.check("client-1")).toEqual({ allowed: true });
    }
  });

  it("blocks requests exceeding the limit", () => {
    limiter = new RateLimiter({ maxRequests: 3, windowMs: 60_000 });
    limiter.check("client-1");
    limiter.check("client-1");
    limiter.check("client-1");
    const result = limiter.check("client-1");
    expect(result.allowed).toBe(false);
    if (!result.allowed) {
      expect(result.retryAfterMs).toBeGreaterThan(0);
    }
  });

  it("tracks clients independently", () => {
    limiter = new RateLimiter({ maxRequests: 2, windowMs: 60_000 });
    limiter.check("client-a");
    limiter.check("client-a");
    // client-a is now at limit
    expect(limiter.check("client-a").allowed).toBe(false);
    // client-b should still be allowed
    expect(limiter.check("client-b").allowed).toBe(true);
  });

  it("uses default config when no options provided", () => {
    limiter = new RateLimiter();
    // Should allow at least some requests (default maxRequests = 30)
    for (let i = 0; i < 30; i++) {
      expect(limiter.check("client-default")).toEqual({ allowed: true });
    }
    expect(limiter.check("client-default").allowed).toBe(false);
  });

  it("returns retryAfterMs less than or equal to windowMs", () => {
    limiter = new RateLimiter({ maxRequests: 1, windowMs: 5000 });
    limiter.check("c");
    const result = limiter.check("c");
    if (!result.allowed) {
      expect(result.retryAfterMs).toBeLessThanOrEqual(5000);
      expect(result.retryAfterMs).toBeGreaterThan(0);
    }
  });
});
