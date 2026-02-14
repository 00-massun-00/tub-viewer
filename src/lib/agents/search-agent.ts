// ── Search Agent ──
// Responsible for executing searches across multiple data sources.
// Part of the Multi-Agent Orchestrator pattern.
// Searches mock data (Message Center equivalent) and Microsoft Learn API in parallel.

import { ParsedQuery, searchUpdates } from "../query-parser";
import { searchLearnDocs, learnResultToUpdateItem } from "../mcp-client";
import { searchWorkIQ, workiqResultToUpdateItem } from "../workiq-client";
import { UpdateItem, SupportedLocale } from "../types";
import { PRODUCTS } from "../products";
import { createLogger } from "../logger";

const logger = createLogger("SearchAgent");

export interface SearchAgentInput {
  parsed: ParsedQuery;
  locale: SupportedLocale;
  includeLiveData: boolean;
}

export interface SearchAgentOutput {
  mockResults: UpdateItem[];
  learnResults: UpdateItem[];
  workiqResults: UpdateItem[];
  mergedResults: UpdateItem[];
  sourceCounts: {
    mockData: number;
    learnApi: number;
    workiq: number;
    total: number;
  };
  durationMs: number;
}

/**
 * SearchAgent: Execute multi-source search in parallel.
 *
 * Data Sources:
 * 1. Mock Data (Message Center patterns) — local, fast
 * 2. Microsoft Learn API via MCP integration pipeline — external, real-time
 * 3. WorkIQ MCP (M365 tenant data) — emails, Message Center feed, advisories
 *
 * Deduplication is applied after merging results from all sources.
 * This agent follows SRP: it only handles data retrieval, not ranking or evaluation.
 */
export async function executeSearchAgent(input: SearchAgentInput): Promise<SearchAgentOutput> {
  const startTime = Date.now();
  logger.info("SearchAgent started", {
    products: input.parsed.products,
    keywords: input.parsed.keywords,
    locale: input.locale,
    includeLive: input.includeLiveData,
  });

  // ── 1. Search mock data (Message Center equivalent) ──
  const mockSearchResult = searchUpdates(input.parsed, input.locale);
  const mockResults = mockSearchResult.updates;

  // ── 2. Search Microsoft Learn API (MCP integration pipeline) ──
  let learnResults: UpdateItem[] = [];
  if (input.includeLiveData && input.parsed.products.length > 0) {
    try {
      const searchPromises = input.parsed.products.slice(0, 3).map(async (productId) => {
        const productInfo = PRODUCTS.find((p) => p.id === productId);
        const searchQuery = input.parsed.keywords.length > 0
          ? input.parsed.keywords.join(" ")
          : `${productInfo?.name || productId} what's new update`;

        const results = await searchLearnDocs(searchQuery, productInfo?.name, 5);
        return results.map((r) =>
          learnResultToUpdateItem(
            r,
            productInfo?.name || productId,
            productInfo?.family || "Other",
            input.locale
          )
        );
      });

      const learnResultArrays = await Promise.all(searchPromises);
      learnResults = learnResultArrays.flat();
    } catch (error) {
      logger.warn("Learn API search failed in SearchAgent", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ── 3. Search WorkIQ MCP (M365 tenant data) ──
  let workiqResults: UpdateItem[] = [];
  if (input.includeLiveData) {
    try {
      const searchQuery = input.parsed.keywords.length > 0
        ? input.parsed.keywords.join(" ")
        : input.parsed.products.map(pid => {
            const p = PRODUCTS.find(pr => pr.id === pid);
            return p?.nameEn || p?.name || pid;
          }).join(", ") + " updates";

      const workiqRaw = await searchWorkIQ(searchQuery, input.locale);

      // Map to the first matched product or "general"
      const primaryProduct = input.parsed.products[0] || "general";
      const productInfo = PRODUCTS.find(p => p.id === primaryProduct);

      workiqResults = workiqRaw.map(r =>
        workiqResultToUpdateItem(
          r,
          productInfo?.name || primaryProduct,
          productInfo?.family || "Other",
          input.locale
        )
      );
    } catch (error) {
      logger.warn("WorkIQ search failed in SearchAgent", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // ── 4. Merge & deduplicate ──
  const allResults = [...mockResults, ...learnResults, ...workiqResults];
  const seenTitles = new Set<string>();
  const mergedResults = allResults.filter((u) => {
    const key = u.title.toLowerCase().slice(0, 50);
    if (seenTitles.has(key)) return false;
    seenTitles.add(key);
    return true;
  });

  const durationMs = Date.now() - startTime;
  logger.info("SearchAgent completed", {
    mockCount: mockResults.length,
    learnCount: learnResults.length,
    workiqCount: workiqResults.length,
    mergedCount: mergedResults.length,
    durationMs,
  });

  return {
    mockResults,
    learnResults,
    workiqResults,
    mergedResults,
    sourceCounts: {
      mockData: mockResults.length,
      learnApi: learnResults.length,
      workiq: workiqResults.length,
      total: mergedResults.length,
    },
    durationMs,
  };
}
