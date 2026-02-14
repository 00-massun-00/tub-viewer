import { NextRequest, NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { MOCK_UPDATES } from "@/lib/mock-data";
import { UpdateItem, UpdateSeverity } from "@/lib/types";
import { parseQuery, searchUpdates } from "@/lib/query-parser";

/** 全モックデータをフラットに取得 */
function getAllUpdates(): UpdateItem[] {
  return Object.values(MOCK_UPDATES).flat();
}

/** 重要度ラベル */
const SEVERITY_LABEL: Record<UpdateSeverity, string> = {
  breaking: "🔴 Breaking / 要対応",
  "new-feature": "🟡 新機能",
  improvement: "🟢 改善",
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const product = searchParams.get("product");
  const query = searchParams.get("q");
  const locale = searchParams.get("locale") || "ja";

  // データ取得
  let updates: UpdateItem[];
  let title: string;

  if (query) {
    const parsed = parseQuery(query);
    const result = searchUpdates(parsed);
    updates = result.updates;
    title = `検索結果: ${query}`;
  } else if (product) {
    updates = MOCK_UPDATES[product] || [];
    title = `TUB — ${product}`;
  } else {
    updates = getAllUpdates();
    title = "TUB — 全製品アップデート一覧";
  }

  // ── Excel ワークブック作成 ──
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "TUB Viewer";
  workbook.created = new Date();

  // ━━ サマリーシート ━━
  const summarySheet = workbook.addWorksheet("サマリー");
  summarySheet.columns = [
    { header: "項目", key: "label", width: 25 },
    { header: "値", key: "value", width: 50 },
  ];

  const breaking = updates.filter((u) => u.severity === "breaking").length;
  const newFeature = updates.filter((u) => u.severity === "new-feature").length;
  const improvement = updates.filter((u) => u.severity === "improvement").length;

  summarySheet.addRows([
    { label: "レポートタイトル", value: title },
    { label: "生成日時", value: new Date().toLocaleString(locale) },
    { label: "アップデート総数", value: updates.length },
    { label: "🔴 要対応（Breaking）", value: breaking },
    { label: "🟡 新機能", value: newFeature },
    { label: "🟢 改善", value: improvement },
    { label: "データソース", value: "Message Center + Microsoft Learn" },
  ]);

  // ヘッダー行スタイリング
  summarySheet.getRow(1).font = { bold: true, size: 11 };
  summarySheet.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
  summarySheet.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };

  // ━━ 詳細シート ━━
  const detailSheet = workbook.addWorksheet("アップデート一覧");
  detailSheet.columns = [
    { header: "重要度", key: "severity", width: 20 },
    { header: "製品", key: "product", width: 22 },
    { header: "タイトル", key: "title", width: 55 },
    { header: "概要", key: "summary", width: 60 },
    { header: "影響範囲", key: "impact", width: 40 },
    { header: "必要なアクション", key: "action", width: 40 },
    { header: "ソース", key: "source", width: 18 },
    { header: "ソースID", key: "sourceId", width: 20 },
    { header: "日付", key: "date", width: 14 },
    { header: "期限", key: "deadline", width: 14 },
  ];

  // ヘッダー行スタイリング
  const headerRow = detailSheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
  headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
  headerRow.alignment = { vertical: "middle", wrapText: true };

  // 重要度別の背景色
  const severityColors: Record<UpdateSeverity, string> = {
    breaking: "FFFCE4EC",
    "new-feature": "FFFFF8E1",
    improvement: "FFE8F5E9",
  };

  for (const u of updates) {
    const row = detailSheet.addRow({
      severity: SEVERITY_LABEL[u.severity],
      product: u.product,
      title: u.title,
      summary: u.summary,
      impact: u.impact,
      action: u.actionRequired,
      source: u.source === "message-center" ? "Message Center" : "Microsoft Learn",
      sourceId: u.sourceId || "",
      date: u.date || "",
      deadline: u.deadline || "",
    });
    row.alignment = { vertical: "top", wrapText: true };
    row.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: severityColors[u.severity] },
    };
  }

  // 全列にフィルター設定
  detailSheet.autoFilter = {
    from: "A1",
    to: `J${updates.length + 1}`,
  };

  // ━━ Breaking Changes 専用シート ━━
  if (breaking > 0) {
    const breakingSheet = workbook.addWorksheet("🔴 Breaking Changes");
    breakingSheet.columns = [
      { header: "製品", key: "product", width: 22 },
      { header: "タイトル", key: "title", width: 55 },
      { header: "影響範囲", key: "impact", width: 50 },
      { header: "必要なアクション", key: "action", width: 50 },
      { header: "期限", key: "deadline", width: 14 },
      { header: "ソースID", key: "sourceId", width: 20 },
    ];
    const bHeader = breakingSheet.getRow(1);
    bHeader.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 10 };
    bHeader.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFC0392B" } };

    for (const u of updates.filter((u) => u.severity === "breaking")) {
      const row = breakingSheet.addRow({
        product: u.product,
        title: u.title,
        impact: u.impact,
        action: u.actionRequired,
        deadline: u.deadline || "未定",
        sourceId: u.sourceId || "",
      });
      row.alignment = { vertical: "top", wrapText: true };
    }
  }

  // バッファ生成
  const buffer = await workbook.xlsx.writeBuffer();

  const filename = `TUB_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
