// ── Query Agent ──
// Responsible for query analysis using Chain-of-Thought reasoning.
// Part of the Multi-Agent Orchestrator pattern.
// Delegates to LLM analyzer when available, falls back to rule-based parser.

import { ParsedQuery, parseQuery } from "../query-parser";
import { LlmParsedQuery, analyzeLlmQuery } from "../llm-query-analyzer";
import { createLogger } from "../logger";

const logger = createLogger("QueryAgent");

export interface QueryAgentInput {
  query: string;
  locale: string;
}

export interface QueryAgentOutput {
  parsed: ParsedQuery | LlmParsedQuery;
  method: "llm-chain-of-thought" | "rule-based";
  durationMs: number;
}

/**
 * QueryAgent: Analyze a user query using the best available method.
 *
 * Strategy:
 * 1. Attempt LLM-powered Chain-of-Thought analysis (GPT-4o)
 * 2. If LLM fails or is unavailable, fall back to rule-based NLP
 *
 * This agent follows the Single Responsibility Principle (SRP):
 * it only handles query understanding, not search execution or ranking.
 */
export async function executeQueryAgent(input: QueryAgentInput): Promise<QueryAgentOutput> {
  const startTime = Date.now();
  logger.info("QueryAgent started", { query: input.query, locale: input.locale });

  // Step 1: Try LLM Chain-of-Thought analysis
  const llmResult = await analyzeLlmQuery(input.query);

  if (llmResult) {
    const durationMs = Date.now() - startTime;
    logger.info("QueryAgent completed with LLM", {
      method: "llm-chain-of-thought",
      intent: llmResult.intent,
      productsFound: llmResult.products.length,
      confidence: llmResult.confidenceScore,
      durationMs,
    });
    return {
      parsed: llmResult,
      method: "llm-chain-of-thought",
      durationMs,
    };
  }

  // Step 2: Fallback to rule-based parsing
  logger.info("Falling back to rule-based parsing");
  const parsed = parseQuery(input.query);
  const durationMs = Date.now() - startTime;

  logger.info("QueryAgent completed with rule-based", {
    method: "rule-based",
    productsFound: parsed.products.length,
    durationMs,
  });

  return {
    parsed,
    method: "rule-based",
    durationMs,
  };
}
