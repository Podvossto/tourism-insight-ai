"use client";
import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  TrendingUp,
  TrendingDown,
  ArrowUpRight,
  MapPin,
  DollarSign,
  Users,
  Calendar,
} from "lucide-react";
import { loadTourismData } from "@/utils/tourismDataLoader";
import type { TourismDataRow } from "@/types/tourism";
import { getMapProvinceName, getThaiProvinceName } from "@/utils/provinceMapping";

interface ProvinceInsight {
  province: string;
  provinceThai: string;
  growthRate: number;
  avgRevenue: number;
  avgVisitors: number;
  years: number[];
  yearOverYearGrowth: number[];
}

interface StatsInsightsProps {
  onProvinceClick?: (province: string) => void;
}

export function StatsInsights({ onProvinceClick }: StatsInsightsProps) {
  const [insights, setInsights] = useState<ProvinceInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<"revenue" | "visitors">("revenue");

  useEffect(() => {
    const loadInsights = async () => {
      try {
        const rawData = await loadTourismData();
        const insightsData = calculateInsights(rawData, selectedMetric);
        setInsights(insightsData);
      } catch (error) {
        console.error("Failed to load insights:", error);
      } finally {
        setLoading(false);
      }
    };
    loadInsights();
  }, [selectedMetric]);

  const calculateInsights = (data: TourismDataRow[], metric: "revenue" | "visitors"): ProvinceInsight[] => {
    // Group data by province
    const provinceMap = new Map<string, TourismDataRow[]>();
    
    data.forEach((row) => {
      if (!row.province) return;
      if (!provinceMap.has(row.province)) {
        provinceMap.set(row.province, []);
      }
      provinceMap.get(row.province)!.push(row);
    });

    const insights: ProvinceInsight[] = [];

    provinceMap.forEach((rows, province) => {
      // Group by year
      const yearMap = new Map<number, TourismDataRow[]>();
      rows.forEach((row) => {
        if (!yearMap.has(row.year)) {
          yearMap.set(row.year, []);
        }
        yearMap.get(row.year)!.push(row);
      });

      const years = Array.from(yearMap.keys()).sort((a, b) => a - b);
      if (years.length < 2) return; // Need at least 2 years for growth calculation

      // Calculate year-over-year growth
      const yearOverYearGrowth: number[] = [];
      let totalGrowth = 0;
      let growthCount = 0;

      for (let i = 1; i < years.length; i++) {
        const prevYear = years[i - 1];
        const currYear = years[i];
        
        const prevYearData = yearMap.get(prevYear)!;
        const currYearData = yearMap.get(currYear)!;

        const prevTotal = prevYearData.reduce(
          (sum, r) => sum + (metric === "revenue" ? r.income : r.tourismAmount),
          0
        );
        const currTotal = currYearData.reduce(
          (sum, r) => sum + (metric === "revenue" ? r.income : r.tourismAmount),
          0
        );

        if (prevTotal > 0) {
          const growth = ((currTotal - prevTotal) / prevTotal) * 100;
          yearOverYearGrowth.push(growth);
          totalGrowth += growth;
          growthCount++;
        }
      }

      // Only include provinces with consistent growth (all positive)
      const hasConsistentGrowth = yearOverYearGrowth.every((g) => g > 0);
      if (!hasConsistentGrowth) return;

      const avgGrowth = growthCount > 0 ? totalGrowth / growthCount : 0;
      const avgRevenue = rows.reduce((sum, r) => sum + r.income, 0) / rows.length;
      const avgVisitors = rows.reduce((sum, r) => sum + r.tourismAmount, 0) / rows.length;

      const mapName = getMapProvinceName(province);
      insights.push({
        province: mapName || province,
        provinceThai: province,
        growthRate: avgGrowth,
        avgRevenue,
        avgVisitors,
        years,
        yearOverYearGrowth,
      });
    });

    // Sort by growth rate (descending)
    return insights.sort((a, b) => b.growthRate - a.growthRate).slice(0, 10);
  };

  const topProvinces = useMemo(() => {
    return insights.slice(0, 5);
  }, [insights]);

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground py-8">
            Loading insights...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Growing Provinces */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Top Growing Provinces</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Provinces with consistent year-over-year growth
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant={selectedMetric === "revenue" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMetric("revenue")}
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Revenue
              </Button>
              <Button
                variant={selectedMetric === "visitors" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedMetric("visitors")}
              >
                <Users className="h-4 w-4 mr-2" />
                Visitors
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topProvinces.map((insight, index) => (
              <Card
                key={insight.province}
                className="border-border hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => onProvinceClick?.(insight.provinceThai)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-semibold text-foreground">
                            {insight.province}
                          </h3>
                        </div>
                        <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                          <span>
                            Avg Revenue:{" "}
                            {insight.avgRevenue.toLocaleString("en-US", {
                              maximumFractionDigits: 0,
                            })}{" "}
                            M Baht
                          </span>
                          <span>
                            Avg Visitors:{" "}
                            {(insight.avgVisitors / 1_000_000).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            M people
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="flex items-center gap-2 text-green-600">
                          <TrendingUp className="h-4 w-4" />
                          <span className="font-bold">
                            {insight.growthRate.toFixed(1)}%
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Avg Growth Rate
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          onProvinceClick?.(insight.provinceThai);
                        }}
                      >
                        <ArrowUpRight className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="flex items-center gap-2 flex-wrap">
                      {insight.yearOverYearGrowth.map((growth, idx) => (
                        <Badge
                          key={idx}
                          variant="outline"
                          className={
                            growth > 0
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-red-50 text-red-700 border-red-200"
                          }
                        >
                          {insight.years[idx]}→{insight.years[idx + 1]}:{" "}
                          {growth > 0 ? "+" : ""}
                          {growth.toFixed(1)}%
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

