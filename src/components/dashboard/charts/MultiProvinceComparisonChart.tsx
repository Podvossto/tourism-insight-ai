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

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { MONTHS } from "@/data/provinces";
import type { ProvinceData } from "@/types/tourism";

interface MultiProvinceComparisonChartProps {
  provinces: ProvinceData[];
}

const monthLabels = MONTHS.map((month) => ({
  value: month.value,
  label: month.label.slice(0, 3),
}));

const COLORS = [
  "hsl(var(--primary))",
  "hsl(var(--secondary))",
  "hsl(217, 91%, 60%)",
  "hsl(142, 71%, 45%)",
  "hsl(0, 84%, 60%)",
];

export function MultiProvinceComparisonChart({
  provinces,
}: MultiProvinceComparisonChartProps) {
  const [metric, setMetric] = useState<"revenue" | "tourists">("revenue");

  const chartData = useMemo(() => {
    return monthLabels.map(({ value, label }) => {
      const row: Record<string, number | string> = { month: label };
      provinces.forEach((province) => {
        const provinceName = province.provinceThai || province.province;
        if (province.monthlyHistory) {
          const monthData = province.monthlyHistory.find(
            (d) => d.month === value
          );
          if (monthData) {
            row[provinceName] =
              metric === "revenue" ? monthData.revenue : monthData.tourists;
          } else {
            row[provinceName] = 0;
          }
        } else {
          row[provinceName] = 0;
        }
      });
      return row;
    });
  }, [provinces, metric]);

  const metricLabel =
    metric === "revenue"
      ? "Revenue (million Baht)"
      : "Visitors (million people)";

  if (provinces.length < 2) {
    return null;
  }

  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader className="space-y-3">
        <CardTitle className="text-base font-semibold">
          Multi-Province Comparison
        </CardTitle>
        <div className="flex items-center gap-2">
          <Label className="text-sm">Metric:</Label>
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
        <p className="text-xs text-muted-foreground">
          Click provinces on the map to compare (up to 5 provinces). Selected:{" "}
          {provinces.map((p) => p.provinceThai || p.province).join(", ")}
        </p>
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
            {provinces.map((province, index) => {
              const provinceName = province.provinceThai || province.province;
              return (
                <Line
                  key={province.province}
                  type="monotone"
                  dataKey={provinceName}
                  stroke={COLORS[index % COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name={provinceName}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

