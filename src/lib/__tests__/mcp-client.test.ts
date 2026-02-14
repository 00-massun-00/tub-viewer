// ── MCP Client Unit Tests ──
// Tests for Learn API client, severity inference, and retry mechanism

import { describe, it, expect, vi, beforeEach } from "vitest";
import { learnResultToUpdateItem, LearnSearchResult } from "../mcp-client";

describe("learnResultToUpdateItem", () => {
  const baseResult: LearnSearchResult = {
    title: "Test Document",
    description: "Test description content",
    url: "https://learn.microsoft.com/test",
    lastUpdated: "2026-01-15",
    products: ["azure"],
  };

  it("should classify breaking severity from title keywords", () => {
    const result: LearnSearchResult = {
      ...baseResult,
      title: "Breaking changes in Azure SDK deprecation notice",
    };
    const item = learnResultToUpdateItem(result, "Azure", "Azure", "en");
    expect(item.severity).toBe("breaking");
  });

  it("should classify new-feature severity from title keywords", () => {
    const result: LearnSearchResult = {
      ...baseResult,
      title: "Announcing new preview features for Dynamics 365",
    };
    const item = learnResultToUpdateItem(result, "D365", "Dynamics 365", "en");
    expect(item.severity).toBe("new-feature");
  });

  it("should default to improvement severity", () => {
    const result: LearnSearchResult = {
      ...baseResult,
      title: "Performance optimization in Azure storage",
    };
    const item = learnResultToUpdateItem(result, "Azure", "Azure", "en");
    expect(item.severity).toBe("improvement");
  });

  it("should generate proper UpdateItem structure", () => {
    const item = learnResultToUpdateItem(baseResult, "Azure", "Azure", "ja");
    expect(item.id).toMatch(/^learn-/);
    expect(item.title).toBe("Test Document");
    expect(item.source).toBe("microsoft-learn");
    expect(item.product).toBe("Azure");
    expect(item.productFamily).toBe("Azure");
    expect(item.sourceUrl).toBe("https://learn.microsoft.com/test");
    expect(item.date).toBe("2026-01-15");
  });

  it("should handle empty lastUpdated with current date", () => {
    const result: LearnSearchResult = {
      ...baseResult,
      lastUpdated: "",
    };
    const item = learnResultToUpdateItem(result, "Azure", "Azure", "en");
    expect(item.date).toMatch(/^\d{4}-\d{2}-\d{2}/);
  });

  it("should generate action text based on severity in Japanese", () => {
    const breakingResult: LearnSearchResult = {
      ...baseResult,
      title: "Retirement notice for legacy API",
    };
    const item = learnResultToUpdateItem(breakingResult, "Azure", "Azure", "ja");
    expect(item.actionRequired).toContain("移行計画");
  });
});
