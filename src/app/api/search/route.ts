// ── Search API Route ──
// Multi-agent orchestrated search with Chain-of-Thought reasoning.
// Pipeline: QueryAgent → SearchAgent → RankingAgent → EvaluatorAgent

import { NextRequest, NextResponse } from "next/server";
import { SupportedLocale } from "@/lib/types";
import { executeSearch } from "@/lib/agents/orchestrator";
import { SearchQuerySchema, validateSearchParams, validationErrorResponse } from "@/lib/validators";
import { createLogger, generateRequestId } from "@/lib/logger";

const logger = createLogger("SearchRoute");

export async function GET(request: NextRequest) {
  const requestId = generateRequestId();
  const routeLogger = logger.withRequestId(requestId);
  const startTime = Date.now();

  // ── Input validation (Zod) ──
  const validation = validateSearchParams(SearchQuerySchema, request.nextUrl.searchParams);
  if (!validation.success) {
    routeLogger.warn("Validation failed", { errors: validation.error.issues });
    return NextResponse.json(validationErrorResponse(validation.error), { status: 400 });
  }

  const { q: query, locale } = validation.data;

  try {
    routeLogger.info("Search request received", { query, locale });

    // ── Execute multi-agent pipeline ──
    const result = await executeSearch({
      query,
      locale: locale as SupportedLocale,
      includeLiveData: true,
    });

    const durationMs = Date.now() - startTime;
    routeLogger.info("Search completed", { resultCount: result.stats.total, durationMs });

    return NextResponse.json({
      ...result,
      locale,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    routeLogger.error("Search failed", {
      error: error instanceof Error ? error.message : String(error),
      durationMs,
    });
    return NextResponse.json(
      { error: "Search failed", message: "Internal server error" },
      { status: 500 }
    );
  }
}
