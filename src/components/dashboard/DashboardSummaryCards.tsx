"use client";

import { useMemo } from "react";
import { TrendingUp, Users, ArrowUp, ArrowDown } from "lucide-react";
import { MONTHS } from "@/lib/provinces";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TourismDataRow } from "@/types/tourism";

interface DashboardSummaryCardsProps {
  data: TourismDataRow[];
  year: number;
  month?: number;
  mode: "volume" | "growth";
  growthType?: "yoy" | "mom";
  metric: "income" | "tourismAmount";
  provinceGrowthData: Map<string, number>;
}

export function DashboardSummaryCards({
  data,
  year,
  month,
  mode,
  growthType = "yoy",
  metric,
  provinceGrowthData,
}: DashboardSummaryCardsProps) {
  // Calculate totals for selected period
  const totals = useMemo(() => {
    const filtered = data.filter(
      (row) =>
        row.year === year && (month === undefined || row.month === month)
    );

    const totalValue = filtered.reduce(
      (sum, row) => sum + (metric === "income" ? row.income : row.tourismAmount),
      0
    );

    // Calculate growth (YoY or MoM) if month is selected
    let growth: number | undefined = undefined;
    if (month !== undefined) {
      const currentYearData = filtered.filter((r) => r.month === month);
      
      let previousYearData: TourismDataRow[];
      if (growthType === "yoy") {
        // YoY: compare with same month previous year
        previousYearData = data.filter(
          (r) => r.year === year - 1 && r.month === month
        );
      } else {
        // MoM: compare with previous month
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        previousYearData = data.filter(
          (r) => r.year === prevYear && r.month === prevMonth
        );
      }

      const currentTotal = currentYearData.reduce(
        (sum, r) => sum + (metric === "income" ? r.income : r.tourismAmount),
        0
      );
      const previousTotal = previousYearData.reduce(
        (sum, r) => sum + (metric === "income" ? r.income : r.tourismAmount),
        0
      );

      if (previousTotal > 0) {
        growth = ((currentTotal - previousTotal) / previousTotal) * 100;
      }
    }

    return { totalValue, growth };
  }, [data, year, month, metric, growthType]);

  const formatValue = (value: number): string => {
    if (mode === "growth") {
      return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
    }
    if (metric === "income") {
      return `${value.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      })} million Baht`;
    } else {
      return `${(value / 1_000_000).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} million people`;
    }
  };

  const displayValue = mode === "growth" && totals.growth !== undefined
    ? totals.growth
    : totals.totalValue;

  const isPositive = mode === "growth" 
    ? (totals.growth ?? 0) >= 0
    : true;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            {mode === "growth" ? (
              <TrendingUp className="h-4 w-4" />
            ) : (
              <TrendingUp className="h-4 w-4" />
            )}
            {mode === "growth"
              ? `${growthType === "yoy" ? "Year-over-Year" : "Month-over-Month"} Growth`
              : metric === "income"
              ? "Total Revenue"
              : "Total Visitors"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p
              className={`text-3xl font-bold ${
                mode === "growth"
                  ? isPositive
                    ? "text-green-600 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                  : "text-primary"
              }`}
            >
              {formatValue(displayValue)}
            </p>
            {mode === "growth" && totals.growth !== undefined && (
              <p
                className={`text-xs flex items-center gap-1 ${
                  isPositive ? "text-green-600" : "text-red-600"
                }`}
              >
                {isPositive ? (
                  <ArrowUp className="h-3 w-3" />
                ) : (
                  <ArrowDown className="h-3 w-3" />
                )}
                <span>
                  {isPositive ? "Increased" : "Decreased"} from {growthType === "yoy" ? "previous year" : "previous month"}
                </span>
              </p>
            )}
            {mode === "volume" && (
              <p className="text-xs text-muted-foreground">
                {month
                  ? `For ${MONTHS.find((m) => m.value === month)?.label} ${year}`
                  : `For ${year}`}
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {mode === "volume" && (
        <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 shadow-md">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="h-4 w-4" />
              {metric === "income" ? "Total Visitors" : "Total Revenue"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <p className="text-3xl font-bold text-secondary">
                {formatValue(
                  data
                    .filter(
                      (r) =>
                        r.year === year &&
                        (month === undefined || r.month === month)
                    )
                    .reduce(
                      (sum, r) =>
                        sum +
                        (metric === "income"
                          ? r.tourismAmount
                          : r.income),
                      0
                    )
                )}
              </p>
              <p className="text-xs text-muted-foreground">
                {metric === "income" ? "Visitors" : "Revenue"} for selected
                period
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

