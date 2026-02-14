// ── Updates API Route ──
// 指定された製品のアップデート情報を返す
// モックデータ + Microsoft Learn MCP 統合

import { NextRequest, NextResponse } from "next/server";
import { getMockUpdates } from "@/lib/mock-data";
import { UpdatesResponse, UpdateItem } from "@/lib/types";
import { searchLearnDocs, learnResultToUpdateItem } from "@/lib/mcp-client";
import { PRODUCTS } from "@/lib/products";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const productId = searchParams.get("product") || "d365-fo";
  const period = searchParams.get("period") || "1m";
  const locale = searchParams.get("locale") || "ja";
  const includeLive = searchParams.get("live") !== "false"; // デフォルトで Learn 統合

  try {
    // ── 1. モックデータ（Message Center 相当） ──
    const mockUpdates = getMockUpdates(productId);

    // ── 2. Microsoft Learn MCP 統合（リアルデータ） ──
    let learnUpdates: UpdateItem[] = [];
    if (includeLive) {
      try {
        const productInfo = PRODUCTS.find((p) => p.id === productId);
        const searchQuery = `${productInfo?.name || productId} what's new update ${new Date().getFullYear()}`;
        const learnResults = await searchLearnDocs(searchQuery, productInfo?.name, 5);
        learnUpdates = learnResults.map((r) =>
          learnResultToUpdateItem(
            r,
            productInfo?.name || productId,
            productInfo?.family || "Other"
          )
        );
      } catch (learnError) {
        console.warn("Learn MCP fetch failed, using mock data only:", learnError);
      }
    }

    // ── 3. マージ & 重複排除 ──
    const allUpdates = [...mockUpdates, ...learnUpdates];
    const seenTitles = new Set<string>();
    const deduped = allUpdates.filter((u) => {
      const key = u.title.toLowerCase().slice(0, 50);
      if (seenTitles.has(key)) return false;
      seenTitles.add(key);
      return true;
    });

    // 期間フィルタリング
    const filteredUpdates = filterByPeriod(deduped, period);

    // 統計を生成
    const stats = {
      breaking: filteredUpdates.filter((u) => u.severity === "breaking").length,
      newFeature: filteredUpdates.filter((u) => u.severity === "new-feature").length,
      improvement: filteredUpdates.filter((u) => u.severity === "improvement").length,
      total: filteredUpdates.length,
    };

    const response: UpdatesResponse = {
      product: productId,
      period,
      locale,
      generatedAt: new Date().toISOString(),
      updates: filteredUpdates,
      stats,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching updates:", error);
    return NextResponse.json(
      { error: "Failed to fetch updates" },
      { status: 500 }
    );
  }
}

function filterByPeriod(updates: UpdateItem[], period: string): UpdateItem[] {
  const now = new Date();
  let cutoff: Date;

  switch (period) {
    case "1w":
      cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "1m":
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "3m":
      cutoff = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "6m":
      cutoff = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
      break;
    default:
      cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }

  // モックデータは日付が過去のものも含むので、全件返す（デモ用）
  // 実際の MCP 連携時は cutoff でフィルタリング
  return updates;
}
