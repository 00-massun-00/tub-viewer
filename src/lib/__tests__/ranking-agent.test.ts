// ── Ranking Agent Tests ──
import { describe, it, expect } from "vitest";
import { executeRankingAgent } from "../agents/ranking-agent";
import { UpdateItem } from "../types";

function makeItem(overrides: Partial<UpdateItem> = {}): UpdateItem {
  return {
    id: "test-1",
    title: "Azure AKS Kubernetes 1.28 retirement",
    severity: "breaking",
    product: "azure-aks",
    productFamily: "Azure",
    summary: "Kubernetes 1.28 is being retired.",
    impact: "Clusters running 1.28 will need to upgrade.",
    actionRequired: "Upgrade to 1.29 or later.",
    source: "message-center",
    date: new Date().toISOString(),
    ...overrides,
  };
}

describe("RankingAgent", () => {
  it("returns empty results for empty input", () => {
    const result = executeRankingAgent({
      results: [],
      parsed: { products: [], keywords: [], severity: null, period: null, source: null },
    });
    expect(result.rankedResults).toHaveLength(0);
    expect(result.averageRelevance).toBe(0);
    expect(result.topRelevance).toBe(0);
    expect(result.durationMs).toBeGreaterThanOrEqual(0);
  });

  it("ranks items with keyword match higher", () => {
    const items = [
      makeItem({ id: "1", title: "Teams update", summary: "Teams improvements" }),
      makeItem({ id: "2", title: "Azure AKS Kubernetes retirement", summary: "AKS retiring 1.28" }),
    ];
    const result = executeRankingAgent({
      results: items,
      parsed: { products: [], keywords: ["kubernetes", "aks"], severity: null, period: null, source: null },
    });
    expect(result.rankedResults[0].item.id).toBe("2");
    expect(result.rankedResults[0].relevanceScore).toBeGreaterThan(result.rankedResults[1].relevanceScore);
  });

  it("gives product match bonus", () => {
    const items = [
      makeItem({ id: "1", product: "azure-aks" }),
      makeItem({ id: "2", product: "teams" }),
    ];
    const result = executeRankingAgent({
      results: items,
      parsed: { products: ["azure-aks"], keywords: [], severity: null, period: null, source: null },
    });
    expect(result.rankedResults[0].item.id).toBe("1");
    expect(result.rankedResults[0].matchReasons).toContain("product-match");
  });

  it("gives severity match bonus", () => {
    const items = [
      makeItem({ id: "1", severity: "improvement" }),
      makeItem({ id: "2", severity: "breaking" }),
    ];
    const result = executeRankingAgent({
      results: items,
      parsed: { products: [], keywords: [], severity: "breaking", period: null, source: null },
    });
    expect(result.rankedResults[0].item.id).toBe("2");
    expect(result.rankedResults[0].matchReasons).toContain("severity-match");
  });

  it("gives source match bonus", () => {
    const items = [
      makeItem({ id: "1", source: "message-center" }),
      makeItem({ id: "2", source: "microsoft-learn" }),
    ];
    const result = executeRankingAgent({
      results: items,
      parsed: { products: [], keywords: [], severity: null, period: null, source: "microsoft-learn" },
    });
    const learnItem = result.rankedResults.find((r) => r.item.id === "2");
    expect(learnItem!.matchReasons).toContain("source-match");
  });

  it("gives recency bonus for recent items", () => {
    const recentDate = new Date().toISOString();
    const oldDate = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString(); // 60 days ago
    const items = [
      makeItem({ id: "old", date: oldDate }),
      makeItem({ id: "recent", date: recentDate }),
    ];
    const result = executeRankingAgent({
      results: items,
      parsed: { products: [], keywords: [], severity: null, period: null, source: null },
    });
    const recentItem = result.rankedResults.find((r) => r.item.id === "recent");
    expect(recentItem!.matchReasons).toContain("recent-7d");
  });

  it("calculates averageRelevance and topRelevance correctly", () => {
    const items = [
      makeItem({ id: "1", title: "Azure update", product: "azure" }),
      makeItem({ id: "2", title: "Other update", product: "teams" }),
    ];
    const result = executeRankingAgent({
      results: items,
      parsed: { products: ["azure"], keywords: ["azure"], severity: null, period: null, source: null },
    });
    expect(result.averageRelevance).toBeGreaterThan(0);
    expect(result.topRelevance).toBeGreaterThanOrEqual(result.averageRelevance);
  });

  it("sorts by severity when relevance scores are close", () => {
    const items = [
      makeItem({ id: "1", severity: "improvement" }),
      makeItem({ id: "2", severity: "breaking" }),
    ];
    // No keywords → all scores will be the same → should sort by severity priority
    const result = executeRankingAgent({
      results: items,
      parsed: { products: [], keywords: [], severity: null, period: null, source: null },
    });
    // breaking (priority 0) should come before improvement (priority 2) when relevance is the same
    const breakingIdx = result.rankedResults.findIndex((r) => r.item.severity === "breaking");
    const improvementIdx = result.rankedResults.findIndex((r) => r.item.severity === "improvement");
    expect(breakingIdx).toBeLessThan(improvementIdx);
  });

  it("includes matchReasons for each scored item", () => {
    const items = [makeItem({ id: "1", title: "Azure Kubernetes AKS update" })];
    const result = executeRankingAgent({
      results: items,
      parsed: { products: ["azure-aks"], keywords: ["kubernetes"], severity: "breaking", period: null, source: "message-center" },
    });
    const reasons = result.rankedResults[0].matchReasons;
    expect(reasons).toContain("title:kubernetes");
    expect(reasons).toContain("product-match");
    expect(reasons).toContain("severity-match");
    expect(reasons).toContain("source-match");
  });
});
