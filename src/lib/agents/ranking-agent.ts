// ── Ranking Agent ──
// Responsible for scoring and re-ranking search results by relevance.
// Part of the Multi-Agent Orchestrator pattern.
// Applies keyword-based relevance scoring and severity-priority sorting.

import { UpdateItem } from "../types";
import { ParsedQuery } from "../query-parser";
import { createLogger } from "../logger";

const logger = createLogger("RankingAgent");

export interface RankingAgentInput {
  results: UpdateItem[];
  parsed: ParsedQuery;
}

export interface RankedResult {
  item: UpdateItem;
  relevanceScore: number;
  matchReasons: string[];
}

export interface RankingAgentOutput {
  rankedResults: RankedResult[];
  averageRelevance: number;
  topRelevance: number;
  durationMs: number;
}

/**
 * RankingAgent: Score and re-rank search results by relevance.
 *
 * Scoring factors:
 * - Keyword match in title (3 points per keyword)
 * - Keyword match in summary (2 points per keyword)
 * - Keyword match in impact (1 point per keyword)
 * - Product match (2 points)
 * - Severity match (1 point)
 * - Source match (1 point)
 * - Recency bonus (up to 2 points for items within last 30 days)
 *
 * This agent follows SRP: it only handles ranking, not retrieval or evaluation.
 */
export function executeRankingAgent(input: RankingAgentInput): RankingAgentOutput {
  const startTime = Date.now();
  logger.info("RankingAgent started", {
    resultCount: input.results.length,
    keywordCount: input.parsed.keywords.length,
  });

  const rankedResults = input.results.map((item) => {
    let score = 0;
    const matchReasons: string[] = [];
    const keywordsLower = input.parsed.keywords.map((k) => k.toLowerCase());

    // ── Keyword relevance scoring ──
    for (const kw of keywordsLower) {
      const titleText = `${item.title} ${item.titleEn || ""}`.toLowerCase();
      const summaryText = `${item.summary} ${item.summaryEn || ""}`.toLowerCase();
      const impactText = `${item.impact} ${item.impactEn || ""}`.toLowerCase();

      if (titleText.includes(kw)) {
        score += 3;
        matchReasons.push(`title:${kw}`);
      }
      if (summaryText.includes(kw)) {
        score += 2;
        matchReasons.push(`summary:${kw}`);
      }
      if (impactText.includes(kw)) {
        score += 1;
        matchReasons.push(`impact:${kw}`);
      }
    }

    // ── Product match ──
    if (input.parsed.products.includes(item.product)) {
      score += 2;
      matchReasons.push("product-match");
    }

    // ── Severity match ──
    if (input.parsed.severity && item.severity === input.parsed.severity) {
      score += 1;
      matchReasons.push("severity-match");
    }

    // ── Source match ──
    if (input.parsed.source && item.source === input.parsed.source) {
      score += 1;
      matchReasons.push("source-match");
    }

    // ── Recency bonus ──
    if (item.date) {
      const daysSince = (Date.now() - new Date(item.date).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSince <= 7) {
        score += 2;
        matchReasons.push("recent-7d");
      } else if (daysSince <= 30) {
        score += 1;
        matchReasons.push("recent-30d");
      }
    }

    // Normalize score to 0-1 range
    const maxPossible = keywordsLower.length * 6 + 4 + 2; // max keyword match + product + severity + source + recency
    const relevanceScore = maxPossible > 0 ? Math.min(score / maxPossible, 1) : 0;

    return { item, relevanceScore, matchReasons };
  });

  // Sort by relevance (highest first), then by severity priority
  const severityOrder = { breaking: 0, "new-feature": 1, improvement: 2 };
  rankedResults.sort((a, b) => {
    if (Math.abs(a.relevanceScore - b.relevanceScore) > 0.1) {
      return b.relevanceScore - a.relevanceScore;
    }
    return severityOrder[a.item.severity] - severityOrder[b.item.severity];
  });

  const averageRelevance =
    rankedResults.length > 0
      ? rankedResults.reduce((sum, r) => sum + r.relevanceScore, 0) / rankedResults.length
      : 0;
  const topRelevance = rankedResults.length > 0 ? rankedResults[0].relevanceScore : 0;

  const durationMs = Date.now() - startTime;
  logger.info("RankingAgent completed", {
    resultCount: rankedResults.length,
    averageRelevance: averageRelevance.toFixed(3),
    topRelevance: topRelevance.toFixed(3),
    durationMs,
  });

  return {
    rankedResults,
    averageRelevance,
    topRelevance,
    durationMs,
  };
}
