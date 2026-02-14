"use client";

import { UpdateItem, SupportedLocale, UI_TEXT, UpdateSeverity } from "@/lib/types";
import { UpdateCard } from "./UpdateCard";

interface UpdateListProps {
  updates: UpdateItem[];
  locale: SupportedLocale;
  stats: { breaking: number; newFeature: number; improvement: number; total: number };
}

const SECTION_ORDER: { key: UpdateSeverity; textKey: string }[] = [
  { key: "breaking", textKey: "breaking" },
  { key: "new-feature", textKey: "newFeature" },
  { key: "improvement", textKey: "improvement" },
];

export function UpdateList({ updates, locale, stats }: UpdateListProps) {
  const t = (key: string) => UI_TEXT[key]?.[locale] || UI_TEXT[key]?.["en"] || key;

  if (updates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-gray-400">
        <svg className="w-16 h-16 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p className="text-sm">{t("noUpdates")}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 統計サマリー */}
      <div className="grid grid-cols-4 gap-3">
        <StatCard label="Total" value={stats.total} color="bg-gray-100 dark:bg-gray-800" textColor="text-gray-700 dark:text-gray-300" />
        <StatCard label="Breaking" value={stats.breaking} color="bg-red-50 dark:bg-red-900/20" textColor="text-red-600" />
        <StatCard label="New" value={stats.newFeature} color="bg-yellow-50 dark:bg-yellow-900/20" textColor="text-yellow-600" />
        <StatCard label="Info" value={stats.improvement} color="bg-green-50 dark:bg-green-900/20" textColor="text-green-600" />
      </div>

      {/* セクション別アップデート */}
      {SECTION_ORDER.map(({ key, textKey }) => {
        const sectionUpdates = updates.filter((u) => u.severity === key);
        if (sectionUpdates.length === 0) return null;

        return (
          <div key={key}>
            <h2 className="text-base font-bold mb-3 sticky top-0 bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm py-2 z-10">
              {t(textKey)}
              <span className="ml-2 text-sm font-normal text-gray-400">({sectionUpdates.length})</span>
            </h2>
            <div className="space-y-3">
              {sectionUpdates.map((update) => (
                <UpdateCard key={update.id} update={update} locale={locale} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function StatCard({ label, value, color, textColor }: { label: string; value: number; color: string; textColor: string }) {
  return (
    <div className={`rounded-xl ${color} p-3 text-center`}>
      <div className={`text-2xl font-bold ${textColor}`}>{value}</div>
      <div className="text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">{label}</div>
    </div>
  );
}
