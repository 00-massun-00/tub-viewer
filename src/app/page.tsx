"use client";

import { useState, useEffect, useCallback } from "react";
import { Product, SupportedLocale, UpdateItem, UpdatesResponse, UI_TEXT } from "@/lib/types";
import { ProductSelector } from "@/components/ProductSelector";
import { UpdateList } from "@/components/UpdateList";
import { LanguageSelector } from "@/components/LanguageSelector";
import { PeriodSelector } from "@/components/PeriodSelector";
import { SearchBar } from "@/components/SearchBar";
import { ExportButton } from "@/components/ExportButton";
import { ReasoningTrace, ReasoningData } from "@/components/ReasoningTrace";

type ViewMode = "browse" | "search";

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [locale, setLocale] = useState<SupportedLocale>("ja");
  const [period, setPeriod] = useState("1m");
  const [updates, setUpdates] = useState<UpdateItem[]>([]);
  const [stats, setStats] = useState({ breaking: 0, newFeature: 0, improvement: 0, total: 0 });
  const [loading, setLoading] = useState(false);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  // 検索関連
  const [viewMode, setViewMode] = useState<ViewMode>("browse");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);
  const [parsedInfo, setParsedInfo] = useState<{ products: string[]; severity: string | null; period: string | null; source: string | null } | null>(null);
  const [reasoningData, setReasoningData] = useState<ReasoningData | null>(null);
  const [briefingSummary, setBriefingSummary] = useState<string | null>(null);

  const t = (key: string) => UI_TEXT[key]?.[locale] || UI_TEXT[key]?.["en"] || key;

  // 製品リスト取得
  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((data) => setProducts(data.products))
      .catch(console.error);
  }, []);

  // アップデート取得（製品ブラウズモード）
  const fetchUpdates = useCallback(async (productId: string, p: string, l: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/updates?product=${productId}&period=${p}&locale=${l}`);
      const data: UpdatesResponse = await res.json();
      setUpdates(data.updates);
      setStats(data.stats);
      setGeneratedAt(data.generatedAt);
    } catch (error) {
      console.error("Failed to fetch updates:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 検索実行
  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    setViewMode("search");
    setSelectedProduct(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&locale=${locale}`);
      const data = await res.json();
      setUpdates(data.updates || []);
      setStats(data.stats || { breaking: 0, newFeature: 0, improvement: 0, total: 0 });
      setSearchSuggestions(data.suggestions || []);
      setParsedInfo(data.parsed || null);
      setReasoningData({
        reasoning: data.reasoning,
        queryAnalysis: data.queryAnalysis,
        searchSources: data.searchSources,
        ranking: data.ranking,
        evaluation: data.evaluation,
      });
      setBriefingSummary(data.briefingSummary?.summary || null);
      setGeneratedAt(data.generatedAt || new Date().toISOString());
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setLoading(false);
    }
  }, [locale]);

  // 製品選択時に自動取得 & ブラウズモードに切り替え
  const handleProductSelect = useCallback((productId: string) => {
    setSelectedProduct(productId);
    setViewMode("browse");
    setSearchQuery("");
    setSearchSuggestions([]);
    setParsedInfo(null);
    setReasoningData(null);
  }, []);

  // Sync html[lang] attribute with locale for accessibility
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  useEffect(() => {
    if (selectedProduct && viewMode === "browse") {
      fetchUpdates(selectedProduct, period, locale);
    }
  }, [selectedProduct, period, locale, fetchUpdates, viewMode]);

  const selectedProductInfo = products.find((p) => p.id === selectedProduct);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {/* ヘッダー */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold tracking-tight">
                <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {t("title")}
                </span>
              </h1>
              <p className="text-[10px] text-gray-400 tracking-wider uppercase">{t("subtitle")}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[10px] text-gray-400 hidden sm:inline">{t("dataSources")}</span>
              <LanguageSelector locale={locale} onLocaleChange={setLocale} />
            </div>
          </div>
          {/* 検索バー */}
          <SearchBar
            onSearch={handleSearch}
            suggestions={searchSuggestions}
            loading={loading}
            locale={locale}
          />
        </div>
      </header>

      {/* メインコンテンツ */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* サイドバー: 製品選択 */}
          <aside className="w-80 flex-shrink-0">
            <div className="sticky top-36">
              <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
                {t("selectProduct")}
              </h2>
              <ProductSelector
                products={products}
                selectedProduct={selectedProduct}
                onSelect={handleProductSelect}
                locale={locale}
              />
            </div>
          </aside>

          {/* メインエリア */}
          <main className="flex-1 min-w-0">
            {viewMode === "search" ? (
              /* 検索結果モード */
              <>
                <div className="mb-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-lg font-bold">
                          {t("searchResults")}
                        </h2>
                        <button
                          onClick={() => { setViewMode("browse"); setSearchQuery(""); setParsedInfo(null); setReasoningData(null); setBriefingSummary(null); setSearchSuggestions([]); setUpdates([]); }}
                          className="text-xs text-blue-500 hover:text-blue-700 hover:underline"
                        >
                          ✕ {t("clear")}
                        </button>
                      </div>
                      <p className="text-sm text-gray-500 mt-0.5">
                        &ldquo;{searchQuery}&rdquo;
                      </p>
                    </div>
                    <ExportButton
                      searchQuery={searchQuery}
                      locale={locale}
                      hasData={updates.length > 0}
                    />
                  </div>

                  {/* 解析結果タグ */}
                  {parsedInfo && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {parsedInfo.products.length > 0 && parsedInfo.products.map((pid) => {
                        const p = products.find((pr) => pr.id === pid);
                        return (
                          <span key={pid} className="text-[10px] px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 rounded-full">
                            📦 {locale === "ja" ? (p?.name || pid) : (p?.nameEn || p?.name || pid)}
                          </span>
                        );
                      })}
                      {parsedInfo.severity && (
                        <span className="text-[10px] px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300 rounded-full">
                          🏷️ {parsedInfo.severity}
                        </span>
                      )}
                      {parsedInfo.period && (
                        <span className="text-[10px] px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300 rounded-full">
                          📅 {parsedInfo.period}
                        </span>
                      )}
                      {parsedInfo.source && (
                        <span className="text-[10px] px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300 rounded-full">
                          📡 {parsedInfo.source}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Reasoning Trace Panel */}
                {reasoningData && (
                  <ReasoningTrace data={reasoningData} locale={locale} />
                )}

                {/* AI Briefing Summary */}
                {briefingSummary && !loading && (
                  <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-100 dark:border-blue-800/40">
                    <div className="flex items-center gap-1.5 mb-1">
                      <span className="text-xs">✨</span>
                      <span className="text-[10px] font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                        AI Briefing Summary
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                      {briefingSummary}
                    </p>
                  </div>
                )}

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                    <p className="text-sm text-gray-400">{t("loading")}</p>
                  </div>
                ) : (
                  <UpdateList updates={updates} locale={locale} stats={stats} />
                )}
              </>
            ) : !selectedProduct ? (
              /* 未選択状態 */
              <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                <p className="text-lg font-medium mb-1">{t("selectProduct")}</p>
                <p className="text-xs mb-6">Message Center + Microsoft Learn</p>
                <p className="text-sm text-gray-400 mb-2">
                  {t("orSearchAbove")}
                </p>
                <div className="flex flex-wrap justify-center gap-2 max-w-md">
                  {({
                    ja: ["今月のアップデート情報教えて", "Azure の Breaking Changes", "D365 の新機能は？"],
                    en: ["Show me this month's updates", "Azure breaking changes", "What's new in D365?"],
                    ko: ["이번 달 업데이트 알려줘", "Azure Breaking Changes", "D365 새로운 기능?"],
                    zh: ["显示本月更新", "Azure 重大变更", "D365 新功能?"],
                    es: ["Actualizaciones de este mes", "Azure breaking changes", "¿Novedades en D365?"],
                    fr: ["Mises à jour ce mois", "Azure breaking changes", "Nouveautés D365 ?"],
                    de: ["Updates diesen Monat", "Azure Breaking Changes", "Was ist neu in D365?"],
                    pt: ["Atualizações deste mês", "Azure breaking changes", "Novidades no D365?"],
                  }[locale] || ["Show me this month's updates", "Azure breaking changes", "What's new in D365?"]).map((q) => (
                    <button
                      key={q}
                      onClick={() => handleSearch(q)}
                      className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 text-gray-600 dark:text-gray-400 transition-colors"
                    >
                      💬 {q}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* ブラウズモード */
              <>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-lg font-bold">{locale === "ja" ? selectedProductInfo?.name : (selectedProductInfo?.nameEn || selectedProductInfo?.name)}</h2>
                    {generatedAt && (
                      <p className="text-[10px] text-gray-400 mt-0.5">
                        Generated: {new Date(generatedAt).toLocaleString(locale)}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3">
                    <ExportButton
                      productId={selectedProduct}
                      locale={locale}
                      hasData={updates.length > 0}
                    />
                    <PeriodSelector period={period} locale={locale} onPeriodChange={setPeriod} />
                  </div>
                </div>

                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20">
                    <div className="w-8 h-8 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-3" />
                    <p className="text-sm text-gray-400">{t("loading")}</p>
                  </div>
                ) : (
                  <UpdateList updates={updates} locale={locale} stats={stats} />
                )}
              </>
            )}
          </main>
        </div>
      </div>

      {/* フッター */}
      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 mt-8">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between text-[10px] text-gray-400">
          <span>TUB Viewer — Technology Update Briefing</span>
          <span>Data: Message Center + Microsoft Learn via MCP</span>
        </div>
      </footer>
    </div>
  );
}
