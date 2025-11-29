import { useEffect, useMemo, useState } from "react";
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

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MONTHS } from "@/data/provinces";
import type { MonthlyDataPoint } from "@/types/tourism";

interface TrendChartProps {
  provinceName?: string;
  monthlyHistory?: MonthlyDataPoint[];
  primaryYear?: number;
  comparisonYear?: number;
}

const monthLabels = MONTHS.map((month) => ({
  value: month.value,
  label: month.label.slice(0, 3),
}));

export function TrendChart({
  provinceName,
  monthlyHistory,
  primaryYear: extPrimaryYear,
  comparisonYear: extComparisonYear,
}: TrendChartProps) {
  const [metric, setMetric] = useState<"revenue" | "tourists">("revenue");
  const [primaryYear, setPrimaryYear] = useState<number | undefined>(
    extPrimaryYear
  );
  const [comparisonYear, setComparisonYear] = useState<number | undefined>(
    extComparisonYear
  );

  const yearOptions = useMemo(() => {
    if (!monthlyHistory?.length) {
      return [];
    }
    return Array.from(new Set(monthlyHistory.map((point) => point.year))).sort(
      (a, b) => a - b
    );
  }, [monthlyHistory]);

  useEffect(() => {
    if (extPrimaryYear) setPrimaryYear(extPrimaryYear);
    if (extComparisonYear) setComparisonYear(extComparisonYear);
    // only change from internal if ext changes
  }, [extPrimaryYear, extComparisonYear]);

  useEffect(() => {
    if (!yearOptions.length) {
      setPrimaryYear(undefined);
      setComparisonYear(undefined);
      return;
    }
    if (!extPrimaryYear)
      setPrimaryYear((prev) => prev ?? yearOptions[yearOptions.length - 1]);
    if (comparisonYear && !yearOptions.includes(comparisonYear)) {
      setComparisonYear(undefined);
    }
  }, [yearOptions, extPrimaryYear]);

  const valueLookup = useMemo(() => {
    const map = new Map<string, MonthlyDataPoint>();
    monthlyHistory?.forEach((point) => {
      map.set(`${point.year}-${point.month}`, point);
    });
    return map;
  }, [monthlyHistory]);

  const getValue = (year: number, month: number) => {
    const record = valueLookup.get(`${year}-${month}`);
    if (!record) return 0;
    return metric === "revenue" ? record.revenue : record.tourists;
  };

  const chartData = monthLabels.map(({ value, label }) => {
    const row: Record<string, number | string> = { month: label };
    if (primaryYear) {
      row[`year-${primaryYear}`] = getValue(primaryYear, value);
    }
    if (comparisonYear && comparisonYear !== primaryYear) {
      row[`year-${comparisonYear}`] = getValue(comparisonYear, value);
    }
    return row;
  });

  const yearsToShow = [primaryYear, comparisonYear].filter(
    (year, index, arr): year is number =>
      typeof year === "number" && arr.indexOf(year) === index
  );

  const metricLabel =
    metric === "revenue"
      ? "Revenue (million Baht)"
      : "Visitors (million people)";

  if (!monthlyHistory?.length || !primaryYear) {
    return (
      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Monthly comparison ({provinceName ?? "selected province"})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Monthly history is not available for this province yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader className="space-y-3">
        <CardTitle className="text-base font-semibold">
          Monthly comparison ({provinceName ?? "selected province"})
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Primary year</Label>
              <Select
                value={primaryYear?.toString()}
                onValueChange={(value) => setPrimaryYear(parseInt(value, 10))}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Label className="text-sm">Compare year</Label>
              <Select
                value={comparisonYear ? comparisonYear.toString() : "none"}
                onValueChange={(value) => {
                  if (value === "none") {
                    setComparisonYear(undefined);
                  } else {
                    setComparisonYear(parseInt(value, 10));
                  }
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {yearOptions
                    .filter((year) => year !== primaryYear)
                    .map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="month"
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: "12px" }}
            />
            <YAxis
              stroke="hsl(var(--muted-foreground))"
              style={{ fontSize: "12px" }}
              label={{ value: metricLabel, angle: -90, position: "insideLeft" }}
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
              formatter={(v) =>
                metric === "revenue"
                  ? `${v.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })} million Baht`
                  : `${(Number(v) / 1_000_000).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} million people`
              }
            />
            <Legend />
            {yearsToShow.map((year, index) => (
              <Line
                key={year}
                type="monotone"
                dataKey={`year-${year}`}
                stroke={
                  index === 0 ? "hsl(var(--primary))" : "hsl(var(--secondary))"
                }
                strokeWidth={2}
                dot={{ r: 3 }}
                name={`${year} (${
                  metric === "revenue" ? "million Baht" : "million people"
                })`}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
