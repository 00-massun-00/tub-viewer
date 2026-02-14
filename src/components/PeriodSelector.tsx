"use client";

import { SupportedLocale, PERIOD_LABELS } from "@/lib/types";

interface PeriodSelectorProps {
  period: string;
  locale: SupportedLocale;
  onPeriodChange: (period: string) => void;
}

const PERIOD_OPTIONS = ["1w", "1m", "3m", "6m"];

export function PeriodSelector({ period, locale, onPeriodChange }: PeriodSelectorProps) {
  return (
    <div className="flex gap-1.5">
      {PERIOD_OPTIONS.map((opt) => (
        <button
          key={opt}
          onClick={() => onPeriodChange(opt)}
          className={`text-xs px-3 py-1.5 rounded-lg transition-colors ${
            period === opt
              ? "bg-blue-600 text-white shadow-sm"
              : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
        >
          {PERIOD_LABELS[opt]?.[locale] || opt}
        </button>
      ))}
    </div>
  );
}
