// ── Multi-Agent Orchestrator ──
// Orchestrator-Workers pattern: Coordinates QueryAgent, SearchAgent,
// RankingAgent, and EvaluatorAgent in a multi-step reasoning pipeline.
//
// Pipeline:
// 1. QueryAgent — Analyze query (LLM Chain-of-Thought or rule-based)
// 2. SearchAgent — Execute parallel multi-source search
// 3. RankingAgent — Score and re-rank results by relevance
// 4. EvaluatorAgent — Quality check with self-reflection loop (max 1 retry)
//
// This implements the Orchestrator-Workers workflow pattern from
// Anthropic's "Building Effective Agents" guidance.

import { SupportedLocale, UpdateItem } from "../types";
import { ParsedQuery } from "../query-parser";
import { LlmParsedQuery, ReasoningStep } from "../llm-query-analyzer";
import { executeQueryAgent, QueryAgentOutput } from "./query-agent";
import { executeSearchAgent, SearchAgentOutput } from "./search-agent";
import { executeRankingAgent, RankingAgentOutput, RankedResult } from "./ranking-agent";
import { executeEvaluator, EvaluationResult } from "./evaluator";
import { generateBriefingSummary, BriefingSummaryResult } from "./briefing-summary";
import { createLogger, generateRequestId } from "../logger";

const logger = createLogger("Orchestrator");

export interface OrchestratorInput {
  query: string;
  locale: SupportedLocale;
  includeLiveData?: boolean;
}

export interface OrchestratorOutput {
  // Final results
  updates: UpdateItem[];
  stats: {
    breaking: number;
    newFeature: number;
    improvement: number;
    total: number;
  };

  // Multi-step reasoning trace
  reasoning: {
    requestId: string;
    pipeline: "multi-agent-orchestrator";
    steps: PipelineStep[];
    totalDurationMs: number;
    queryMethod: "llm-chain-of-thought" | "rule-based";
    reasoningSteps?: ReasoningStep[];
  };

  // Agent outputs for transparency
  queryAnalysis: {
    parsed: ParsedQuery | LlmParsedQuery;
    method: string;
  };
  searchSources: {
    mockData: number;
    learnApi: number;
    total: number;
  };
  ranking: {
    averageRelevance: number;
    topRelevance: number;
  };
  evaluation?: EvaluationResult;
  briefingSummary?: BriefingSummaryResult;

  // Search metadata
  query: string;
  parsed: ParsedQuery | LlmParsedQuery;
  suggestions: string[];
}

interface PipelineStep {
  agent: string;
  status: "success" | "fallback" | "skipped";
  durationMs: number;
  details: string;
}

/**
 * Execute the full multi-agent search pipeline.
 *
 * Orchestration flow:
 * ┌─────────────┐     ┌──────────────┐     ┌──────────────┐     ┌────────────┐
 * │ QueryAgent  │ ──► │ SearchAgent  │ ──► │ RankingAgent │ ──► │ Evaluator  │
 * │ (Analyze)   │     │ (Retrieve)   │     │ (Rank)       │     │ (Validate) │
 * └─────────────┘     └──────────────┘     └──────────────┘     └─────┬──────┘
 *                                                                      │
 *                          ┌──────────────────────────────────────────┐│
 *                          │ If quality < threshold:                  ││
 *                          │   Self-Reflection → Query Rewrite       ││
 *                          │   → Re-search (max 1 retry)             ││
 *                          └──────────────────────────────────────────┘▼
 *                                                                 Results
 */
export async function executeSearch(input: OrchestratorInput): Promise<OrchestratorOutput> {
  const requestId = generateRequestId();
  const orchestratorLogger = logger.withRequestId(requestId);
  const startTime = Date.now();
  const pipelineSteps: PipelineStep[] = [];

  orchestratorLogger.info("Multi-agent orchestrator started", {
    query: input.query,
    locale: input.locale,
  });

  // ── Step 1: QueryAgent — Analyze the query ──
  const queryResult: QueryAgentOutput = await executeQueryAgent({
    query: input.query,
    locale: input.locale,
  });
  pipelineSteps.push({
    agent: "QueryAgent",
    status: queryResult.method === "llm-chain-of-thought" ? "success" : "fallback",
    durationMs: queryResult.durationMs,
    details: `Method: ${queryResult.method}, Products: ${queryResult.parsed.products.join(",")}`,
  });

  // ── Step 2: SearchAgent — Execute multi-source search ──
  const searchResult: SearchAgentOutput = await executeSearchAgent({
    parsed: queryResult.parsed,
    locale: input.locale,
    includeLiveData: input.includeLiveData !== false,
  });
  pipelineSteps.push({
    agent: "SearchAgent",
    status: "success",
    durationMs: searchResult.durationMs,
    details: `Mock: ${searchResult.sourceCounts.mockData}, Learn: ${searchResult.sourceCounts.learnApi}, Merged: ${searchResult.sourceCounts.total}`,
  });

  // ── Step 3: RankingAgent — Score and rank results ──
  const rankingResult: RankingAgentOutput = executeRankingAgent({
    results: searchResult.mergedResults,
    parsed: queryResult.parsed,
  });
  pipelineSteps.push({
    agent: "RankingAgent",
    status: "success",
    durationMs: rankingResult.durationMs,
    details: `Avg relevance: ${rankingResult.averageRelevance.toFixed(3)}, Top: ${rankingResult.topRelevance.toFixed(3)}`,
  });

  // ── Step 4: EvaluatorAgent — Quality check with self-reflection ──
  let finalResults: RankedResult[] = rankingResult.rankedResults;
  let evaluation: EvaluationResult | undefined;

  const evalResult = await executeEvaluator(
    input.query,
    rankingResult.rankedResults.length,
    rankingResult.averageRelevance,
  );
  evaluation = evalResult;

  if (!evalResult.passed && evalResult.improvedParsed) {
    // Self-reflection triggered: re-search with rewritten query
    orchestratorLogger.info("Evaluator triggered re-search", {
      rewrittenQuery: evalResult.rewrittenQuery,
    });

    const retrySearch = await executeSearchAgent({
      parsed: evalResult.improvedParsed,
      locale: input.locale,
      includeLiveData: input.includeLiveData !== false,
    });

    const retryRanking = executeRankingAgent({
      results: retrySearch.mergedResults,
      parsed: evalResult.improvedParsed,
    });

    // Use improved results if they're actually better
    if (retryRanking.averageRelevance > rankingResult.averageRelevance) {
      finalResults = retryRanking.rankedResults;
      orchestratorLogger.info("Re-search improved results", {
        originalRelevance: rankingResult.averageRelevance.toFixed(3),
        improvedRelevance: retryRanking.averageRelevance.toFixed(3),
      });
    }

    pipelineSteps.push({
      agent: "EvaluatorAgent",
      status: "success",
      durationMs: Date.now() - startTime - pipelineSteps.reduce((s, p) => s + p.durationMs, 0),
      details: `Self-reflection: ${evalResult.passed ? "passed" : "retry"}, Score: ${evalResult.originalScore.toFixed(2)}`,
    });
  } else {
    pipelineSteps.push({
      agent: "EvaluatorAgent",
      status: evalResult.passed ? "success" : "skipped",
      durationMs: 0,
      details: `Score: ${evalResult.originalScore.toFixed(2)}, ${evalResult.passed ? "passed" : "no LLM for rewrite"}`,
    });
  }

  // ── Build final response ──
  const updates = finalResults.map((r) => r.item);
  const stats = {
    breaking: updates.filter((u) => u.severity === "breaking").length,
    newFeature: updates.filter((u) => u.severity === "new-feature").length,
    improvement: updates.filter((u) => u.severity === "improvement").length,
    total: updates.length,
  };

  const totalDurationMs = Date.now() - startTime;

  // Extract reasoning steps if LLM was used
  const llmParsed = queryResult.parsed as LlmParsedQuery;
  const reasoningSteps = llmParsed.reasoningSteps;

  orchestratorLogger.info("Multi-agent orchestrator completed", {
    totalDurationMs,
    resultCount: updates.length,
    pipelineSteps: pipelineSteps.length,
  });

  // ── Step 5: Briefing Summary ──
  const briefingSummary = await generateBriefingSummary(updates, input.locale, input.query);
  pipelineSteps.push({
    agent: "BriefingSummary",
    status: "success",
    durationMs: briefingSummary.durationMs,
    details: `Method: ${briefingSummary.method}, Length: ${briefingSummary.summary.length}`,
  });

  const finalTotalDurationMs = Date.now() - startTime;

  return {
    updates,
    stats,
    reasoning: {
      requestId,
      pipeline: "multi-agent-orchestrator",
      steps: pipelineSteps,
      totalDurationMs: finalTotalDurationMs,
      queryMethod: queryResult.method,
      reasoningSteps,
    },
    queryAnalysis: {
      parsed: queryResult.parsed,
      method: queryResult.method,
    },
    searchSources: searchResult.sourceCounts,
    ranking: {
      averageRelevance: rankingResult.averageRelevance,
      topRelevance: rankingResult.topRelevance,
    },
    evaluation,
    briefingSummary,
    query: input.query,
    parsed: queryResult.parsed,
    suggestions: [],
  };
}
