// ── LLM-Powered Chain-of-Thought Query Analyzer ──
// Multi-step reasoning pipeline using GPT-4o for intelligent query understanding.
// Implements 5-step Chain-of-Thought: Intent → Extraction → Expansion → Confidence → Summary
// Falls back to rule-based parseQuery() when OPENAI_API_KEY is not configured.

import OpenAI from "openai";
import { getConfig, isLlmAvailable } from "./config";
import { createLogger } from "./logger";
import { ParsedQuery } from "./query-parser";

const logger = createLogger("llm-query-analyzer");

/** Reasoning step in the Chain-of-Thought pipeline */
export interface ReasoningStep {
  step: string;
  description: string;
  result: string;
  confidence: number;
}

/** Extended parsed query with reasoning trace */
export interface LlmParsedQuery extends ParsedQuery {
  reasoningSteps: ReasoningStep[];
  llmUsed: boolean;
  intent: "browse" | "search" | "compare" | "summarize";
  confidenceScore: number;
}

/** System prompt for Chain-of-Thought query analysis */
const SYSTEM_PROMPT = `You are a query analysis agent for TUB Viewer, a Microsoft technology update tracking application.
Your task is to analyze user queries about Microsoft product updates using a 5-step Chain-of-Thought reasoning process.

Available products and their IDs:
- Azure (azure, azure-ai, azure-compute, azure-data, azure-networking, azure-security)
- Dynamics 365 (d365-fo, d365-ce, d365-bc, d365-ci)
- Microsoft 365 (m365, m365-teams, m365-copilot, m365-sharepoint)
- Power Platform (power-platform, power-apps, power-automate, power-bi, dataverse)
- Security (security, entra)

Respond ONLY with a valid JSON object (no markdown, no code fences) with this exact structure:
{
  "steps": [
    {
      "step": "Intent Classification",
      "description": "Classify the query intent",
      "result": "browse|search|compare|summarize",
      "confidence": 0.0-1.0
    },
    {
      "step": "Entity Extraction",
      "description": "Extract products, period, severity, keywords",
      "result": "JSON string of extracted entities",
      "confidence": 0.0-1.0
    },
    {
      "step": "Query Expansion",
      "description": "Expand abbreviations and resolve ambiguity",
      "result": "Expanded interpretation",
      "confidence": 0.0-1.0
    },
    {
      "step": "Confidence Scoring",
      "description": "Overall confidence assessment",
      "result": "Assessment summary",
      "confidence": 0.0-1.0
    },
    {
      "step": "Reasoning Summary",
      "description": "Why this analysis was chosen",
      "result": "Natural language explanation",
      "confidence": 0.0-1.0
    }
  ],
  "parsed": {
    "intent": "browse|search|compare|summarize",
    "products": ["product-id-1"],
    "keywords": ["keyword1"],
    "severity": "breaking|new-feature|improvement|null",
    "period": "1w|1m|3m|6m|null",
    "source": "message-center|microsoft-learn|null"
  }
}`;

/** OpenAI client singleton */
let openaiClient: OpenAI | null = null;

function getOpenAIClient(): OpenAI {
  if (openaiClient) return openaiClient;
  const config = getConfig();
  openaiClient = new OpenAI({ apiKey: config.openaiApiKey });
  return openaiClient;
}

/**
 * Analyze a query using GPT-4o Chain-of-Thought reasoning.
 * Returns enhanced parsed query with reasoning trace.
 */
export async function analyzeLlmQuery(query: string): Promise<LlmParsedQuery | null> {
  if (!isLlmAvailable()) {
    logger.info("LLM not available, skipping LLM analysis", { query });
    return null;
  }

  const config = getConfig();
  const startTime = Date.now();

  try {
    const client = getOpenAIClient();
    logger.info("Starting Chain-of-Thought analysis", { query, model: config.openaiModel });

    const response = await client.chat.completions.create({
      model: config.openaiModel,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: `Analyze this query: "${query}"` },
      ],
      temperature: 0.1,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      logger.warn("Empty LLM response");
      return null;
    }

    // Parse LLM JSON response
    const llmResult = JSON.parse(content);
    const durationMs = Date.now() - startTime;

    logger.info("Chain-of-Thought analysis completed", {
      durationMs,
      stepsCount: llmResult.steps?.length,
      intent: llmResult.parsed?.intent,
    });

    // Map LLM response to LlmParsedQuery
    const reasoningSteps: ReasoningStep[] = (llmResult.steps || []).map((s: any) => ({
      step: s.step,
      description: s.description,
      result: s.result,
      confidence: s.confidence,
    }));

    const parsed = llmResult.parsed || {};
    const overallConfidence =
      reasoningSteps.length > 0
        ? reasoningSteps.reduce((sum, s) => sum + s.confidence, 0) / reasoningSteps.length
        : 0;

    return {
      products: parsed.products || [],
      keywords: parsed.keywords || [],
      severity: parsed.severity === "null" ? null : parsed.severity || null,
      period: parsed.period === "null" ? null : parsed.period || null,
      source: parsed.source === "null" ? null : parsed.source || null,
      originalQuery: query,
      reasoningSteps,
      llmUsed: true,
      intent: parsed.intent || "search",
      confidenceScore: overallConfidence,
    };
  } catch (error) {
    const durationMs = Date.now() - startTime;
    logger.error("LLM analysis failed, will fallback to rule-based parsing", {
      error: error instanceof Error ? error.message : String(error),
      durationMs,
    });
    return null;
  }
}

/**
 * Reset OpenAI client (for testing).
 */
export function resetOpenAIClient(): void {
  openaiClient = null;
}
