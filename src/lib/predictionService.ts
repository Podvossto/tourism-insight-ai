import { loadQuarterPredictions } from "@/lib/csvLoader";
import type {
  PredictionInput,
  PredictionResult,
  PredictionSource,
  QuarterPrediction,
} from "@/types/tourism";

const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$/, "");
const API_TIMEOUT_MS = 8000;

export const isApiConfigured = Boolean(API_URL);

export function findPrecomputedPrediction(
  predictions: QuarterPrediction[],
  input: Pick<PredictionInput, "province" | "tourism_type" | "month" | "year">
): PredictionResult | undefined {
  const match = predictions.find(
    (p) =>
      p.province === input.province &&
      p.tourism_type === input.tourism_type &&
      p.month === input.month &&
      p.year === input.year
  );
  if (!match) return undefined;
  return {
    province: match.province,
    year: match.year,
    predicted_income_million_baht: match.predicted_income_million_baht,
    predicted_tourism_amount_people: match.predicted_tourism_amount_people,
  };
}

async function predictFromApi(input: PredictionInput): Promise<PredictionResult> {
  const response = await fetch(`${API_URL}/predict/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
    signal: AbortSignal.timeout(API_TIMEOUT_MS),
  });
  if (!response.ok) {
    throw new Error((await response.text()) || "Prediction API error");
  }
  return response.json();
}

async function predictFromPrecomputed(
  input: PredictionInput
): Promise<PredictionResult> {
  const predictions = await loadQuarterPredictions();
  const result = findPrecomputedPrediction(predictions, input);
  if (!result) {
    throw new Error(
      "No precomputed prediction for this selection. Precomputed output covers Sep-Dec 2025."
    );
  }
  return result;
}

/**
 * Uses the prediction API when NEXT_PUBLIC_API_URL is set and reachable,
 * otherwise serves the precomputed model output from public/data.
 */
export async function predict(
  input: PredictionInput
): Promise<PredictionResult & { source: PredictionSource }> {
  if (API_URL) {
    try {
      return { ...(await predictFromApi(input)), source: "api" };
    } catch {
      // API unreachable: fall through to precomputed data
    }
  }
  return { ...(await predictFromPrecomputed(input)), source: "precomputed" };
}
