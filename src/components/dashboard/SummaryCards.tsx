import { TrendingUp, Users, Trophy, ArrowUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProvinceData } from "@/types/tourism";

interface SummaryCardsProps {
  data?: Record<string, ProvinceData>;
}

export function SummaryCards({ data }: SummaryCardsProps) {
  const calculateTotals = () => {
    if (!data) {
      return {
        totalIncome: 0,
        totalVisitors: 0,
        topProvinces: [] as Array<{ name: string; income: number }>,
      };
    }

    const provinces = Object.values(data);
    const totalIncome = provinces.reduce(
      (sum, p) => sum + p.predicted_income_million_baht,
      0
    );
    const totalVisitors = provinces.reduce(
      (sum, p) => sum + p.predicted_tourism_amount_people,
      0
    );

    const topProvinces = [...provinces]
      .sort(
        (a, b) =>
          b.predicted_income_million_baht - a.predicted_income_million_baht
      )
      .slice(0, 5)
      .map((p) => ({
        name: p.provinceThai || p.province,
        income: p.predicted_income_million_baht,
      }));

    return { totalIncome, totalVisitors, topProvinces };
  };

  const { totalIncome, totalVisitors, topProvinces } = calculateTotals();

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground">
        National Forecast Summary
      </h2>

      {/* Total Income Card */}
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Total predicted revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-primary">
              {totalIncome.toLocaleString("en-US", { maximumFractionDigits: 0 })} million Baht
            </p>
            <p className="text-xs text-success flex items-center gap-1">
              <ArrowUp className="h-3 w-3" />
              <span>Predicted Model Output</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Total Visitors Card */}
      <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Users className="h-4 w-4" />
            Total predicted visitors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1">
            <p className="text-3xl font-bold text-secondary">
              {(totalVisitors / 1_000_000).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} million people
            </p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUp className="h-3 w-3 text-success" />
              <span className="text-success">People (all origins)</span>
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Top 5 Provinces Card */}
      <Card className="bg-card border-border shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-warning" />
            Top provinces by revenue
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topProvinces.map((province, index) => (
              <div
                key={province.name}
                className="flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {index + 1}
                  </span>
                  <span className="text-sm font-medium text-foreground">
                    {province.name}
                  </span>
                </div>
                <span className="text-sm font-semibold text-muted-foreground">
                  {province.income.toLocaleString("en-US", { maximumFractionDigits: 0 })} million Baht
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
