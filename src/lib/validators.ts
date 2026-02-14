// ── Input Validation Schemas (Zod) ──
// Centralized request validation for all API routes.
// Ensures input sanitization, length limits, and type safety.

import { z } from "zod";

/** Supported locale values */
export const LocaleSchema = z.enum(["ja", "en", "ko", "zh", "es", "fr", "de", "pt"]).default("ja");

/** Period filter values */
export const PeriodSchema = z.enum(["1w", "1m", "3m", "6m"]).default("1m");

/** Search query parameter validation */
export const SearchQuerySchema = z.object({
  q: z
    .string()
    .min(1, "Query must not be empty")
    .max(500, "Query must be 500 characters or less")
    .trim(),
  locale: LocaleSchema,
});

/** Updates request parameter validation */
export const UpdatesRequestSchema = z.object({
  product: z.string().min(1).max(100).default("d365-fo"),
  period: PeriodSchema,
  locale: LocaleSchema,
  live: z.enum(["true", "false"]).default("true"),
});

/** Learn API request parameter validation */
export const LearnRequestSchema = z.object({
  q: z.string().max(500, "Query must be 500 characters or less").optional(),
  product: z.string().max(100).optional(),
  locale: LocaleSchema,
  max: z
    .string()
    .default("10")
    .transform((v) => parseInt(v, 10))
    .pipe(z.number().min(1).max(50)),
}).refine(
  (data) => data.q || data.product,
  { message: "Either 'q' or 'product' parameter is required" }
);

/** Export request validation */
export const ExportRequestSchema = z.object({
  updates: z
    .array(z.any())
    .max(500, "Cannot export more than 500 items"),
  product: z.string().optional(),
  locale: LocaleSchema,
});

/** Severity enum validation */
export const SeveritySchema = z.enum(["breaking", "new-feature", "improvement"]);

/**
 * Safely parse and validate request parameters from URLSearchParams.
 * Returns { success: true, data } or { success: false, error }.
 */
export function validateSearchParams<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams,
) {
  const params: Record<string, string> = {};
  searchParams.forEach((value, key) => {
    params[key] = value;
  });
  return schema.safeParse(params) as { success: true; data: z.infer<T> } | { success: false; error: z.ZodError };
}

/**
 * Create a standardized validation error response.
 */
export function validationErrorResponse(error: z.ZodError) {
  return {
    error: "Validation failed",
    details: error.issues.map((e) => ({
      field: e.path.join("."),
      message: e.message,
    })),
  };
}
