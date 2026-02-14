"use client";

import { useState, useRef, useEffect } from "react";
import { SupportedLocale, UI_TEXT } from "@/lib/types";

interface ExportButtonProps {
  /** 現在のビュー: 製品IDまたは検索クエリ */
  productId?: string | null;
  searchQuery?: string;
  locale: SupportedLocale;
  /** エクスポート対象データがあるか */
  hasData: boolean;
}

const EXPORT_TEXT: Record<string, Record<SupportedLocale, string>> = {
  export: {
    ja: "エクスポート", en: "Export", ko: "내보내기", zh: "导出",
    es: "Exportar", fr: "Exporter", de: "Exportieren", pt: "Exportar",
  },
  excel: {
    ja: "Excel (.xlsx)", en: "Excel (.xlsx)", ko: "Excel (.xlsx)", zh: "Excel (.xlsx)",
    es: "Excel (.xlsx)", fr: "Excel (.xlsx)", de: "Excel (.xlsx)", pt: "Excel (.xlsx)",
  },
  pptx: {
    ja: "PowerPoint (.pptx)", en: "PowerPoint (.pptx)", ko: "PowerPoint (.pptx)", zh: "PowerPoint (.pptx)",
    es: "PowerPoint (.pptx)", fr: "PowerPoint (.pptx)", de: "PowerPoint (.pptx)", pt: "PowerPoint (.pptx)",
  },
  excelDesc: {
    ja: "フィルタ付き一覧表。データ分析向け",
    en: "Filterable spreadsheet for data analysis",
    ko: "필터 가능한 스프레드시트 (데이터 분석용)",
    zh: "可筛选的电子表格，适合数据分析",
    es: "Hoja de cálculo filtrable para análisis",
    fr: "Feuille de calcul filtrable pour l'analyse",
    de: "Filterfähige Tabelle für Datenanalyse",
    pt: "Planilha filtrável para análise de dados",
  },
  pptxDesc: {
    ja: "プレゼン資料。報告・共有向け",
    en: "Presentation slides for reporting & sharing",
    ko: "보고 및 공유용 프레젠테이션 슬라이드",
    zh: "用于报告和共享的演示幻灯片",
    es: "Diapositivas para informes y compartir",
    fr: "Diapositives pour les rapports et le partage",
    de: "Präsentationsfolien für Berichte",
    pt: "Slides de apresentação para relatórios",
  },
  downloading: {
    ja: "生成中...", en: "Generating...", ko: "생성 중...", zh: "生成中...",
    es: "Generando...", fr: "Génération...", de: "Wird generiert...", pt: "Gerando...",
  },
};

export function ExportButton({ productId, searchQuery, locale, hasData }: ExportButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState<"excel" | "pptx" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const t = (key: string) => EXPORT_TEXT[key]?.[locale] || EXPORT_TEXT[key]?.["en"] || key;

  // クリック外でメニュー閉じる
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const buildUrl = (format: "excel" | "pptx") => {
    const base = `/api/export/${format}`;
    const params = new URLSearchParams();
    params.set("locale", locale);
    if (searchQuery) {
      params.set("q", searchQuery);
    } else if (productId) {
      params.set("product", productId);
    }
    return `${base}?${params.toString()}`;
  };

  const handleExport = async (format: "excel" | "pptx") => {
    setDownloading(format);
    try {
      const url = buildUrl(format);
      const res = await fetch(url);
      if (!res.ok) throw new Error("Export failed");

      const blob = await res.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = res.headers.get("Content-Disposition")?.match(/filename="(.+)"/)?.[1] || `TUB_Report.${format === "excel" ? "xlsx" : "pptx"}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (err) {
      console.error("Export error:", err);
    } finally {
      setDownloading(null);
      setIsOpen(false);
    }
  };

  if (!hasData) return null;

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-label={t("export")}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm"
      >
        {/* Download icon */}
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        {t("export")}
        {/* Chevron */}
        <svg className={`w-3 h-3 transition-transform ${isOpen ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div role="menu" aria-label={t("export")} className="absolute right-0 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-30 overflow-hidden">
          {/* Excel */}
          <button
            role="menuitem"
            onClick={() => handleExport("excel")}
            disabled={downloading !== null}
            className="w-full text-left px-4 py-3 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors border-b border-gray-100 dark:border-gray-700 disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📊</span>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {downloading === "excel" ? t("downloading") : t("excel")}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {t("excelDesc")}
                </div>
              </div>
            </div>
            {downloading === "excel" && (
              <div className="mt-1 h-1 bg-green-100 dark:bg-green-900 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full animate-pulse" style={{ width: "60%" }} />
              </div>
            )}
          </button>

          {/* PowerPoint */}
          <button
            role="menuitem"
            onClick={() => handleExport("pptx")}
            disabled={downloading !== null}
            className="w-full text-left px-4 py-3 hover:bg-orange-50 dark:hover:bg-orange-900/20 transition-colors disabled:opacity-50"
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">📑</span>
              <div>
                <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                  {downloading === "pptx" ? t("downloading") : t("pptx")}
                </div>
                <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
                  {t("pptxDesc")}
                </div>
              </div>
            </div>
            {downloading === "pptx" && (
              <div className="mt-1 h-1 bg-orange-100 dark:bg-orange-900 rounded-full overflow-hidden">
                <div className="h-full bg-orange-500 rounded-full animate-pulse" style={{ width: "60%" }} />
              </div>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
