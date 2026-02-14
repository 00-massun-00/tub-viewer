// ── MCP Client ──
// Microsoft Learn MCP サーバーと通信するクライアント
// @modelcontextprotocol/sdk を使用して stdio トランスポートで接続

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { UpdateItem, ProductFamily, SupportedLocale, UI_TEXT } from "@/lib/types";

/** MCP 接続のシングルトン管理 */
let learnClient: Client | null = null;
let learnTransport: StdioClientTransport | null = null;

/** Microsoft Learn MCP クライアントを取得（遅延初期化） */
async function getLearnClient(): Promise<Client> {
  if (learnClient) return learnClient;

  learnTransport = new StdioClientTransport({
    command: "npx",
    args: ["-y", "@anthropic/mcp-server-fetch"],
  });

  learnClient = new Client({
    name: "tub-viewer",
    version: "0.1.0",
  });

  await learnClient.connect(learnTransport);
  return learnClient;
}

/**
 * Fetch with exponential backoff retry.
 * Retries on network errors and 5xx responses.
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = 2
): Promise<Response> {
  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, options);
      if (res.ok || res.status < 500) return res;
      // Server error — retry with backoff
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt) * 1000; // 1s, 2s
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw lastError || new Error("fetchWithRetry failed");
}

/** Microsoft Learn のドキュメントを検索 (with retry & timeout) */
export async function searchLearnDocs(
  query: string,
  product?: string,
  maxResults: number = 5
): Promise<LearnSearchResult[]> {
  try {
    // Microsoft Learn Search API を直接呼び出し
    const searchQuery = product ? `${product} ${query}` : query;
    const url = `https://learn.microsoft.com/api/search?search=${encodeURIComponent(searchQuery)}&locale=en-us&$top=${maxResults}&facet=products`;

    const res = await fetchWithRetry(
      url,
      {
        headers: { "Accept": "application/json" },
        signal: AbortSignal.timeout(10000),
      },
      2 // max 2 retries with exponential backoff
    );

    if (!res.ok) {
      console.warn(`Learn API returned ${res.status}`);
      return [];
    }

    const data = await res.json();
    const results: LearnSearchResult[] = (data.results || []).map((r: any) => ({
      title: r.title || "",
      description: r.description || "",
      url: r.url || "",
      lastUpdated: r.last_updated || "",
      products: r.products || [],
    }));

    return results;
  } catch (error) {
    console.error("Learn search error (after retries):", error);
    return [];
  }
}

/** Microsoft Learn の What's New ページから更新情報を取得 */
export async function fetchWhatsNew(
  product: string,
): Promise<LearnWhatsNewItem[]> {
  const productPaths: Record<string, string> = {
    "d365-fo": "dynamics365/finance-operations",
    "d365-ce": "dynamics365/sales",
    "d365-bc": "dynamics365/business-central",
    "d365-cs": "dynamics365/customer-service",
    "azure": "azure",
    "m365": "microsoft-365",
    "power-platform": "power-platform",
    "power-bi": "power-bi",
    "power-apps": "power-apps",
    "power-automate": "power-automate",
    "security": "microsoft-365/security",
  };

  const path = productPaths[product] || product;

  try {
    // Learn API で What's New を検索
    const results = await searchLearnDocs(
      `what's new ${new Date().getFullYear()}`,
      path,
      10
    );

    return results.map((r) => ({
      title: r.title,
      description: r.description,
      url: r.url,
      lastUpdated: r.lastUpdated,
      source: "microsoft-learn" as const,
    }));
  } catch (error) {
    console.error("What's New fetch error:", error);
    return [];
  }
}

/** Learn の検索結果を UpdateItem 形式に変換 */
export function learnResultToUpdateItem(
  result: LearnSearchResult,
  product: string,
  family: ProductFamily,
  locale: SupportedLocale = "en",
): UpdateItem {
  const tl = (key: string) => UI_TEXT[key]?.[locale] || UI_TEXT[key]?.["en"] || key;
  // タイトルから重要度を推定
  const titleLower = result.title.toLowerCase();
  let severity: UpdateItem["severity"] = "improvement";
  if (titleLower.includes("breaking") || titleLower.includes("deprecat") || titleLower.includes("retir") || titleLower.includes("remov")) {
    severity = "breaking";
  } else if (titleLower.includes("new") || titleLower.includes("feature") || titleLower.includes("preview") || titleLower.includes("announc")) {
    severity = "new-feature";
  }

  return {
    id: `learn-${btoa(result.url).slice(0, 12)}`,
    title: result.title,
    severity,
    product,
    productFamily: family,
    summary: result.description,
    impact: `${tl("learnDocUpdate")} ${tl("seeDetailsAt").replace("%s", result.url)}`,
    actionRequired: severity === "breaking"
      ? tl("actionBreaking")
      : severity === "new-feature"
      ? tl("actionNewFeature")
      : tl("actionInfo"),
    source: "microsoft-learn",
    sourceId: result.url.split("/").pop() || "",
    sourceUrl: result.url,
    date: result.lastUpdated || new Date().toISOString().slice(0, 10),
  };
}

/** MCP クライアントのクリーンアップ */
export async function closeMcpClients(): Promise<void> {
  if (learnClient) {
    await learnClient.close();
    learnClient = null;
  }
  if (learnTransport) {
    await learnTransport.close();
    learnTransport = null;
  }
}

// ── 型定義 ──

export interface LearnSearchResult {
  title: string;
  description: string;
  url: string;
  lastUpdated: string;
  products: string[];
}

export interface LearnWhatsNewItem {
  title: string;
  description: string;
  url: string;
  lastUpdated: string;
  source: "microsoft-learn";
}
