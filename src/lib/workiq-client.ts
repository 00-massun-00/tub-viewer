// ── WorkIQ MCP Client ──
// Connects to the WorkIQ MCP server to retrieve M365 tenant data
// (Message Center notifications, field advisory emails, etc.)
// via @modelcontextprotocol/sdk stdio transport.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { UpdateItem, ProductFamily, SupportedLocale, UI_TEXT } from "@/lib/types";
import { createLogger } from "@/lib/logger";

const logger = createLogger("WorkIQClient");

/** WorkIQ MCP 接続のシングルトン管理 */
let workiqClient: Client | null = null;
let workiqTransport: StdioClientTransport | null = null;
let connectionAttempted = false;
let connectionFailed = false;

/** WorkIQ MCP クライアントを取得（遅延初期化） */
async function getWorkIQClient(): Promise<Client | null> {
  if (connectionFailed) return null;
  if (workiqClient) return workiqClient;

  if (connectionAttempted) return null;
  connectionAttempted = true;

  try {
    workiqTransport = new StdioClientTransport({
      command: "npx",
      args: ["-y", "@microsoft/workiq", "mcp"],
    });

    workiqClient = new Client({
      name: "tub-viewer-workiq",
      version: "0.1.0",
    });

    await workiqClient.connect(workiqTransport);
    logger.info("WorkIQ MCP client connected");
    return workiqClient;
  } catch (error) {
    connectionFailed = true;
    logger.warn("WorkIQ MCP connection failed — will use other sources", {
      error: error instanceof Error ? error.message : String(error),
    });
    return null;
  }
}

/** WorkIQ から M365 テナントデータを検索 */
export async function searchWorkIQ(
  query: string,
  locale: SupportedLocale = "en",
): Promise<WorkIQResult[]> {
  try {
    const client = await getWorkIQClient();
    if (!client) return [];

    // WorkIQ の ask_work_iq ツールを呼び出し
    const response = await Promise.race([
      client.callTool({
        name: "ask_work_iq",
        arguments: {
          question: `Find Microsoft technology updates, Message Center notifications, or field advisory emails about: ${query}. List each item with its title, summary, affected products, severity (breaking/new-feature/improvement), and date. Format as structured data.`,
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error("WorkIQ timeout")), 15000)
      ),
    ]);

    // WorkIQ のレスポンスをパース
    const content = response?.content;
    if (!content || !Array.isArray(content)) return [];

    const textContent = content
      .filter((c: { type: string }) => c.type === "text")
      .map((c: { text: string }) => c.text)
      .join("\n");

    if (!textContent) return [];

    return parseWorkIQResponse(textContent, query);
  } catch (error) {
    logger.warn("WorkIQ search failed", {
      error: error instanceof Error ? error.message : String(error),
      query,
    });
    return [];
  }
}

/**
 * WorkIQ のテキストレスポンスを構造化データにパース。
 * レスポンスはマークダウン形式が多いため、セクション単位で切り出す。
 */
function parseWorkIQResponse(text: string, query: string): WorkIQResult[] {
  const results: WorkIQResult[] = [];

  // マークダウンのリストアイテムやヘッダーをパース
  const lines = text.split("\n");
  let currentItem: Partial<WorkIQResult> | null = null;

  for (const line of lines) {
    const trimmed = line.trim();

    // "**Title**" or "## Title" or "### Title" pattern
    const headerMatch = trimmed.match(/^(?:#{1,4}\s+|\*\*)(.*?)(?:\*\*)?$/);
    if (headerMatch && headerMatch[1].length > 10) {
      if (currentItem?.title) {
        results.push(finalizeWorkIQResult(currentItem));
      }
      currentItem = {
        title: headerMatch[1].replace(/\*\*/g, "").trim(),
        description: "",
        source: "workiq",
        date: new Date().toISOString().slice(0, 10),
      };
      continue;
    }

    // "- **Title**: Description" pattern
    const listMatch = trimmed.match(/^[-*]\s+\*\*(.*?)\*\*[:\s]+(.*)/);
    if (listMatch) {
      if (currentItem?.title && !currentItem.description) {
        currentItem.description = (currentItem.description || "") + " " + listMatch[2].trim();
      } else if (listMatch[1].length > 10) {
        if (currentItem?.title) {
          results.push(finalizeWorkIQResult(currentItem));
        }
        currentItem = {
          title: listMatch[1].trim(),
          description: listMatch[2].trim(),
          source: "workiq",
          date: new Date().toISOString().slice(0, 10),
        };
      }
      continue;
    }

    // Append description lines
    if (currentItem && trimmed.length > 0 && !trimmed.startsWith("---") && !trimmed.startsWith("|")) {
      currentItem.description = ((currentItem.description || "") + " " + trimmed).trim();
    }
  }

  // Push last item
  if (currentItem?.title) {
    results.push(finalizeWorkIQResult(currentItem));
  }

  return results.slice(0, 10); // Cap at 10 results
}

function finalizeWorkIQResult(partial: Partial<WorkIQResult>): WorkIQResult {
  return {
    title: partial.title || "Untitled",
    description: (partial.description || "").slice(0, 500),
    source: "workiq",
    date: partial.date || new Date().toISOString().slice(0, 10),
    url: partial.url,
    products: partial.products || [],
  };
}

/** WorkIQ の結果を UpdateItem 形式に変換 */
export function workiqResultToUpdateItem(
  result: WorkIQResult,
  product: string,
  family: ProductFamily,
  locale: SupportedLocale = "en",
): UpdateItem {
  const tl = (key: string) => UI_TEXT[key]?.[locale] || UI_TEXT[key]?.["en"] || key;

  // タイトルから重要度を推定
  const titleLower = (result.title + " " + result.description).toLowerCase();
  let severity: UpdateItem["severity"] = "improvement";
  if (
    titleLower.includes("breaking") ||
    titleLower.includes("deprecat") ||
    titleLower.includes("retir") ||
    titleLower.includes("remov") ||
    titleLower.includes("end of") ||
    titleLower.includes("sunset")
  ) {
    severity = "breaking";
  } else if (
    titleLower.includes("new") ||
    titleLower.includes("feature") ||
    titleLower.includes("preview") ||
    titleLower.includes("announc") ||
    titleLower.includes("launch") ||
    titleLower.includes("general availability")
  ) {
    severity = "new-feature";
  }

  return {
    id: `workiq-${btoa(result.title).slice(0, 12)}`,
    title: result.title,
    severity,
    product,
    productFamily: family,
    summary: result.description || tl("noDescription"),
    impact: result.url
      ? `${tl("workiqSource")} ${tl("seeDetailsAt").replace("%s", result.url)}`
      : tl("workiqSource"),
    actionRequired: severity === "breaking"
      ? tl("actionBreaking")
      : severity === "new-feature"
      ? tl("actionNewFeature")
      : tl("actionInfo"),
    source: "workiq",
    sourceId: `workiq-${Date.now()}`,
    sourceUrl: result.url || "",
    date: result.date,
  };
}

/** WorkIQ MCP クライアントのクリーンアップ */
export async function closeWorkIQClient(): Promise<void> {
  if (workiqClient) {
    try {
      await workiqClient.close();
    } catch { /* ignore */ }
    workiqClient = null;
  }
  if (workiqTransport) {
    try {
      await workiqTransport.close();
    } catch { /* ignore */ }
    workiqTransport = null;
  }
  connectionAttempted = false;
  connectionFailed = false;
}

// ── 型定義 ──

export interface WorkIQResult {
  title: string;
  description: string;
  source: "workiq";
  date: string;
  url?: string;
  products: string[];
}
