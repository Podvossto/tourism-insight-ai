"use client";

import { useMemo, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { MONTHS } from "@/lib/provinces";
import type { MonthlyDataPoint } from "@/types/tourism";

interface YearComparisonChartProps {
  data: MonthlyDataPoint[];
  provinceName?: string;
  selectedYear: number;
  availableYears: number[];
}

const monthLabels = MONTHS.map((month) => ({
  value: month.value,
  label: month.label.slice(0, 3),
}));

export function YearComparisonChart({
  data,
  provinceName,
  selectedYear,
  availableYears,
}: YearComparisonChartProps) {
  const [metric, setMetric] = useState<"revenue" | "tourists">("revenue");
  const [compareYear, setCompareYear] = useState<number | undefined>(
    availableYears.length > 0 && availableYears[0] !== selectedYear
      ? availableYears[0]
      : undefined
  );

  const chartData = useMemo(() => {
    // Filter data for selected year and compare year
    const selectedYearData = data.filter((d) => d.year === selectedYear);
    const compareYearData = compareYear
      ? data.filter((d) => d.year === compareYear)
      : [];

    // Group by month
    const monthMap = new Map<
      number,
      {
        selectedRevenue: number | null;
        selectedTourists: number | null;
        compareRevenue: number | null;
        compareTourists: number | null;
      }
    >();

    monthLabels.forEach(({ value }) => {
      monthMap.set(value, {
        selectedRevenue: null,
        selectedTourists: null,
        compareRevenue: null,
        compareTourists: null,
      });
    });

    // Process selected year data
    selectedYearData.forEach((point) => {
      const existing = monthMap.get(point.month);
      if (existing) {
        if (existing.selectedRevenue === null) {
          existing.selectedRevenue = point.revenue;
          existing.selectedTourists = point.tourists;
        } else {
          // Average if multiple data points
          existing.selectedRevenue =
            (existing.selectedRevenue + point.revenue) / 2;
          existing.selectedTourists =
            ((existing.selectedTourists ?? 0) + point.tourists) / 2;
        }
      }
    });

    // Process compare year data
    compareYearData.forEach((point) => {
      const existing = monthMap.get(point.month);
      if (existing) {
        if (existing.compareRevenue === null) {
          existing.compareRevenue = point.revenue;
          existing.compareTourists = point.tourists;
        } else {
          // Average if multiple data points
          existing.compareRevenue = (existing.compareRevenue + point.revenue) / 2;
          existing.compareTourists =
            ((existing.compareTourists ?? 0) + point.tourists) / 2;
        }
      }
    });

    return monthLabels.map(({ value, label }) => {
      const monthData = monthMap.get(value);
      return {
        month: label,
        [`${selectedYear}_revenue`]: monthData?.selectedRevenue ?? null,
        [`${selectedYear}_tourists`]: monthData?.selectedTourists ?? null,
        [`${compareYear}_revenue`]:
          compareYear && monthData?.compareRevenue
            ? monthData.compareRevenue
            : null,
        [`${compareYear}_tourists`]:
          compareYear && monthData?.compareTourists
            ? monthData.compareTourists
            : null,
      };
    });
  }, [data, selectedYear, compareYear]);

  if (data.length === 0 || availableYears.length === 0) {
    return (
      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Year Comparison ({provinceName ?? "Selected Province"})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No data available for year comparison.
          </p>
        </CardContent>
      </Card>
    );
  }

  const metricLabel =
    metric === "revenue" ? "Revenue (million Baht)" : "Visitors (million people)";

  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader className="space-y-3">
        <CardTitle className="text-base font-semibold">
          Year Comparison ({provinceName ?? "Selected Province"})
        </CardTitle>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <Label className="text-sm">Metric</Label>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant={metric === "revenue" ? "default" : "outline"}
                onClick={() => setMetric("revenue")}
              >
                Revenue (฿)
              </Button>
              <Button
                size="sm"
                variant={metric === "tourists" ? "default" : "outline"}
                onClick={() => setMetric("tourists")}
              >
                Visitors
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label className="text-sm">Compare with</Label>
            <Select
              value={compareYear?.toString() ?? "none"}
              onValueChange={(value) =>
                setCompareYear(value === "none" ? undefined : parseInt(value, 10))
              }
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {availableYears
                  .filter((year) => year !== selectedYear)
                  .map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="hsl(var(--border))"
            />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: "12px" }}
              label={{
                value: metricLabel,
                angle: -90,
                position: "insideLeft",
              }}
              tickFormatter={(v) =>
                metric === "revenue"
                  ? v.toLocaleString("en-US", { maximumFractionDigits: 0 })
                  : (v / 1_000_000).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })
              }
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "hsl(var(--popover))",
                border: "1px solid hsl(var(--border))",
                borderRadius: "8px",
              }}
              formatter={(v, name) => {
                if (v === null) return "N/A";
                // Check metric state to determine if this is revenue or tourists
                const isRevenue = metric === "revenue";
                return isRevenue
                  ? `${v.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })} million Baht`
                  : `${(Number(v) / 1_000_000).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} million people`;
              }}
            />
            <Legend />
            {/* Selected year line */}
            <Line
              type="monotone"
              dataKey={
                metric === "revenue"
                  ? `${selectedYear}_revenue`
                  : `${selectedYear}_tourists`
              }
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              dot={{ r: 4 }}
              connectNulls={true}
              name={`${selectedYear} (Current)`}
            />
            {/* Compare year line */}
            {compareYear && (
              <Line
                type="monotone"
                dataKey={
                  metric === "revenue"
                    ? `${compareYear}_revenue`
                    : `${compareYear}_tourists`
                }
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                connectNulls={true}
                name={`${compareYear} (Previous)`}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

