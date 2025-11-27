export interface PredictionInput {
  province: string;
  tourism_type: "Thai" | "Foreign";
  month: number;
  year: number;
  high_season: number;
  festival: string | null;
}

export interface PredictionResult {
  province: string;
  year: number;
  predicted_income_million_baht: number;
  predicted_tourism_amount_people: number;
}

export interface ProvinceData extends PredictionResult {
  provinceThai: string;
  trends?: TrendData[];
  festivalImpact?: FestivalImpact[];
}

export interface TrendData {
  year: number;
  revenue: number;
  tourists: number;
}

export interface FestivalImpact {
  festival: string;
  impact: number;
  revenue: number;
}
