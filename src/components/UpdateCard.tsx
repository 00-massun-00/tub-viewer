"use client";

import { UpdateItem, SupportedLocale, UI_TEXT } from "@/lib/types";

interface UpdateCardProps {
  update: UpdateItem;
  locale: SupportedLocale;
}

const SEVERITY_STYLES = {
  breaking: {
    border: "border-l-4 border-red-500",
    bg: "bg-red-50 dark:bg-red-900/20",
    badge: "bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300",
    badgeText: "🔴 要対応",
  },
  "new-feature": {
    border: "border-l-4 border-yellow-500",
    bg: "bg-yellow-50 dark:bg-yellow-900/20",
    badge: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300",
    badgeText: "🟡 確認推奨",
  },
  improvement: {
    border: "border-l-4 border-green-500",
    bg: "bg-green-50 dark:bg-green-900/20",
    badge: "bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300",
    badgeText: "🟢 情報",
  },
};

export function UpdateCard({ update, locale }: UpdateCardProps) {
  const style = SEVERITY_STYLES[update.severity];
  const t = (key: string) => UI_TEXT[key]?.[locale] || UI_TEXT[key]?.["en"] || key;

  return (
    <div
      className={`rounded-xl ${style.border} ${style.bg} p-4 shadow-sm hover:shadow-md transition-shadow`}
    >
      {/* ヘッダー */}
      <div className="flex items-start justify-between gap-2 mb-2">
        <h3 className="font-semibold text-sm leading-snug flex-1">{update.title}</h3>
        <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap ${style.badge}`}>
          {style.badgeText}
        </span>
      </div>

      {/* サマリー */}
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{update.summary}</p>

      {/* 詳細 */}
      <div className="space-y-2 text-xs">
        {/* 影響範囲 */}
        <div className="flex gap-2">
          <span className="font-semibold text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">
            {t("impact")}
          </span>
          <span className="text-gray-700 dark:text-gray-300">{update.impact}</span>
        </div>

        {/* 必要なアクション */}
        <div className="flex gap-2">
          <span className="font-semibold text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">
            {t("actionRequired")}
          </span>
          <span className="text-gray-700 dark:text-gray-300">{update.actionRequired}</span>
        </div>

        {/* 期限 */}
        {update.deadline && (
          <div className="flex gap-2">
            <span className="font-semibold text-gray-500 dark:text-gray-400 w-24 flex-shrink-0">
              {t("deadline")}
            </span>
            <span className="text-red-600 dark:text-red-400 font-medium">{update.deadline}</span>
          </div>
        )}
      </div>

      {/* フッター */}
      <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2">
          <span
            className={`text-[10px] px-1.5 py-0.5 rounded ${
              update.source === "message-center"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300"
                : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
            }`}
          >
            {update.source === "message-center" ? "Message Center" : "Microsoft Learn"}
          </span>
          {update.sourceId && (
            <span className="text-[10px] text-gray-400">{update.sourceId}</span>
          )}
        </div>
        {update.sourceUrl && (
          <a
            href={update.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-blue-500 hover:text-blue-700 hover:underline"
          >
            詳細 →
          </a>
        )}
        {update.date && (
          <span className="text-[10px] text-gray-400">{update.date}</span>
        )}
      </div>
    </div>
  );
}
