// ── Query Parser Unit Tests ──
// Tests for the rule-based NLP query parser

import { describe, it, expect } from "vitest";
import { parseQuery, searchUpdates } from "../query-parser";

describe("parseQuery", () => {
  // ── Product Detection ──
  it("should detect Azure from Japanese query", () => {
    const result = parseQuery("Azure の最新情報教えて");
    expect(result.products).toContain("azure");
    expect(result.originalQuery).toBe("Azure の最新情報教えて");
  });

  it("should detect D365 FO from English query", () => {
    const result = parseQuery("D365 finance operations updates");
    expect(result.products).toContain("d365-fo");
  });

  it("should detect multiple products", () => {
    const result = parseQuery("Teams と Power BI の更新");
    expect(result.products).toContain("m365-teams");
    expect(result.products).toContain("power-bi");
  });

  it("should detect Copilot product", () => {
    const result = parseQuery("Copilot の新機能");
    expect(result.products).toContain("m365-copilot");
  });

  // ── Period Detection ──
  it("should detect 1 week period from Japanese", () => {
    const result = parseQuery("今週のアップデート");
    expect(result.period).toBe("1w");
  });

  it("should detect 1 month period from English", () => {
    const result = parseQuery("D365 breaking changes this month");
    expect(result.period).toBe("1m");
  });

  it("should detect 3 month period", () => {
    const result = parseQuery("3ヶ月の変更点");
    expect(result.period).toBe("3m");
  });

  it("should detect 6 month period", () => {
    const result = parseQuery("6 months updates");
    expect(result.period).toBe("6m");
  });

  // ── Severity Detection ──
  it("should detect breaking severity", () => {
    const result = parseQuery("D365 breaking changes");
    expect(result.severity).toBe("breaking");
  });

  it("should detect breaking severity from Japanese", () => {
    const result = parseQuery("廃止予定の機能");
    expect(result.severity).toBe("breaking");
  });

  it("should detect new-feature severity", () => {
    const result = parseQuery("new features in Azure");
    expect(result.severity).toBe("new-feature");
  });

  it("should detect improvement severity", () => {
    const result = parseQuery("パフォーマンス改善");
    expect(result.severity).toBe("improvement");
  });

  // ── Source Detection ──
  it("should detect Message Center source", () => {
    const result = parseQuery("メッセージセンターの通知");
    expect(result.source).toBe("message-center");
  });

  it("should detect Learn documentation source", () => {
    const result = parseQuery("Learn ドキュメントの更新");
    expect(result.source).toBe("microsoft-learn");
  });

  // ── Edge Cases ──
  it("should handle empty query", () => {
    const result = parseQuery("");
    expect(result.products).toEqual([]);
    expect(result.severity).toBeNull();
    expect(result.period).toBeNull();
  });

  it("should handle special characters", () => {
    const result = parseQuery("Azure's new <features> & improvements!");
    expect(result.products).toContain("azure");
    // Should not crash
    expect(result.originalQuery).toBe("Azure's new <features> & improvements!");
  });

  // ── Combined Query ──
  it("should parse complex multi-faceted query", () => {
    const result = parseQuery("D365 の breaking changes 今月");
    expect(result.products).toContain("d365-fo");
    expect(result.severity).toBe("breaking");
    expect(result.period).toBe("1m");
  });
});

describe("searchUpdates", () => {
  it("should return results for a valid product query", () => {
    const parsed = parseQuery("Azure アップデート");
    const result = searchUpdates(parsed, "ja");
    expect(result.stats).toBeDefined();
    expect(result.stats.total).toBeGreaterThanOrEqual(0);
    expect(result.suggestions).toBeDefined();
  });

  it("should filter by severity when specified", () => {
    const parsed = parseQuery("breaking");
    const result = searchUpdates(parsed, "en");
    result.updates.forEach((u) => {
      expect(u.severity).toBe("breaking");
    });
  });

  it("should generate suggestions when no results found", () => {
    const parsed = parseQuery("xyznonexistent");
    const result = searchUpdates(parsed, "ja");
    expect(result.suggestions.length).toBeGreaterThan(0);
  });
});
