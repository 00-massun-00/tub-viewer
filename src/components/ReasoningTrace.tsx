"use client";

import { useState } from "react";
import { SupportedLocale, UI_TEXT } from "@/lib/types";

/** Pipeline step from the orchestrator */
interface PipelineStep {
  agent: string;
  status: "success" | "fallback" | "skipped";
  durationMs: number;
  details: string;
}

/** Chain-of-Thought reasoning step */
interface ReasoningStep {
  step: string;
  result: string;
  confidence: number;
  rationale: string;
}

/** Evaluation result from the EvaluatorAgent */
interface EvaluationData {
  originalScore: number;
  passed: boolean;
  rewrittenQuery?: string;
  improvementActions: string[];
  evaluationReasoning: string;
}

export interface ReasoningData {
  reasoning?: {
    requestId: string;
    pipeline: string;
    steps: PipelineStep[];
    totalDurationMs: number;
    queryMethod: string;
    reasoningSteps?: ReasoningStep[];
  };
  queryAnalysis?: {
    parsed: Record<string, unknown>;
    method: string;
  };
  searchSources?: {
    mockData: number;
    learnApi: number;
    workiq: number;
    total: number;
  };
  ranking?: {
    averageRelevance: number;
    topRelevance: number;
  };
  evaluation?: EvaluationData;
}

interface ReasoningTraceProps {
  data: ReasoningData;
  locale: SupportedLocale;
}

const TRACE_TEXT: Record<string, Record<SupportedLocale, string>> = {
  reasoningTrace: {
    ja: "🧠 推論トレース",
    en: "🧠 Reasoning Trace",
    ko: "🧠 추론 트레이스",
    zh: "🧠 推理追踪",
    es: "🧠 Rastreo de razonamiento",
    fr: "🧠 Trace de raisonnement",
    de: "🧠 Reasoning-Trace",
    pt: "🧠 Rastreamento de raciocínio",
  },
  pipeline: {
    ja: "パイプライン実行",
    en: "Pipeline Execution",
    ko: "파이프라인 실행",
    zh: "管道执行",
    es: "Ejecución del pipeline",
    fr: "Exécution du pipeline",
    de: "Pipeline-Ausführung",
    pt: "Execução do pipeline",
  },
  chainOfThought: {
    ja: "Chain-of-Thought 推論ステップ",
    en: "Chain-of-Thought Reasoning Steps",
    ko: "Chain-of-Thought 추론 단계",
    zh: "Chain-of-Thought 推理步骤",
    es: "Pasos de razonamiento Chain-of-Thought",
    fr: "Étapes de raisonnement Chain-of-Thought",
    de: "Chain-of-Thought Reasoning-Schritte",
    pt: "Etapas de raciocínio Chain-of-Thought",
  },
  evaluation: {
    ja: "品質評価",
    en: "Quality Evaluation",
    ko: "품질 평가",
    zh: "质量评估",
    es: "Evaluación de calidad",
    fr: "Évaluation de qualité",
    de: "Qualitätsbewertung",
    pt: "Avaliação de qualidade",
  },
  dataSources: {
    ja: "データソース",
    en: "Data Sources",
    ko: "데이터 소스",
    zh: "数据来源",
    es: "Fuentes de datos",
    fr: "Sources de données",
    de: "Datenquellen",
    pt: "Fontes de dados",
  },
  queryMethod: {
    ja: "分析手法",
    en: "Analysis Method",
    ko: "분석 방법",
    zh: "分析方法",
    es: "Método de análisis",
    fr: "Méthode d'analyse",
    de: "Analysemethode",
    pt: "Método de análise",
  },
  totalTime: {
    ja: "合計処理時間",
    en: "Total Processing Time",
    ko: "총 처리 시간",
    zh: "总处理时间",
    es: "Tiempo total de procesamiento",
    fr: "Temps total de traitement",
    de: "Gesamtverarbeitungszeit",
    pt: "Tempo total de processamento",
  },
  passed: {
    ja: "合格",
    en: "Passed",
    ko: "통과",
    zh: "通过",
    es: "Aprobado",
    fr: "Réussi",
    de: "Bestanden",
    pt: "Aprovado",
  },
  failed: {
    ja: "再試行",
    en: "Retry triggered",
    ko: "재시도",
    zh: "重试",
    es: "Reintento",
    fr: "Nouvelle tentative",
    de: "Wiederholung",
    pt: "Nova tentativa",
  },
  confidence: {
    ja: "信頼度",
    en: "Confidence",
    ko: "신뢰도",
    zh: "置信度",
    es: "Confianza",
    fr: "Confiance",
    de: "Konfidenz",
    pt: "Confiança",
  },
};

const STATUS_COLORS: Record<string, string> = {
  success: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
  fallback: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
  skipped: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-500",
};

const STATUS_ICON: Record<string, string> = {
  success: "✅",
  fallback: "⚠️",
  skipped: "⏭️",
};

const AGENT_ICONS: Record<string, string> = {
  QueryAgent: "🔍",
  SearchAgent: "📡",
  RankingAgent: "📊",
  EvaluatorAgent: "🔄",
};

export function ReasoningTrace({ data, locale }: ReasoningTraceProps) {
  const [isOpen, setIsOpen] = useState(false);
  const t = (key: string) => TRACE_TEXT[key]?.[locale] || TRACE_TEXT[key]?.["en"] || key;

  if (!data.reasoning) return null;

  const { reasoning, searchSources, ranking, evaluation } = data;

  return (
    <div className="mt-3 mb-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors group"
        aria-expanded={isOpen}
        aria-controls="reasoning-trace-panel"
      >
        <span className="transition-transform duration-200" style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)" }}>
          ▶
        </span>
        <span>{t("reasoningTrace")}</span>
        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
          {reasoning.queryMethod === "llm-chain-of-thought" ? "LLM CoT" : "Rule-based"}
        </span>
        <span className="text-[10px] text-gray-400">
          {reasoning.totalDurationMs}ms
        </span>
      </button>

      {isOpen && (
        <div
          id="reasoning-trace-panel"
          role="region"
          aria-label={t("reasoningTrace")}
          className="mt-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 overflow-hidden animate-in slide-in-from-top-1 duration-200"
        >
          {/* Pipeline Steps */}
          <div className="p-3 border-b border-gray-100 dark:border-gray-800">
            <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
              {t("pipeline")}
            </h4>
            <div className="flex items-center gap-1">
              {reasoning.steps.map((step, i) => (
                <div key={step.agent} className="flex items-center">
                  <div className="group relative">
                    <div
                      className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-medium ${STATUS_COLORS[step.status]}`}
                    >
                      <span>{AGENT_ICONS[step.agent] || "🔧"}</span>
                      <span>{step.agent.replace("Agent", "")}</span>
                      <span className="opacity-60">{step.durationMs}ms</span>
                    </div>
                    {/* Tooltip */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 bg-gray-900 text-white text-[10px] rounded-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-30">
                      {STATUS_ICON[step.status]} {step.details}
                    </div>
                  </div>
                  {i < reasoning.steps.length - 1 && (
                    <span className="text-gray-300 dark:text-gray-600 mx-0.5">→</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Chain-of-Thought Steps */}
          {reasoning.reasoningSteps && reasoning.reasoningSteps.length > 0 && (
            <div className="p-3 border-b border-gray-100 dark:border-gray-800">
              <h4 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider mb-2">
                {t("chainOfThought")}
              </h4>
              <div className="space-y-1.5">
                {reasoning.reasoningSteps.map((step, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold flex items-center justify-center mt-0.5">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-medium text-gray-700 dark:text-gray-300">
                          {step.step}
                        </span>
                        <ConfidenceBar value={step.confidence} label={t("confidence")} />
                      </div>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                        {step.result}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Sources + Ranking + Evaluation */}
          <div className="p-3 grid grid-cols-3 gap-3">
            {/* Data Sources */}
            {searchSources && (
              <div>
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  {t("dataSources")}
                </h4>
                <div className="space-y-0.5">
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    📋 Mock: <span className="font-medium">{searchSources.mockData}</span>
                  </div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    🌐 Learn: <span className="font-medium">{searchSources.learnApi}</span>
                  </div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400">
                    🏢 WorkIQ: <span className="font-medium">{searchSources.workiq ?? 0}</span>
                  </div>
                  <div className="text-[10px] text-gray-600 dark:text-gray-400 font-medium">
                    = {searchSources.total} {locale === "ja" ? "件取得" : "total"}
                  </div>
                </div>
              </div>
            )}

            {/* Ranking */}
            {ranking && (
              <div>
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  Relevance
                </h4>
                <div className="space-y-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-500">Avg:</span>
                    <RelevanceBar value={ranking.averageRelevance} />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-gray-500">Top:</span>
                    <RelevanceBar value={ranking.topRelevance} />
                  </div>
                </div>
              </div>
            )}

            {/* Evaluation */}
            {evaluation && (
              <div>
                <h4 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1">
                  {t("evaluation")}
                </h4>
                <div className="space-y-0.5">
                  <div className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                    evaluation.passed
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400"
                  }`}>
                    {evaluation.passed ? "✅" : "🔄"} {evaluation.passed ? t("passed") : t("failed")}
                  </div>
                  <div className="text-[10px] text-gray-500">
                    Score: {(evaluation.originalScore * 100).toFixed(0)}%
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer: Request ID + Total Time */}
          <div className="px-3 py-1.5 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
            <span className="text-[9px] text-gray-400 font-mono">
              {reasoning.requestId}
            </span>
            <span className="text-[9px] text-gray-400">
              {t("totalTime")}: {reasoning.totalDurationMs}ms
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

/** Mini confidence bar */
function ConfidenceBar({ value, label }: { value: number; label: string }) {
  const percent = Math.round(value * 100);
  const color = percent >= 80 ? "bg-green-500" : percent >= 50 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-1" title={`${label}: ${percent}%`}>
      <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[9px] text-gray-400">{percent}%</span>
    </div>
  );
}

/** Relevance score bar */
function RelevanceBar({ value }: { value: number }) {
  const percent = Math.round(value * 100);
  const color = percent >= 60 ? "bg-green-500" : percent >= 30 ? "bg-yellow-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-1">
      <div className="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full transition-all`} style={{ width: `${percent}%` }} />
      </div>
      <span className="text-[10px] font-medium text-gray-600 dark:text-gray-400">{percent}%</span>
    </div>
  );
}
