"use client";

import { SupportedLocale, LOCALE_LABELS } from "@/lib/types";

interface LanguageSelectorProps {
  locale: SupportedLocale;
  onLocaleChange: (locale: SupportedLocale) => void;
}

export function LanguageSelector({ locale, onLocaleChange }: LanguageSelectorProps) {
  return (
    <select
      value={locale}
      onChange={(e) => onLocaleChange(e.target.value as SupportedLocale)}
      className="text-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
    >
      {(Object.entries(LOCALE_LABELS) as [SupportedLocale, string][]).map(([code, label]) => (
        <option key={code} value={code}>
          {label}
        </option>
      ))}
    </select>
  );
}
