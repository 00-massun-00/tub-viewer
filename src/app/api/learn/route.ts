// ── Microsoft Learn Search API Route ──
// MCP 統合: Microsoft Learn のドキュメントを検索して返す

import { NextRequest, NextResponse } from "next/server";
import { searchLearnDocs, learnResultToUpdateItem } from "@/lib/mcp-client";
import { PRODUCTS } from "@/lib/products";
import { SupportedLocale } from "@/lib/types";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const product = searchParams.get("product") || "";
  const locale = (searchParams.get("locale") || "en") as SupportedLocale;
  const maxResults = parseInt(searchParams.get("max") || "10");

  if (!query && !product) {
    return NextResponse.json(
      { error: "Either 'q' or 'product' parameter is required" },
      { status: 400 }
    );
  }

  try {
    const searchQuery = query || `${product} what's new update`;
    const results = await searchLearnDocs(searchQuery, product, maxResults);

    // 製品情報を検索
    const productInfo = PRODUCTS.find((p) => p.id === product);

    // UpdateItem 形式に変換
    const updates = results.map((r) =>
      learnResultToUpdateItem(
        r,
        productInfo?.name || product || "General",
        productInfo?.family || "Other",
        locale
      )
    );

    return NextResponse.json({
      source: "microsoft-learn",
      query: searchQuery,
      count: updates.length,
      results,
      updates,
      fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Learn search error:", error);
    return NextResponse.json(
      { error: "Failed to search Microsoft Learn", message: "External API error" },
      { status: 500 }
    );
  }
}
