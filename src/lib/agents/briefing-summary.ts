// ── AI Briefing Summary Agent ──
// Generates an executive summary of search/browse results using LLM.
// Falls back to a rule-based summary when LLM is unavailable.

import { UpdateItem, SupportedLocale } from "../types";
import { getConfig, isLlmAvailable } from "../config";
import { createLogger } from "../logger";
import OpenAI from "openai";

const logger = createLogger("BriefingSummary");

export interface BriefingSummaryResult {
  summary: string;
  method: "llm" | "rule-based";
  durationMs: number;
}

const SUMMARY_PROMPT_TEMPLATES: Record<string, string> = {
  ja: `あなたはMicrosoft製品のテクニカルアドバイザーです。以下のアップデート情報をもとに、マネジメント向けの3行以内のエグゼクティブサマリーを日本語で生成してください。最も重要なポイントに焦点を当ててください。`,
  en: `You are a Microsoft technology advisor. Based on the following update information, generate a concise executive summary (max 3 sentences) for management. Focus on the most critical items.`,
  ko: `당신은 Microsoft 제품 기술 고문입니다. 다음 업데이트 정보를 바탕으로 경영진을 위한 3줄 이내의 요약을 한국어로 생성하세요.`,
  zh: `您是Microsoft产品技术顾问。根据以下更新信息，用中文生成面向管理层的3句以内摘要。`,
  es: `Eres un asesor técnico de Microsoft. Genera un resumen ejecutivo de máximo 3 oraciones basado en la siguiente información.`,
  fr: `Vous êtes un conseiller technique Microsoft. Générez un résumé exécutif de 3 phrases maximum.`,
  de: `Sie sind ein Microsoft-Technologieberater. Erstellen Sie eine Zusammenfassung in maximal 3 Sätzen.`,
  pt: `Você é um consultor técnico da Microsoft. Gere um resumo executivo de no máximo 3 frases.`,
};

/**
 * Generate an AI-powered executive summary of update results.
 */
export async function generateBriefingSummary(
  updates: UpdateItem[],
  locale: SupportedLocale,
  query?: string,
): Promise<BriefingSummaryResult> {
  const startTime = Date.now();

  if (updates.length === 0) {
    return {
      summary: "",
      method: "rule-based",
      durationMs: Date.now() - startTime,
    };
  }

  // Try LLM summary
  if (isLlmAvailable()) {
    try {
      const config = getConfig();
      const client = new OpenAI({ apiKey: config.openaiApiKey });
      const systemPrompt = SUMMARY_PROMPT_TEMPLATES[locale] || SUMMARY_PROMPT_TEMPLATES.en;

      const updateSummary = updates.slice(0, 10).map((u, i) => {
        const severity = u.severity === "breaking" ? "🔴 CRITICAL" : u.severity === "new-feature" ? "🟡 NEW" : "🟢 INFO";
        return `${i + 1}. [${severity}] ${u.titleEn || u.title}: ${u.summaryEn || u.summary}`;
      }).join("\n");

      const userMessage = query
        ? `Query: "${query}"\n\nUpdates (${updates.length} total):\n${updateSummary}`
        : `Updates (${updates.length} total):\n${updateSummary}`;

      const response = await client.chat.completions.create({
        model: config.openaiModel,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMessage },
        ],
        max_tokens: 200,
        temperature: 0.3,
      });

      const summary = response.choices[0]?.message?.content?.trim() || "";
      const durationMs = Date.now() - startTime;
      logger.info("LLM briefing summary generated", { durationMs, length: summary.length });

      return { summary, method: "llm", durationMs };
    } catch (error) {
      logger.warn("LLM summary failed, falling back to rule-based", {
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  // Rule-based fallback summary
  const summary = generateRuleBasedSummary(updates, locale);
  return {
    summary,
    method: "rule-based",
    durationMs: Date.now() - startTime,
  };
}

function generateRuleBasedSummary(updates: UpdateItem[], locale: SupportedLocale): string {
  const breaking = updates.filter((u) => u.severity === "breaking");
  const newFeatures = updates.filter((u) => u.severity === "new-feature");
  const improvements = updates.filter((u) => u.severity === "improvement");

  if (locale === "ja") {
    const parts: string[] = [];
    if (breaking.length > 0) {
      parts.push(`🔴 ${breaking.length}件の要対応項目があります。${breaking[0].title}など、早急な確認が必要です。`);
    }
    if (newFeatures.length > 0) {
      parts.push(`🟡 ${newFeatures.length}件の新機能が追加されています。`);
    }
    if (improvements.length > 0) {
      parts.push(`🟢 ${improvements.length}件の改善が含まれています。`);
    }
    return parts.join(" ") || `${updates.length}件のアップデートが見つかりました。`;
  }

  const parts: string[] = [];
  if (breaking.length > 0) {
    parts.push(`🔴 ${breaking.length} breaking change(s) require immediate attention, including "${breaking[0].titleEn || breaking[0].title}".`);
  }
  if (newFeatures.length > 0) {
    parts.push(`🟡 ${newFeatures.length} new feature(s) available for review.`);
  }
  if (improvements.length > 0) {
    parts.push(`🟢 ${improvements.length} improvement(s) included.`);
  }
  return parts.join(" ") || `${updates.length} update(s) found.`;
}
