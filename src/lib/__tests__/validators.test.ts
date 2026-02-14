// ── Validators Unit Tests ──
// Tests for Zod input validation schemas

import { describe, it, expect } from "vitest";
import {
  SearchQuerySchema,
  LocaleSchema,
  PeriodSchema,
  LearnRequestSchema,
  validateSearchParams,
  validationErrorResponse,
} from "../validators";

describe("SearchQuerySchema", () => {
  it("should accept valid search query", () => {
    const result = SearchQuerySchema.safeParse({ q: "Azure updates", locale: "en" });
    expect(result.success).toBe(true);
  });

  it("should reject empty query", () => {
    const result = SearchQuerySchema.safeParse({ q: "", locale: "en" });
    expect(result.success).toBe(false);
  });

  it("should reject query exceeding 500 characters", () => {
    const longQuery = "a".repeat(501);
    const result = SearchQuerySchema.safeParse({ q: longQuery, locale: "en" });
    expect(result.success).toBe(false);
  });

  it("should trim whitespace from query", () => {
    const result = SearchQuerySchema.safeParse({ q: "  Azure  ", locale: "ja" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe("Azure");
    }
  });

  it("should default locale to ja", () => {
    const result = SearchQuerySchema.safeParse({ q: "test" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.locale).toBe("ja");
    }
  });
});

describe("LocaleSchema", () => {
  it("should accept all 8 supported locales", () => {
    const locales = ["ja", "en", "ko", "zh", "es", "fr", "de", "pt"];
    locales.forEach((locale) => {
      const result = LocaleSchema.safeParse(locale);
      expect(result.success).toBe(true);
    });
  });

  it("should reject unsupported locale", () => {
    const result = LocaleSchema.safeParse("xx");
    expect(result.success).toBe(false);
  });
});

describe("PeriodSchema", () => {
  it("should accept valid periods", () => {
    const periods = ["1w", "1m", "3m", "6m"];
    periods.forEach((period) => {
      const result = PeriodSchema.safeParse(period);
      expect(result.success).toBe(true);
    });
  });

  it("should reject invalid period", () => {
    const result = PeriodSchema.safeParse("2y");
    expect(result.success).toBe(false);
  });
});

describe("validateSearchParams", () => {
  it("should parse URLSearchParams correctly", () => {
    const params = new URLSearchParams("q=Azure+updates&locale=en");
    const result = validateSearchParams(SearchQuerySchema, params);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.q).toBe("Azure updates");
      expect(result.data.locale).toBe("en");
    }
  });
});

describe("validationErrorResponse", () => {
  it("should format Zod errors into structured response", () => {
    const result = SearchQuerySchema.safeParse({ q: "" });
    if (!result.success) {
      const response = validationErrorResponse(result.error);
      expect(response.error).toBe("Validation failed");
      expect(response.details).toBeDefined();
      expect(response.details.length).toBeGreaterThan(0);
      expect(response.details[0]).toHaveProperty("field");
      expect(response.details[0]).toHaveProperty("message");
    }
  });
});
