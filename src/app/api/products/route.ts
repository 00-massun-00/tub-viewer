// ── Products API Route ──
// 製品リストを返す。将来は MCP から動的取得に拡張

import { NextResponse } from "next/server";
import { PRODUCTS } from "@/lib/products";

export async function GET() {
  // 将来: WorkIQ MCP + Microsoft Learn MCP から動的に製品リストを取得
  // 現在はマスターデータから返却
  return NextResponse.json({
    products: PRODUCTS,
    families: [...new Set(PRODUCTS.map((p) => p.family))],
  });
}
