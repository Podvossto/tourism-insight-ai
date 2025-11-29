import { ArrowUpRight, Sparkles } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuarterPrediction } from "@/types/tourism";
import { MONTHS } from "@/data/provinces";

interface PredictionHighlightsProps {
  predictions: QuarterPrediction[];
  onSelectProvince?: (province: string) => void;
}

const MONTH_MAP = new Map(MONTHS.map((month) => [month.value, month.label]));

export function PredictionHighlights({
  predictions,
  onSelectProvince,
}: PredictionHighlightsProps) {
  if (!predictions?.length) {
    return null;
  }

  const topPredictions = predictions.slice(0, 6);

  return (
    <Card className="bg-card border-border shadow-lg">
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            FastAPI predictions (Sep–Dec 2025)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Live output from the trained Multi-Output Regressor exposed via
            FastAPI.
          </p>
        </div>
      </CardHeader>
      <CardContent className="grid gap-3 sm:grid-cols-2">
        {topPredictions.map((prediction) => (
          <button
            key={`${prediction.province}-${prediction.month}-${prediction.tourism_type}`}
            onClick={() => onSelectProvince?.(prediction.province)}
            className="w-full rounded-xl border border-border/60 bg-muted/40 p-4 text-left transition hover:border-primary/60 hover:bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {MONTH_MAP.get(prediction.month) ||
                    `Month ${prediction.month}`}{" "}
                  ·{" "}
                  {prediction.tourism_type === "Thai"
                    ? "Domestic"
                    : "International"}
                </p>
                <h3 className="text-lg font-semibold text-foreground">
                  {prediction.province}
                </h3>
              </div>
              <ArrowUpRight className="h-5 w-5 text-primary" />
            </div>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-muted-foreground">Revenue</p>
                <p className="font-semibold text-foreground">
                  {prediction.predicted_income_million_baht.toLocaleString("en-US", { maximumFractionDigits: 0 })} million Baht
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Visitors</p>
                <p className="font-semibold text-foreground">
                  {(
                    prediction.predicted_tourism_amount_people / 1_000_000
                  ).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} million people
                </p>
              </div>
            </div>
          </button>
        ))}
      </CardContent>
    </Card>
  );
}
