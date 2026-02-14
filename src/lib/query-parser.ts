// ── 自然言語クエリ解析 ──
// ユーザーの自然言語問い合わせを解析し、製品・期間・キーワード等にマッピング
// Phase 2: LLM で解析。現在はルールベース

import { UpdateItem } from "./types";
import { MOCK_UPDATES } from "./mock-data";
import { PRODUCTS } from "./products";

export interface ParsedQuery {
  products: string[];       // マッチした製品ID群
  keywords: string[];       // 検索キーワード
  severity: string | null;  // "breaking" | "new-feature" | "improvement" | null
  period: string | null;    // "1w" | "1m" | "3m" | "6m" | null
  source: string | null;    // "message-center" | "microsoft-learn" | null
  originalQuery: string;
}

export interface SearchResult {
  query: string;
  parsed: ParsedQuery;
  updates: UpdateItem[];
  stats: { breaking: number; newFeature: number; improvement: number; total: number };
  suggestions: string[];
}

/** 自然言語クエリを解析 */
export function parseQuery(query: string): ParsedQuery {
  const q = query.toLowerCase();

  // ── 製品マッチング ──
  const productMatches: string[] = [];
  const productKeywords: Record<string, string[]> = {
    "d365-fo": ["d365", "dynamics 365", "finance", "operations", "f&o", "fo", "scm", "commerce", "hr", "人事", "財務"],
    "d365-ce": ["customer engagement", "ce", "sales", "customer service", "field service", "営業", "フィールドサービス"],
    "d365-bc": ["business central", "bc", "ビジネスセントラル"],
    "d365-ci": ["customer insights", "ci", "marketing"],
    azure: ["azure", "アジュール", "クラウド"],
    "azure-ai": ["openai", "ai service", "cognitive", "機械学習", "ml"],
    "azure-compute": ["vm", "app service", "functions", "aks", "kubernetes", "コンテナ"],
    "azure-data": ["sql", "cosmos", "storage", "synapse", "データベース"],
    "azure-networking": ["vnet", "load balancer", "front door", "cdn", "ネットワーク"],
    "azure-security": ["defender", "key vault", "sentinel"],
    m365: ["m365", "microsoft 365", "office", "オフィス"],
    "m365-teams": ["teams", "チームズ"],
    "m365-copilot": ["copilot", "コパイロット"],
    "m365-sharepoint": ["sharepoint", "onedrive", "シェアポイント"],
    "power-platform": ["power platform", "パワープラットフォーム"],
    "power-apps": ["power apps", "powerapps", "パワーアプリ"],
    "power-automate": ["power automate", "フロー", "自動化"],
    "power-bi": ["power bi", "powerbi", "レポート", "bi"],
    dataverse: ["dataverse", "データバース"],
    security: ["security", "セキュリティ"],
    entra: ["entra", "mfa", "認証", "identity"],
  };

  for (const [productId, keywords] of Object.entries(productKeywords)) {
    if (keywords.some((kw) => q.includes(kw))) {
      productMatches.push(productId);
    }
  }

  // ── 期間マッチング ──
  let period: string | null = null;
  if (q.match(/今週|this week|이번\s*주|本周/)) period = "1w";
  else if (q.match(/今月|this month|이번\s*달|本月/)) period = "1m";
  else if (q.match(/3\s*[ヶか月ケ]|3\s*months?|3개월|3个月|四半期|quarter/)) period = "3m";
  else if (q.match(/6\s*[ヶか月ケ]|6\s*months?|半年|half\s*year/)) period = "6m";
  else if (q.match(/1\s*[ヶか月ケ]|1\s*month|先月|last\s*month/)) period = "1m";
  else if (q.match(/1\s*週|1\s*week|先週|last\s*week/)) period = "1w";
  else if (q.match(/最近|最新|latest|recent|직근|最近/)) period = "1m";

  // ── 重要度マッチング ──
  let severity: string | null = null;
  if (q.match(/breaking|廃止|retirement|サポート終了|要対応|critical|重大|긴급|紧急/)) severity = "breaking";
  else if (q.match(/new|新機能|新しい|新feature|preview|ga|신기능|新功能/)) severity = "new-feature";
  else if (q.match(/improvement|改善|パフォーマンス|向上|개선|改进/)) severity = "improvement";

  // ── ソースマッチング ──
  let source: string | null = null;
  if (q.match(/message\s*center|mc\s|通知|notification|メッセージセンター/)) source = "message-center";
  else if (q.match(/learn|ドキュメント|docs?|文書/)) source = "microsoft-learn";

  // ── キーワード抽出（ストップワード除去） ──
  // まず日本語のストップワードパターンを除去してからトークン化
  const stopPatterns = [
    /教えて/g, /見せて/g, /知りたい/g, /ください/g, /ほしい/g,
    /確認/g, /一覧/g, /情報/g, /アップデート/g, /更新/g,
    /今月/g, /今週/g, /最近/g, /最新/g, /直近/g, /先月/g,
    /[のにはをがでともやてたする]/g,
  ];
  let cleaned = query;
  for (const pat of stopPatterns) {
    cleaned = cleaned.replace(pat, " ");
  }
  const stopWordsSet = new Set([
    "update", "updates", "show", "tell", "me", "about", "what", "are", "the",
    "please", "list", "all", "recent", "latest", "new", "this", "last",
    "ある", "いる", "から", "まで", "より", "など", "こと", "もの", "ため",
    "について", "に関する",
  ]);
  const keywords = cleaned
    .split(/[\s、,。.!?！？]+/)
    .map((w) => w.trim())
    .filter((w) => w.length > 1 && !stopWordsSet.has(w.toLowerCase()));

  return {
    products: productMatches,
    keywords,
    severity,
    period,
    source,
    originalQuery: query,
  };
}

/** 全モックデータをフラットに取得 */
function getAllUpdates(): UpdateItem[] {
  return Object.values(MOCK_UPDATES).flat();
}

/** 解析結果に基づいてアップデートを検索 */
export function searchUpdates(parsed: ParsedQuery): SearchResult {
  let results: UpdateItem[];

  // 製品が特定された場合はその製品のデータ
  if (parsed.products.length > 0) {
    results = parsed.products.flatMap((pid) => MOCK_UPDATES[pid] || []);
  } else {
    // 製品未特定 → 全データから検索
    results = getAllUpdates();
  }

  // 重要度フィルタ
  if (parsed.severity) {
    results = results.filter((u) => u.severity === parsed.severity);
  }

  // ソースフィルタ
  if (parsed.source) {
    results = results.filter((u) => u.source === parsed.source);
  }

  // キーワードフィルタ（タイトル・サマリー・影響範囲に含まれるか）
  if (parsed.keywords.length > 0) {
    const keywordsLower = parsed.keywords.map((k) => k.toLowerCase());
    results = results.filter((u) => {
      const text = `${u.title} ${u.summary} ${u.impact} ${u.product} ${u.actionRequired}`.toLowerCase();
      return keywordsLower.some((kw) => text.includes(kw));
    });
  }

  // 重複排除
  const seen = new Set<string>();
  results = results.filter((u) => {
    if (seen.has(u.id)) return false;
    seen.add(u.id);
    return true;
  });

  // ソート: breaking → new-feature → improvement
  const severityOrder = { breaking: 0, "new-feature": 1, improvement: 2 };
  results.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  const stats = {
    breaking: results.filter((u) => u.severity === "breaking").length,
    newFeature: results.filter((u) => u.severity === "new-feature").length,
    improvement: results.filter((u) => u.severity === "improvement").length,
    total: results.length,
  };

  // サジェスション生成
  const suggestions = generateSuggestions(parsed, results);

  return {
    query: parsed.originalQuery,
    parsed,
    updates: results,
    stats,
    suggestions,
  };
}

/** クエリに関連するサジェスションを生成 */
function generateSuggestions(parsed: ParsedQuery, results: UpdateItem[]): string[] {
  const suggestions: string[] = [];

  if (results.length === 0) {
    suggestions.push("Azure の最新アップデートを教えて");
    suggestions.push("D365 の Breaking Changes は？");
    suggestions.push("今月の全製品アップデート");
  } else {
    // 結果に関連する追加クエリを提案
    const families = [...new Set(results.map((u) => u.productFamily))];
    if (!parsed.severity) {
      suggestions.push(`${families[0]} の Breaking Changes だけ見せて`);
    }
    if (parsed.products.length <= 1) {
      const otherProducts = PRODUCTS.filter((p) => !parsed.products.includes(p.id));
      if (otherProducts.length > 0) {
        suggestions.push(`${otherProducts[0].name} のアップデートも確認`);
      }
    }
    if (!parsed.source) {
      suggestions.push("Message Center の通知だけ表示");
    }
  }

  return suggestions.slice(0, 3);
}
