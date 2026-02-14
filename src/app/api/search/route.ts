// ── Search API Route ──
// 自然言語クエリでアップデート情報を検索

import { NextRequest, NextResponse } from "next/server";
import { parseQuery, searchUpdates } from "@/lib/query-parser";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q") || "";
  const locale = searchParams.get("locale") || "ja";

  if (!query.trim()) {
    return NextResponse.json(
      { error: "Query parameter 'q' is required" },
      { status: 400 }
    );
  }

  try {
    const parsed = parseQuery(query);
    const result = searchUpdates(parsed);

    return NextResponse.json({
      ...result,
      locale,
      generatedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Search failed" },
      { status: 500 }
    );
  }
}
