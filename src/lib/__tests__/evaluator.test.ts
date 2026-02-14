// ── Evaluator Agent Tests ──
import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeEvaluator } from "../agents/evaluator";

// Mock config to disable LLM
vi.mock("../config", () => ({
  getConfig: () => ({
    evaluatorThreshold: 0.5,
    openaiApiKey: "",
    openaiModel: "gpt-4o",
    enableLlmReasoning: false,
  }),
  isLlmAvailable: () => false,
}));

describe("EvaluatorAgent", () => {
  it("passes when result count and relevance are high", async () => {
    const result = await executeEvaluator("azure updates", 10, 0.8);
    expect(result.passed).toBe(true);
    expect(result.originalScore).toBeGreaterThanOrEqual(0.5);
    expect(result.improvementActions).toHaveLength(0);
    expect(result.evaluationReasoning).toContain("passed");
  });

  it("fails when no results", async () => {
    const result = await executeEvaluator("nonexistent query xyz", 0, 0);
    expect(result.passed).toBe(false);
    expect(result.originalScore).toBeLessThan(0.5);
    expect(result.improvementActions.length).toBeGreaterThan(0);
  });

  it("reports low relevance as improvement action", async () => {
    const result = await executeEvaluator("test query", 5, 0.1);
    expect(result.improvementActions.some((a) => a.includes("relevance"))).toBe(true);
  });

  it("passes with moderate results", async () => {
    // 3+ results with OK relevance should pass
    const result = await executeEvaluator("azure aks", 5, 0.6);
    expect(result.passed).toBe(true);
    expect(result.originalScore).toBeGreaterThanOrEqual(0.5);
  });

  it("fails with few results and low relevance", async () => {
    const result = await executeEvaluator("obscure query", 1, 0.1);
    expect(result.passed).toBe(false);
    expect(result.improvementActions.length).toBeGreaterThan(0);
  });

  it("does not rewrite query when LLM is unavailable", async () => {
    const result = await executeEvaluator("test", 0, 0);
    expect(result.rewrittenQuery).toBeUndefined();
    expect(result.improvedParsed).toBeUndefined();
  });

  it("includes evaluationReasoning string", async () => {
    const result = await executeEvaluator("azure", 10, 0.9);
    expect(typeof result.evaluationReasoning).toBe("string");
    expect(result.evaluationReasoning.length).toBeGreaterThan(0);
  });

  it("score is between 0 and 1", async () => {
    const result = await executeEvaluator("test", 100, 1.0);
    expect(result.originalScore).toBeGreaterThanOrEqual(0);
    expect(result.originalScore).toBeLessThanOrEqual(1);
  });
});
