// ── Config & Logger Tests ──
// Tests for configuration management and structured logging

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getConfig, resetConfig, isLlmAvailable } from "../config";
import { createLogger, generateRequestId, Logger } from "../logger";

describe("getConfig", () => {
  beforeEach(() => {
    resetConfig();
  });

  afterEach(() => {
    resetConfig();
    // Clean up env vars
    delete process.env.OPENAI_API_KEY;
    delete process.env.LOG_LEVEL;
    delete process.env.MAX_EXPORT_ITEMS;
    delete process.env.ENABLE_LLM_REASONING;
  });

  it("should return default values when no env vars set", () => {
    const config = getConfig();
    expect(config.openaiApiKey).toBeUndefined();
    expect(config.openaiModel).toBe("gpt-4o");
    expect(config.learnApiTimeout).toBe(10000);
    expect(config.maxApiRetries).toBe(2);
    expect(config.logLevel).toBe("info");
    expect(config.maxExportItems).toBe(500);
    expect(config.enableLlmReasoning).toBe(true);
  });

  it("should read OPENAI_API_KEY from environment", () => {
    process.env.OPENAI_API_KEY = "sk-test-key";
    const config = getConfig();
    expect(config.openaiApiKey).toBe("sk-test-key");
  });

  it("should validate log level", () => {
    process.env.LOG_LEVEL = "invalid";
    const config = getConfig();
    expect(config.logLevel).toBe("info"); // default fallback
  });

  it("should clamp numeric values within bounds", () => {
    process.env.MAX_EXPORT_ITEMS = "99999";
    const config = getConfig();
    expect(config.maxExportItems).toBe(5000); // max bound
  });

  it("should return singleton instance", () => {
    const config1 = getConfig();
    const config2 = getConfig();
    expect(config1).toBe(config2); // same reference
  });
});

describe("isLlmAvailable", () => {
  beforeEach(() => resetConfig());
  afterEach(() => {
    resetConfig();
    delete process.env.OPENAI_API_KEY;
    delete process.env.ENABLE_LLM_REASONING;
  });

  it("should return false when API key is not set", () => {
    expect(isLlmAvailable()).toBe(false);
  });

  it("should return true when API key is set and reasoning enabled", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    expect(isLlmAvailable()).toBe(true);
  });

  it("should return false when reasoning is disabled", () => {
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.ENABLE_LLM_REASONING = "false";
    expect(isLlmAvailable()).toBe(false);
  });
});

describe("Logger", () => {
  it("should create a logger with component name", () => {
    const logger = createLogger("TestComponent");
    expect(logger).toBeInstanceOf(Logger);
  });

  it("should generate unique request IDs", () => {
    const id1 = generateRequestId();
    const id2 = generateRequestId();
    expect(id1).not.toBe(id2);
    expect(id1).toMatch(/^req_/);
  });

  it("should create child logger with request ID", () => {
    const logger = createLogger("Test");
    const child = logger.withRequestId("req_123");
    expect(child).toBeInstanceOf(Logger);
  });

  it("should output structured JSON log", () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    resetConfig();
    const logger = createLogger("Test");
    logger.info("test message", { key: "value" });

    expect(consoleSpy).toHaveBeenCalled();
    const output = consoleSpy.mock.calls[0][0] as string;
    const parsed = JSON.parse(output);
    expect(parsed.level).toBe("info");
    expect(parsed.component).toBe("Test");
    expect(parsed.message).toBe("test message");
    expect(parsed.timestamp).toBeDefined();

    consoleSpy.mockRestore();
  });
});
