import { NextRequest, NextResponse } from "next/server";
import PptxGenJS from "pptxgenjs";
import { MOCK_UPDATES } from "@/lib/mock-data";
import { UpdateItem, UpdateSeverity } from "@/lib/types";
import { parseQuery, searchUpdates } from "@/lib/query-parser";

/** 全モックデータをフラットに取得 */
function getAllUpdates(): UpdateItem[] {
  return Object.values(MOCK_UPDATES).flat();
}

/** 重要度ラベル・色 */
const SEVERITY_CONFIG: Record<UpdateSeverity, { label: string; color: string; bgColor: string }> = {
  breaking: { label: "🔴 要対応（Breaking Changes）", color: "C0392B", bgColor: "FCE4EC" },
  "new-feature": { label: "🟡 新機能 / 機能変更", color: "F39C12", bgColor: "FFF8E1" },
  improvement: { label: "🟢 改善 / パフォーマンス向上", color: "27AE60", bgColor: "E8F5E9" },
};

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const product = searchParams.get("product");
  const query = searchParams.get("q");
  const locale = searchParams.get("locale") || "ja";

  // データ取得
  let updates: UpdateItem[];
  let title: string;
  let subtitle: string;

  if (query) {
    const parsed = parseQuery(query);
    const result = searchUpdates(parsed);
    updates = result.updates;
    title = "Technology Update Briefing";
    subtitle = `検索: ${query}`;
  } else if (product) {
    updates = MOCK_UPDATES[product] || [];
    title = "Technology Update Briefing";
    subtitle = product;
  } else {
    updates = getAllUpdates();
    title = "Technology Update Briefing";
    subtitle = "全製品アップデート一覧";
  }

  const pptx = new PptxGenJS();
  pptx.author = "TUB Viewer";
  pptx.title = title;
  pptx.subject = "Technology Update Briefing";
  pptx.layout = "LAYOUT_WIDE"; // 16:9

  // ━━ タイトルスライド ━━
  const titleSlide = pptx.addSlide();
  titleSlide.background = { fill: "1A237E" };

  titleSlide.addText("TUB Viewer", {
    x: 0.8, y: 0.5, w: 11, h: 0.6,
    fontSize: 14, color: "7986CB", fontFace: "Segoe UI",
    bold: true,
  });

  titleSlide.addText(title, {
    x: 0.8, y: 1.5, w: 11, h: 1.2,
    fontSize: 36, color: "FFFFFF", fontFace: "Segoe UI",
    bold: true,
  });

  titleSlide.addText(subtitle, {
    x: 0.8, y: 2.8, w: 11, h: 0.6,
    fontSize: 18, color: "9FA8DA", fontFace: "Segoe UI",
  });

  const breaking = updates.filter((u) => u.severity === "breaking").length;
  const newFeature = updates.filter((u) => u.severity === "new-feature").length;
  const improvement = updates.filter((u) => u.severity === "improvement").length;

  // サマリーカード
  const statCards = [
    { label: "Total", value: updates.length.toString(), color: "3F51B5" },
    { label: "Breaking", value: breaking.toString(), color: "E53935" },
    { label: "New Feature", value: newFeature.toString(), color: "FB8C00" },
    { label: "Improvement", value: improvement.toString(), color: "43A047" },
  ];

  statCards.forEach((card, i) => {
    const x = 0.8 + i * 2.8;
    titleSlide.addShape(pptx.ShapeType.roundRect, {
      x, y: 4.0, w: 2.4, h: 1.2,
      fill: { color: card.color },
      rectRadius: 0.1,
    });
    titleSlide.addText(card.value, {
      x, y: 4.0, w: 2.4, h: 0.8,
      fontSize: 32, color: "FFFFFF", fontFace: "Segoe UI",
      bold: true, align: "center", valign: "bottom",
    });
    titleSlide.addText(card.label, {
      x, y: 4.7, w: 2.4, h: 0.5,
      fontSize: 11, color: "E8EAF6", fontFace: "Segoe UI",
      align: "center", valign: "top",
    });
  });

  titleSlide.addText(`生成日時: ${new Date().toLocaleString(locale)}  |  Data: Message Center + Microsoft Learn`, {
    x: 0.8, y: 5.8, w: 11, h: 0.4,
    fontSize: 9, color: "5C6BC0", fontFace: "Segoe UI",
  });

  // ━━ 重要度別セクションスライド + 詳細 ━━
  const severityOrder: UpdateSeverity[] = ["breaking", "new-feature", "improvement"];

  for (const sev of severityOrder) {
    const sevUpdates = updates.filter((u) => u.severity === sev);
    if (sevUpdates.length === 0) continue;

    const config = SEVERITY_CONFIG[sev];

    // セクション見出しスライド
    const sectionSlide = pptx.addSlide();
    sectionSlide.background = { fill: config.bgColor };

    sectionSlide.addText(config.label, {
      x: 0.8, y: 1.5, w: 11, h: 1,
      fontSize: 28, color: config.color, fontFace: "Segoe UI",
      bold: true,
    });

    sectionSlide.addText(`${sevUpdates.length} 件のアップデート`, {
      x: 0.8, y: 2.8, w: 11, h: 0.6,
      fontSize: 16, color: "666666", fontFace: "Segoe UI",
    });

    // 個別アップデートスライド（2件ずつ横並び、見やすく）
    for (let i = 0; i < sevUpdates.length; i += 2) {
      const slide = pptx.addSlide();

      // ヘッダーバー
      slide.addShape(pptx.ShapeType.rect, {
        x: 0, y: 0, w: 13.33, h: 0.6,
        fill: { color: config.color },
      });
      slide.addText(config.label, {
        x: 0.4, y: 0, w: 10, h: 0.6,
        fontSize: 12, color: "FFFFFF", fontFace: "Segoe UI",
        bold: true, valign: "middle",
      });

      // 各カード（最大2つ横並び）
      const chunk = sevUpdates.slice(i, i + 2);
      chunk.forEach((u, j) => {
        const cardX = 0.4 + j * 6.3;
        const cardW = 5.9;

        // カード背景
        slide.addShape(pptx.ShapeType.roundRect, {
          x: cardX, y: 0.9, w: cardW, h: 6.0,
          fill: { color: "F5F5F5" },
          rectRadius: 0.1,
          line: { color: "E0E0E0", width: 1 },
        });

        // タイトル
        slide.addText(u.title, {
          x: cardX + 0.2, y: 1.0, w: cardW - 0.4, h: 0.8,
          fontSize: 14, color: "212121", fontFace: "Segoe UI",
          bold: true, valign: "top",
          wrap: true,
        });

        // 製品バッジ
        slide.addShape(pptx.ShapeType.roundRect, {
          x: cardX + 0.2, y: 1.85, w: 2.2, h: 0.3,
          fill: { color: "E3F2FD" },
          rectRadius: 0.05,
        });
        slide.addText(u.product, {
          x: cardX + 0.2, y: 1.85, w: 2.2, h: 0.3,
          fontSize: 8, color: "1565C0", fontFace: "Segoe UI",
          align: "center", valign: "middle",
        });

        // ソースバッジ
        const sourceLabel = u.source === "message-center" ? "MC" : "Learn";
        slide.addShape(pptx.ShapeType.roundRect, {
          x: cardX + 2.5, y: 1.85, w: 1.0, h: 0.3,
          fill: { color: u.source === "message-center" ? "FFF3E0" : "E8F5E9" },
          rectRadius: 0.05,
        });
        slide.addText(`${sourceLabel} ${u.sourceId || ""}`, {
          x: cardX + 2.5, y: 1.85, w: 1.8, h: 0.3,
          fontSize: 7, color: "666666", fontFace: "Segoe UI",
          valign: "middle",
        });

        // 概要
        slide.addText("概要", {
          x: cardX + 0.2, y: 2.4, w: cardW - 0.4, h: 0.3,
          fontSize: 9, color: config.color, fontFace: "Segoe UI",
          bold: true,
        });
        slide.addText(u.summary, {
          x: cardX + 0.2, y: 2.7, w: cardW - 0.4, h: 1.2,
          fontSize: 10, color: "424242", fontFace: "Segoe UI",
          wrap: true, valign: "top",
        });

        // 影響範囲
        slide.addText("影響範囲", {
          x: cardX + 0.2, y: 4.0, w: cardW - 0.4, h: 0.3,
          fontSize: 9, color: config.color, fontFace: "Segoe UI",
          bold: true,
        });
        slide.addText(u.impact, {
          x: cardX + 0.2, y: 4.3, w: cardW - 0.4, h: 0.8,
          fontSize: 10, color: "424242", fontFace: "Segoe UI",
          wrap: true, valign: "top",
        });

        // アクション
        slide.addText("必要なアクション", {
          x: cardX + 0.2, y: 5.2, w: cardW - 0.4, h: 0.3,
          fontSize: 9, color: config.color, fontFace: "Segoe UI",
          bold: true,
        });
        slide.addText(u.actionRequired, {
          x: cardX + 0.2, y: 5.5, w: cardW - 0.4, h: 0.8,
          fontSize: 10, color: "424242", fontFace: "Segoe UI",
          wrap: true, valign: "top",
        });

        // 期限（Breaking のみ）
        if (u.deadline) {
          slide.addShape(pptx.ShapeType.roundRect, {
            x: cardX + 0.2, y: 6.4, w: cardW - 0.4, h: 0.35,
            fill: { color: "FFEBEE" },
            rectRadius: 0.05,
          });
          slide.addText(`⏰ 期限: ${u.deadline}`, {
            x: cardX + 0.4, y: 6.4, w: cardW - 0.8, h: 0.35,
            fontSize: 10, color: "C62828", fontFace: "Segoe UI",
            bold: true, valign: "middle",
          });
        }
      });
    }
  }

  // バッファ生成
  const pptxBuffer = await pptx.write({ outputType: "nodebuffer" });

  const filename = `TUB_Report_${new Date().toISOString().slice(0, 10)}.pptx`;

  return new NextResponse(pptxBuffer as Buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.presentationml.presentation",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
