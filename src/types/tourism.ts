export interface PredictionInput {
  province: string;
  tourism_type: "Thai" | "Foreign";
  month: number;
  year: number;
  high_season: number;
  festival: string | null;
}

export type PredictionSource = "api" | "precomputed";

export interface PredictionResult {
  province: string;
  year: number;
  predicted_income_million_baht: number;
  predicted_tourism_amount_people: number;
  source?: PredictionSource;
}

export interface QuarterPrediction extends PredictionResult {
  month: number;
  tourism_type: "Thai" | "Foreign";
}

export interface TrendData {
  year: number;
  revenue: number;
  tourists: number;
}

export interface MonthlyDataPoint {
  year: number;
  month: number;
  revenue: number;
  tourists: number;
  isPredicted?: boolean; // Flag to distinguish actual vs predicted data
  tourism_type?: "Thai" | "Foreign"; // Tourism type for this data point
}

export interface FestivalImpact {
  festival: string;
  impact: number;
  revenue: number;
}

export interface ProvinceData extends PredictionResult {
  provinceThai: string;
  tourism_type?: "Thai" | "Foreign"; // Track which type this prediction is for
  trends?: TrendData[];
  festivalImpact?: FestivalImpact[];
  monthlyHistory?: MonthlyDataPoint[];
  thaiData?: ProvinceData; // Reference to Thai prediction if exists
  foreignData?: ProvinceData; // Reference to Foreign prediction if exists
}

export interface TourismDataRow {
  income: number; // Income(Million Baht)
  tourismAmount: number; // Tourism_Amount
  province: string; // Province name (Thai)
  year: number; // 2023, 2024, or 2025
  month: number; // 1-12
  tourismType: "Thai" | "Foreign" | "All";
  festivals: string[]; // Array of festival names that are active
}

export interface HeatmapDataPoint {
  province: string;
  provinceThai: string;
  value: number;
  year: number;
  month: number;
  tourismType: "Thai" | "Foreign" | "All";
  growthValue?: number;
  income?: number; // Store for tooltip
  tourismAmount?: number; // Store for tooltip
}
