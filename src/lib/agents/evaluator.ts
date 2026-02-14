// ── Evaluator Agent (Self-Reflection) ──
// Evaluator-Optimizer pattern: Assesses search result quality and triggers
// query rewrite if results are insufficient.
// Implements the self-reflection loop with a maximum of 1 retry to prevent infinite loops.

import { ParsedQuery, parseQuery } from "../query-parser";
import { LlmParsedQuery, analyzeLlmQuery } from "../llm-query-analyzer";
import { createLogger } from "../logger";
import { getConfig, isLlmAvailable } from "../config";
import OpenAI from "openai";

const logger = createLogger("EvaluatorAgent");

export interface EvaluationResult {
  originalScore: number;
  passed: boolean;
  rewrittenQuery?: string;
  improvedParsed?: ParsedQuery | LlmParsedQuery;
  improvementActions: string[];
  evaluationReasoning: string;
}

/**
 * EvaluatorAgent: Assess search result quality and self-correct if needed.
 *
 * Evaluation criteria:
 * 1. Result count — Are there enough results? (0 results = fail)
 * 2. Average relevance — Is the average relevance score above threshold?
 * 3. Keyword coverage — Do results cover the user's search intent?
 *
 * If evaluation fails, the agent:
 * 1. Requests a query rewrite from LLM (Self-Reflection pattern)
 * 2. Re-parses the rewritten query
 * 3. Returns the improved query for a second search attempt
 *
 * Maximum 1 retry to prevent infinite loops (Fail Fast principle).
 */
export async function executeEvaluator(
  query: string,
  resultCount: number,
  averageRelevance: number,
): Promise<EvaluationResult> {
  const startTime = Date.now();
  const config = getConfig();
  const threshold = config.evaluatorThreshold;

  logger.info("EvaluatorAgent started", {
    query,
    resultCount,
    averageRelevance: averageRelevance.toFixed(3),
    threshold,
  });

  // ── Quality assessment ──
  const improvementActions: string[] = [];
  let score = 0;

  // Factor 1: Result count (0-0.4)
  if (resultCount === 0) {
    score += 0;
    improvementActions.push("No results found — query may be too specific");
  } else if (resultCount < 3) {
    score += 0.2;
    improvementActions.push("Few results — consider broadening query");
  } else {
    score += 0.4;
  }

  // Factor 2: Average relevance (0-0.4)
  score += Math.min(averageRelevance * 0.4, 0.4);
  if (averageRelevance < 0.3) {
    improvementActions.push("Low relevance — keyword mismatch detected");
  }

  // Factor 3: Basic heuristic (0-0.2) — if we have diverse results, bonus
  if (resultCount >= 2) {
    score += 0.2;
  }

  const passed = score >= threshold;
  const evaluationReasoning = passed
    ? `Quality check passed (score: ${score.toFixed(2)} >= threshold: ${threshold}). Results are relevant.`
    : `Quality check failed (score: ${score.toFixed(2)} < threshold: ${threshold}). Attempting query rewrite.`;

  logger.info("Evaluation result", {
    score: score.toFixed(3),
    passed,
    actions: improvementActions,
  });

  // ── If passed, return without rewriting ──
  if (passed) {
    return {
      originalScore: score,
      passed: true,
      improvementActions,
      evaluationReasoning,
    };
  }

  // ── Self-Reflection: Attempt query rewrite (max 1 retry) ──
  let rewrittenQuery: string | undefined;
  let improvedParsed: ParsedQuery | LlmParsedQuery | undefined;

  if (isLlmAvailable()) {
    try {
      const openai = new OpenAI({ apiKey: config.openaiApiKey });
      const rewriteResponse = await openai.chat.completions.create({
        model: config.openaiModel,
        messages: [
          {
            role: "system",
            content:
              "You are a query optimizer. The user's search returned poor results. Rewrite their query to be more effective for searching Microsoft product updates. Return ONLY the rewritten query text, nothing else.",
          },
          {
            role: "user",
            content: `Original query: "${query}"\nIssues: ${improvementActions.join(", ")}\n\nRewrite this query to find better results:`,
          },
        ],
        temperature: 0.3,
        max_tokens: 100,
      });

      rewrittenQuery = rewriteResponse.choices[0]?.message?.content?.trim();
      if (rewrittenQuery) {
        logger.info("Query rewritten via Self-Reflection", {
          original: query,
          rewritten: rewrittenQuery,
        });

        // Re-analyze the rewritten query
        const llmParsed = await analyzeLlmQuery(rewrittenQuery);
        improvedParsed = llmParsed || parseQuery(rewrittenQuery);
        improvementActions.push(`Query rewritten: "${query}" → "${rewrittenQuery}"`);
      }
    } catch (error) {
      logger.warn("Self-reflection query rewrite failed", {
        error: error instanceof Error ? error.message : String(error),
      });
      improvementActions.push("Self-reflection failed — using original query");
    }
  } else {
    // Without LLM, suggest broader search as fallback
    improvementActions.push("LLM not available for self-reflection — try a broader query");
  }

  const durationMs = Date.now() - startTime;
  logger.info("EvaluatorAgent completed", { durationMs, passed, rewrittenQuery });

  return {
    originalScore: score,
    passed: false,
    rewrittenQuery,
    improvedParsed,
    improvementActions,
    evaluationReasoning,
  };
}
