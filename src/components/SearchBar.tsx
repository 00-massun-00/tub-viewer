"use client";

import { useState, useRef, useEffect } from "react";
import { SupportedLocale, UI_TEXT } from "@/lib/types";

interface SearchBarProps {
  onSearch: (query: string) => void;
  suggestions: string[];
  loading: boolean;
  locale: SupportedLocale;
}

const PLACEHOLDER: Record<SupportedLocale, string> = {
  ja: "例: 今月のAzureアップデートを教えて、D365のBreaking Changesは？",
  en: "e.g., Show me Azure updates this month, D365 breaking changes?",
  ko: "예: 이번 달 Azure 업데이트, D365 Breaking Changes?",
  zh: "例如：本月Azure更新，D365重大变更？",
  es: "Ej: Actualizaciones de Azure este mes, Cambios importantes de D365?",
  fr: "Ex: Mises à jour Azure ce mois-ci, Changements D365?",
  de: "Z.B.: Azure-Updates diesen Monat, D365 Breaking Changes?",
  pt: "Ex: Atualizações do Azure este mês, Breaking Changes do D365?",
};

const EXAMPLE_QUERIES: Record<SupportedLocale, string[]> = {
  ja: [
    "今月のアップデート情報教えて",
    "Azure の Breaking Changes",
    "D365 の新機能は？",
    "Teams の最新情報",
    "Copilot 関連のアップデート",
    "Message Center の通知一覧",
    "セキュリティ関連の廃止予定",
    "Power Platform の改善点",
  ],
  en: [
    "Show me this month's updates",
    "Azure breaking changes",
    "What's new in D365?",
    "Latest Teams updates",
    "Copilot-related updates",
    "Message Center notifications",
    "Security retirements",
    "Power Platform improvements",
  ],
  ko: ["이번 달 업데이트", "Azure Breaking Changes", "D365 신기능", "Teams 최신 정보", "Copilot 업데이트", "메시지 센터 알림", "보안 관련 폐지", "Power Platform 개선"],
  zh: ["本月更新", "Azure重大变更", "D365新功能", "Teams最新消息", "Copilot更新", "消息中心通知", "安全相关弃用", "Power Platform改进"],
  es: ["Actualizaciones de este mes", "Azure breaking changes", "Novedades de D365", "Teams actualizaciones", "Copilot updates", "Notificaciones", "Retiros de seguridad", "Mejoras Power Platform"],
  fr: ["Mises à jour ce mois", "Azure breaking changes", "Nouveautés D365", "Teams mises à jour", "Copilot mises à jour", "Notifications", "Retraits sécurité", "Améliorations Power Platform"],
  de: ["Updates diesen Monat", "Azure Breaking Changes", "D365 Neuheiten", "Teams Updates", "Copilot Updates", "Benachrichtigungen", "Sicherheit Auslaufend", "Power Platform Verbesserungen"],
  pt: ["Atualizações deste mês", "Azure breaking changes", "Novidades D365", "Teams atualizações", "Copilot updates", "Notificações", "Descontinuações segurança", "Melhorias Power Platform"],
};

const SEARCH_LABEL: Record<SupportedLocale, string> = {
  ja: "検索",
  en: "Search",
  ko: "검색",
  zh: "搜索",
  es: "Buscar",
  fr: "Rechercher",
  de: "Suchen",
  pt: "Pesquisar",
};

export function SearchBar({ onSearch, suggestions, loading, locale }: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [showExamples, setShowExamples] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // 外側クリックで例を閉じる
  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowExamples(false);
      }
    };
    document.addEventListener("mousedown", handle);
    return () => document.removeEventListener("mousedown", handle);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
      setShowExamples(false);
    }
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
    onSearch(example);
    setShowExamples(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setShowExamples(true)}
              placeholder={PLACEHOLDER[locale]}
              className="w-full pl-9 pr-4 py-2.5 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-gray-400 transition-shadow shadow-sm hover:shadow"
            />
            {query && (
              <button
                type="button"
                onClick={() => { setQuery(""); inputRef.current?.focus(); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!query.trim() || loading}
            className="px-4 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm flex items-center gap-1.5"
          >
            {loading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            )}
            {SEARCH_LABEL[locale]}
          </button>
        </div>
      </form>

      {/* 検索例ドロップダウン */}
      {showExamples && !query && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-30 overflow-hidden">
          <div className="px-3 py-2 border-b border-gray-100 dark:border-gray-700">
            <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
              {locale === "ja" ? "クエリ例" : "Examples"}
            </span>
          </div>
          <div className="p-1.5">
            {(EXAMPLE_QUERIES[locale] || EXAMPLE_QUERIES.en).map((example, i) => (
              <button
                key={i}
                onClick={() => handleExampleClick(example)}
                className="w-full text-left px-3 py-2 text-sm rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 text-gray-700 dark:text-gray-300 transition-colors flex items-center gap-2"
              >
                <span className="text-gray-400 text-xs">💬</span>
                {example}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* サジェスション（検索結果後に表示） */}
      {suggestions.length > 0 && !showExamples && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => handleExampleClick(s)}
              className="text-xs px-3 py-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 text-gray-600 dark:text-gray-400 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
