// ── TUB Viewer 共通型定義 ──

/** 製品ファミリー */
export type ProductFamily =
  | "Azure"
  | "Dynamics 365"
  | "Microsoft 365"
  | "Power Platform"
  | "Security"
  | "Other";

/** 製品情報 */
export interface Product {
  id: string;
  name: string;
  nameEn?: string;
  family: ProductFamily;
  description?: string;
  descriptionEn?: string;
  sources: ("message-center" | "microsoft-learn")[];
}

/** アップデートの重要度カテゴリ */
export type UpdateSeverity = "breaking" | "new-feature" | "improvement";

/** アップデート情報 */
export interface UpdateItem {
  id: string;
  title: string;
  severity: UpdateSeverity;
  product: string;
  productFamily: ProductFamily;
  summary: string;
  impact: string;
  actionRequired: string;
  source: "message-center" | "microsoft-learn";
  sourceId?: string; // MC ID or Learn URL
  sourceUrl?: string;
  date?: string;
  deadline?: string;
}

/** API レスポンス */
export interface UpdatesResponse {
  product: string;
  period: string;
  locale: string;
  generatedAt: string;
  updates: UpdateItem[];
  stats: {
    breaking: number;
    newFeature: number;
    improvement: number;
    total: number;
  };
}

/** 対応言語 */
export type SupportedLocale = "ja" | "en" | "ko" | "zh" | "es" | "fr" | "de" | "pt";

export const LOCALE_LABELS: Record<SupportedLocale, string> = {
  ja: "日本語",
  en: "English",
  ko: "한국어",
  zh: "中文",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  pt: "Português",
};

/** 期間オプション */
export type PeriodOption = "1w" | "1m" | "3m" | "6m" | "custom";

export const PERIOD_LABELS: Record<string, Record<SupportedLocale, string>> = {
  "1w": { ja: "直近1週間", en: "Last 1 week", ko: "최근 1주", zh: "最近1周", es: "Última semana", fr: "Dernière semaine", de: "Letzte Woche", pt: "Última semana" },
  "1m": { ja: "直近1ヶ月", en: "Last 1 month", ko: "최근 1개월", zh: "最近1个月", es: "Último mes", fr: "Dernier mois", de: "Letzter Monat", pt: "Último mês" },
  "3m": { ja: "直近3ヶ月", en: "Last 3 months", ko: "최근 3개월", zh: "最近3个月", es: "Últimos 3 meses", fr: "3 derniers mois", de: "Letzte 3 Monate", pt: "Últimos 3 meses" },
  "6m": { ja: "直近6ヶ月", en: "Last 6 months", ko: "최근 6개월", zh: "最近6个月", es: "Últimos 6 meses", fr: "6 derniers mois", de: "Letzte 6 Monate", pt: "Últimos 6 meses" },
};

/** UI テキスト多言語対応 */
export const UI_TEXT: Record<string, Record<SupportedLocale, string>> = {
  title: { ja: "TUB Viewer", en: "TUB Viewer", ko: "TUB Viewer", zh: "TUB Viewer", es: "TUB Viewer", fr: "TUB Viewer", de: "TUB Viewer", pt: "TUB Viewer" },
  subtitle: {
    ja: "Technology Update Briefing",
    en: "Technology Update Briefing",
    ko: "Technology Update Briefing",
    zh: "Technology Update Briefing",
    es: "Technology Update Briefing",
    fr: "Technology Update Briefing",
    de: "Technology Update Briefing",
    pt: "Technology Update Briefing",
  },
  selectProduct: {
    ja: "製品を選択",
    en: "Select a product",
    ko: "제품 선택",
    zh: "选择产品",
    es: "Seleccionar producto",
    fr: "Sélectionner un produit",
    de: "Produkt auswählen",
    pt: "Selecionar produto",
  },
  period: {
    ja: "期間",
    en: "Period",
    ko: "기간",
    zh: "时间段",
    es: "Período",
    fr: "Période",
    de: "Zeitraum",
    pt: "Período",
  },
  generate: {
    ja: "ブリーフィング生成",
    en: "Generate Briefing",
    ko: "브리핑 생성",
    zh: "生成简报",
    es: "Generar informe",
    fr: "Générer le briefing",
    de: "Briefing erstellen",
    pt: "Gerar briefing",
  },
  loading: {
    ja: "アップデート情報を取得中...",
    en: "Fetching update information...",
    ko: "업데이트 정보를 가져오는 중...",
    zh: "正在获取更新信息...",
    es: "Obteniendo información de actualización...",
    fr: "Récupération des mises à jour...",
    de: "Updates werden abgerufen...",
    pt: "Obtendo informações de atualização...",
  },
  breaking: {
    ja: "🔴 要対応（Breaking Changes / 廃止予定）",
    en: "🔴 Action Required (Breaking Changes / Retirements)",
    ko: "🔴 조치 필요 (Breaking Changes / 폐지 예정)",
    zh: "🔴 需要操作（重大变更/即将弃用）",
    es: "🔴 Acción requerida (Cambios importantes / Retiros)",
    fr: "🔴 Action requise (Changements majeurs / Retraits)",
    de: "🔴 Handlungsbedarf (Breaking Changes / Auslaufend)",
    pt: "🔴 Ação necessária (Alterações importantes / Descontinuações)",
  },
  newFeature: {
    ja: "🟡 確認推奨（新機能 / 機能変更）",
    en: "🟡 Review Recommended (New Features / Changes)",
    ko: "🟡 확인 권장 (신기능 / 기능 변경)",
    zh: "🟡 建议查看（新功能/功能变更）",
    es: "🟡 Revisión recomendada (Nuevas funciones / Cambios)",
    fr: "🟡 Revue recommandée (Nouvelles fonctionnalités / Changements)",
    de: "🟡 Überprüfung empfohlen (Neue Features / Änderungen)",
    pt: "🟡 Revisão recomendada (Novos recursos / Alterações)",
  },
  improvement: {
    ja: "🟢 情報（改善 / パフォーマンス向上）",
    en: "🟢 Informational (Improvements / Enhancements)",
    ko: "🟢 정보 (개선 / 성능 향상)",
    zh: "🟢 信息（改进/性能提升）",
    es: "🟢 Informativo (Mejoras / Optimizaciones)",
    fr: "🟢 Information (Améliorations / Optimisations)",
    de: "🟢 Information (Verbesserungen / Optimierungen)",
    pt: "🟢 Informativo (Melhorias / Otimizações)",
  },
  impact: {
    ja: "影響範囲",
    en: "Impact",
    ko: "영향 범위",
    zh: "影响范围",
    es: "Impacto",
    fr: "Impact",
    de: "Auswirkung",
    pt: "Impacto",
  },
  actionRequired: {
    ja: "必要なアクション",
    en: "Action Required",
    ko: "필요한 조치",
    zh: "所需操作",
    es: "Acción requerida",
    fr: "Action requise",
    de: "Erforderliche Aktion",
    pt: "Ação necessária",
  },
  source: {
    ja: "ソース",
    en: "Source",
    ko: "소스",
    zh: "来源",
    es: "Fuente",
    fr: "Source",
    de: "Quelle",
    pt: "Fonte",
  },
  noUpdates: {
    ja: "選択した条件に一致するアップデートはありません",
    en: "No updates match the selected criteria",
    ko: "선택한 기준과 일치하는 업데이트가 없습니다",
    zh: "没有符合所选条件的更新",
    es: "No hay actualizaciones que coincidan con los criterios seleccionados",
    fr: "Aucune mise à jour ne correspond aux critères sélectionnés",
    de: "Keine Updates entsprechen den ausgewählten Kriterien",
    pt: "Nenhuma atualização corresponde aos critérios selecionados",
  },
  dataSources: {
    ja: "データソース: Message Center + Microsoft Learn",
    en: "Data Sources: Message Center + Microsoft Learn",
    ko: "데이터 소스: 메시지 센터 + Microsoft Learn",
    zh: "数据来源：消息中心 + Microsoft Learn",
    es: "Fuentes de datos: Centro de mensajes + Microsoft Learn",
    fr: "Sources de données : Centre de messages + Microsoft Learn",
    de: "Datenquellen: Nachrichtencenter + Microsoft Learn",
    pt: "Fontes de dados: Centro de mensagens + Microsoft Learn",
  },
  deadline: {
    ja: "期限",
    en: "Deadline",
    ko: "기한",
    zh: "截止日期",
    es: "Fecha límite",
    fr: "Date limite",
    de: "Frist",
    pt: "Prazo",
  },
  badgeBreaking: {
    ja: "🔴 要対応",
    en: "🔴 Action Required",
    ko: "🔴 조치 필요",
    zh: "🔴 需要操作",
    es: "🔴 Acción requerida",
    fr: "🔴 Action requise",
    de: "🔴 Handlungsbedarf",
    pt: "🔴 Ação necessária",
  },
  badgeNewFeature: {
    ja: "🟡 確認推奨",
    en: "🟡 Review",
    ko: "🟡 확인 권장",
    zh: "🟡 建议查看",
    es: "🟡 Revisar",
    fr: "🟡 À revoir",
    de: "🟡 Überprüfen",
    pt: "🟡 Revisar",
  },
  badgeImprovement: {
    ja: "🟢 情報",
    en: "🟢 Info",
    ko: "🟢 정보",
    zh: "🟢 信息",
    es: "🟢 Info",
    fr: "🟢 Info",
    de: "🟢 Info",
    pt: "🟢 Info",
  },
  details: {
    ja: "詳細 →",
    en: "Details →",
    ko: "상세 →",
    zh: "详情 →",
    es: "Detalles →",
    fr: "Détails →",
    de: "Details →",
    pt: "Detalhes →",
  },
  searchResults: {
    ja: "検索結果",
    en: "Search Results",
    ko: "검색 결과",
    zh: "搜索结果",
    es: "Resultados de búsqueda",
    fr: "Résultats de recherche",
    de: "Suchergebnisse",
    pt: "Resultados da pesquisa",
  },
  clear: {
    ja: "クリア",
    en: "Clear",
    ko: "지우기",
    zh: "清除",
    es: "Borrar",
    fr: "Effacer",
    de: "Löschen",
    pt: "Limpar",
  },
  orSearchAbove: {
    ja: "または上の検索バーから自然言語で検索",
    en: "Or search using natural language above",
    ko: "또는 위의 검색바에서 자연어로 검색",
    zh: "或使用上方搜索栏进行自然语言搜索",
    es: "O buscar usando lenguaje natural arriba",
    fr: "Ou recherchez en langage naturel ci-dessus",
    de: "Oder oben per natürlicher Sprache suchen",
    pt: "Ou pesquise usando linguagem natural acima",
  },
  learnDocUpdate: {
    ja: "Microsoft Learn ドキュメントの更新。",
    en: "Microsoft Learn documentation update.",
    ko: "Microsoft Learn 문서 업데이트.",
    zh: "Microsoft Learn 文档更新。",
    es: "Actualización de documentación de Microsoft Learn.",
    fr: "Mise à jour de la documentation Microsoft Learn.",
    de: "Microsoft Learn Dokumentationsaktualisierung.",
    pt: "Atualização da documentação do Microsoft Learn.",
  },
  seeDetailsAt: {
    ja: "詳細は %s を参照。",
    en: "See %s for details.",
    ko: "자세한 내용은 %s 을 참조하세요.",
    zh: "详情请参阅 %s。",
    es: "Consulte %s para más detalles.",
    fr: "Voir %s pour plus de détails.",
    de: "Siehe %s für Details.",
    pt: "Veja %s para detalhes.",
  },
  actionBreaking: {
    ja: "影響を確認し、移行計画を策定してください。",
    en: "Review impact and create a migration plan.",
    ko: "영향을 확인하고 마이그레이션 계획을 수립하세요.",
    zh: "请确认影响并制定迁移计划。",
    es: "Revise el impacto y cree un plan de migración.",
    fr: "Vérifiez l'impact et créez un plan de migration.",
    de: "Überprüfen Sie die Auswirkungen und erstellen Sie einen Migrationsplan.",
    pt: "Revise o impacto e crie um plano de migração.",
  },
  actionNewFeature: {
    ja: "新機能を確認し、活用可能か検討してください。",
    en: "Review the new feature and evaluate adoption.",
    ko: "새 기능을 확인하고 활용 가능 여부를 검토하세요.",
    zh: "请查看新功能并评估是否可以采用。",
    es: "Revise la nueva función y evalúe su adopción.",
    fr: "Examinez la nouvelle fonctionnalité et évaluez son adoption.",
    de: "Überprüfen Sie das neue Feature und bewerten Sie die Einführung.",
    pt: "Revise o novo recurso e avalie a adoção.",
  },
  actionInfo: {
    ja: "情報として確認してください。",
    en: "Review for informational purposes.",
    ko: "정보로 확인해 주세요.",
    zh: "请作为参考信息查阅。",
    es: "Revise con fines informativos.",
    fr: "Consultez à titre informatif.",
    de: "Zur Kenntnisnahme überprüfen.",
    pt: "Revise para fins informativos.",
  },
};
