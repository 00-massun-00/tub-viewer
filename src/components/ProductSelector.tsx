"use client";

import { useState } from "react";
import { Product, SupportedLocale } from "@/lib/types";
import { FAMILY_CONFIG } from "@/lib/products";

interface ProductSelectorProps {
  products: Product[];
  selectedProduct: string | null;
  onSelect: (productId: string) => void;
  locale: SupportedLocale;
}

export function ProductSelector({
  products,
  selectedProduct,
  onSelect,
  locale,
}: ProductSelectorProps) {
  const [expandedFamily, setExpandedFamily] = useState<string | null>(null);

  // 製品をファミリーごとにグループ化
  const grouped = products.reduce<Record<string, Product[]>>((acc, p) => {
    if (!acc[p.family]) acc[p.family] = [];
    acc[p.family].push(p);
    return acc;
  }, {});

  return (
    <div className="space-y-2">
      {Object.entries(grouped).map(([family, familyProducts]) => {
        const config = FAMILY_CONFIG[family] || FAMILY_CONFIG.Other;
        const isExpanded = expandedFamily === family;
        const hasSelected = familyProducts.some((p) => p.id === selectedProduct);

        return (
          <div key={family} className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            {/* ファミリーヘッダー */}
            <button
              onClick={() => setExpandedFamily(isExpanded ? null : family)}
              className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                hasSelected
                  ? "bg-blue-50 dark:bg-blue-900/30"
                  : "bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-lg">{config.icon}</span>
                <span className="font-semibold text-sm">{family}</span>
                <span className="text-xs text-gray-400">({familyProducts.length})</span>
              </div>
              <svg
                className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {/* 製品リスト */}
            {isExpanded && (
              <div className="bg-gray-50 dark:bg-gray-850 divide-y divide-gray-100 dark:divide-gray-700">
                {familyProducts.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => onSelect(product.id)}
                    className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-all ${
                      selectedProduct === product.id
                        ? "bg-blue-100 dark:bg-blue-900/50 border-l-4 border-blue-500"
                        : "hover:bg-gray-100 dark:hover:bg-gray-800 border-l-4 border-transparent"
                    }`}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{locale === "ja" ? product.name : (product.nameEn || product.name)}</div>
                      {product.description && (
                        <div className="text-xs text-gray-500 mt-0.5 truncate">
                          {locale === "ja" ? product.description : (product.descriptionEn || product.description)}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {product.sources.includes("message-center") && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded dark:bg-blue-900/40 dark:text-blue-300">
                          MC
                        </span>
                      )}
                      {product.sources.includes("microsoft-learn") && (
                        <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 rounded dark:bg-green-900/40 dark:text-green-300">
                          Learn
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
