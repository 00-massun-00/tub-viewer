// ── Orchestrator Tests ──
// Tests the multi-agent pipeline coordination logic.
import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock all dependent agents to isolate orchestrator logic
vi.mock("../agents/query-agent", () => ({
  executeQueryAgent: vi.fn().mockResolvedValue({
    parsed: {
      products: ["azure"],
      keywords: ["azure", "updates"],
      severity: null,
      period: null,
      source: null,
    },
    method: "rule-based",
    durationMs: 5,
  }),
}));

vi.mock("../agents/search-agent", () => ({
  executeSearchAgent: vi.fn().mockResolvedValue({
    mockResults: [
      {
        id: "mock-1",
        title: "Azure Update",
        severity: "new-feature",
        product: "azure",
        productFamily: "Azure",
        summary: "New Azure feature",
        impact: "Moderate",
        actionRequired: "Review",
        source: "message-center",
        date: new Date().toISOString(),
      },
    ],
    learnResults: [],
    workiqResults: [],
    mergedResults: [
      {
        id: "mock-1",
        title: "Azure Update",
        severity: "new-feature",
        product: "azure",
        productFamily: "Azure",
        summary: "New Azure feature",
        impact: "Moderate",
        actionRequired: "Review",
        source: "message-center",
        date: new Date().toISOString(),
      },
    ],
    sourceCounts: { mockData: 1, learnApi: 0, workiq: 0, total: 1 },
    durationMs: 10,
  }),
}));

vi.mock("../agents/ranking-agent", () => ({
  executeRankingAgent: vi.fn().mockReturnValue({
    rankedResults: [
      {
        item: {
          id: "mock-1",
          title: "Azure Update",
          severity: "new-feature",
          product: "azure",
          productFamily: "Azure",
          summary: "New Azure feature",
          impact: "Moderate",
          actionRequired: "Review",
          source: "message-center",
          date: new Date().toISOString(),
        },
        relevanceScore: 0.7,
        matchReasons: ["title:azure", "product-match"],
      },
    ],
    averageRelevance: 0.7,
    topRelevance: 0.7,
    durationMs: 2,
  }),
}));

vi.mock("../agents/evaluator", () => ({
  executeEvaluator: vi.fn().mockResolvedValue({
    originalScore: 0.8,
    passed: true,
    improvementActions: [],
    evaluationReasoning: "Quality check passed (score: 0.80 >= threshold: 0.50).",
  }),
}));

// Import after mocks
import { executeSearch } from "../agents/orchestrator";

describe("Orchestrator", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("executes full pipeline and returns results", async () => {
    const result = await executeSearch({
      query: "Azure updates",
      locale: "en",
    });

    expect(result.updates).toHaveLength(1);
    expect(result.updates[0].title).toBe("Azure Update");
    expect(result.stats.total).toBe(1);
    expect(result.stats.newFeature).toBe(1);
    expect(result.stats.breaking).toBe(0);
  });

  it("includes reasoning trace in output", async () => {
    const result = await executeSearch({
      query: "Azure updates",
      locale: "en",
    });

    expect(result.reasoning).toBeDefined();
    expect(result.reasoning.pipeline).toBe("multi-agent-orchestrator");
    expect(result.reasoning.steps.length).toBeGreaterThanOrEqual(3);
    expect(result.reasoning.queryMethod).toBe("rule-based");
    expect(result.reasoning.requestId).toBeTruthy();
    expect(result.reasoning.totalDurationMs).toBeGreaterThanOrEqual(0);
  });

  it("includes pipeline steps for all agents", async () => {
    const result = await executeSearch({
      query: "test query",
      locale: "ja",
    });

    const agentNames = result.reasoning.steps.map((s) => s.agent);
    expect(agentNames).toContain("QueryAgent");
    expect(agentNames).toContain("SearchAgent");
    expect(agentNames).toContain("RankingAgent");
    expect(agentNames).toContain("EvaluatorAgent");
  });

  it("includes search source counts", async () => {
    const result = await executeSearch({
      query: "Azure",
      locale: "en",
    });

    expect(result.searchSources).toBeDefined();
    expect(result.searchSources.total).toBe(1);
    expect(result.searchSources.mockData).toBe(1);
    expect(result.searchSources.learnApi).toBe(0);
  });

  it("includes ranking metrics", async () => {
    const result = await executeSearch({
      query: "Azure",
      locale: "en",
    });

    expect(result.ranking).toBeDefined();
    expect(result.ranking.averageRelevance).toBe(0.7);
    expect(result.ranking.topRelevance).toBe(0.7);
  });

  it("includes evaluation results", async () => {
    const result = await executeSearch({
      query: "Azure updates",
      locale: "en",
    });

    expect(result.evaluation).toBeDefined();
    expect(result.evaluation!.passed).toBe(true);
    expect(result.evaluation!.originalScore).toBe(0.8);
  });

  it("includes queryAnalysis metadata", async () => {
    const result = await executeSearch({
      query: "Azure updates",
      locale: "en",
    });

    expect(result.queryAnalysis).toBeDefined();
    expect(result.queryAnalysis.method).toBe("rule-based");
    expect(result.queryAnalysis.parsed).toBeDefined();
  });

  it("returns parsed query and original query string", async () => {
    const result = await executeSearch({
      query: "Azure breaking changes",
      locale: "en",
    });

    expect(result.query).toBe("Azure breaking changes");
    expect(result.parsed).toBeDefined();
  });
});
