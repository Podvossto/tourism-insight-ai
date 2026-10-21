"use client";

import { useEffect, useState, useMemo } from "react";
import { Calendar, TrendingUp, Users, Filter } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ProvinceHeatmap } from "@/components/dashboard/ProvinceHeatmap";
import { MonthlyTrendChart } from "@/components/charts/MonthlyTrendChart";
import {
  loadTourismData,
  aggregateHeatmapData,
  getMonthlyDataForProvince,
} from "@/lib/tourismDataLoader";
import {
  getThaiProvinceName,
  getEnglishProvinceName,
} from "@/lib/provinceMapping";
import {
  getFestivalsForProvinceAndMonth,
  formatFestivalName,
} from "@/lib/festivalDetector";
import { MONTHS } from "@/lib/provinces";
import type {
  TourismDataRow,
  HeatmapDataPoint,
  MonthlyDataPoint,
} from "@/types/tourism";
// Removed unused chart imports (PieChart, LineChart, etc.)

interface ProvinceRanking {
  province: string;
  provinceThai: string;
  value: number;
  difference?: number; // For Rising Stars: difference between current and previous
  yoyGrowth?: number;
}

interface HeatmapDataPointWithGrowth extends HeatmapDataPoint {
  growthValue?: number;
}

export default function DashboardPage() {
  const [rawData, setRawData] = useState<TourismDataRow[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);

  // Filters
  const [year, setYear] = useState<number>(2024);
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [mode, setMode] = useState<"volume" | "growth">("volume");
  const [growthType, setGrowthType] = useState<"yoy" | "mom">("yoy");
  const [metric, setMetric] = useState<"income" | "tourismAmount">("income");
  const [selectedRankingItem, setSelectedRankingItem] =
    useState<ProvinceRanking | null>(null);
  const [rankingModalOpen, setRankingModalOpen] = useState(false);
  const [provinceDetailModalOpen, setProvinceDetailModalOpen] = useState(false);

  useEffect(() => {
    loadTourismData()
      .then((data) => {
        setRawData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load tourism data:", error);
        setLoading(false);
      });
  }, []);

  // Calculate growth for each province (YoY or MoM)
  const provinceGrowthData = useMemo(() => {
    if (rawData.length === 0 || !year || !month)
      return new Map<string, number>();

    const growthMap = new Map<string, { current: number; previous: number }>();

    rawData.forEach((row) => {
      if (row.year === year && row.month === month) {
        const key = row.province;
        const existing = growthMap.get(key) || { current: 0, previous: 0 };
        existing.current +=
          metric === "income" ? row.income : row.tourismAmount;
        growthMap.set(key, existing);
      } else if (
        growthType === "yoy" &&
        row.year === year - 1 &&
        row.month === month
      ) {
        // YoY: compare with same month previous year
        const key = row.province;
        const existing = growthMap.get(key) || { current: 0, previous: 0 };
        existing.previous +=
          metric === "income" ? row.income : row.tourismAmount;
        growthMap.set(key, existing);
      } else if (growthType === "mom") {
        // MoM: compare with previous month
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        if (row.month === prevMonth && row.year === prevYear) {
          const key = row.province;
          const existing = growthMap.get(key) || { current: 0, previous: 0 };
          existing.previous +=
            metric === "income" ? row.income : row.tourismAmount;
          growthMap.set(key, existing);
        }
      }
    });

    const result = new Map<string, number>();
    growthMap.forEach((data, province) => {
      if (data.previous > 0) {
        const growth = ((data.current - data.previous) / data.previous) * 100;
        result.set(province, growth);
      }
    });

    return result;
  }, [rawData, year, month, metric, growthType]);

  // Calculate province difference data (current - previous) for Rising Stars
  const provinceDifferenceData = useMemo(() => {
    if (rawData.length === 0 || !year || !month)
      return new Map<string, number>();

    const growthMap = new Map<string, { current: number; previous: number }>();

    rawData.forEach((row) => {
      if (row.year === year && row.month === month) {
        const key = row.province;
        const existing = growthMap.get(key) || { current: 0, previous: 0 };
        existing.current +=
          metric === "income" ? row.income : row.tourismAmount;
        growthMap.set(key, existing);
      } else if (
        growthType === "yoy" &&
        row.year === year - 1 &&
        row.month === month
      ) {
        // YoY: compare with same month previous year
        const key = row.province;
        const existing = growthMap.get(key) || { current: 0, previous: 0 };
        existing.previous +=
          metric === "income" ? row.income : row.tourismAmount;
        growthMap.set(key, existing);
      } else if (growthType === "mom") {
        // MoM: compare with previous month
        const prevMonth = month === 1 ? 12 : month - 1;
        const prevYear = month === 1 ? year - 1 : year;
        if (row.month === prevMonth && row.year === prevYear) {
          const key = row.province;
          const existing = growthMap.get(key) || { current: 0, previous: 0 };
          existing.previous +=
            metric === "income" ? row.income : row.tourismAmount;
          growthMap.set(key, existing);
        }
      }
    });

    const result = new Map<string, number>();
    growthMap.forEach((data, province) => {
      // Calculate difference (current - previous)
      const difference = data.current - data.previous;
      result.set(province, difference);
    });

    return result;
  }, [rawData, year, month, metric, growthType]);

  // Aggregate heatmap data
  useEffect(() => {
    if (rawData.length === 0) return;

    const aggregated = aggregateHeatmapData(rawData, {
      year,
      month,
      metric,
      tourismType: undefined, // All types
    });

    // If mode is growth, calculate growth values
    if (mode === "growth") {
      const growthData = aggregated.map((point) => {
        const thaiName =
          point.provinceThai || getThaiProvinceName(point.province);
        const growth = provinceGrowthData.get(thaiName);
        if (growth !== undefined) {
          return {
            ...point,
            value: Math.abs(growth), // Use absolute value for color scaling
            growthValue: growth, // Store actual growth for display
          } as HeatmapDataPointWithGrowth;
        }
        return point;
      });
      setHeatmapData(growthData);
    } else {
      setHeatmapData(aggregated);
    }
  }, [rawData, year, month, metric, mode, provinceGrowthData]);

  // Calculate rankings
  const rankings = useMemo(() => {
    if (heatmapData.length === 0) return { topPerformers: [], risingStars: [] };

    const topPerformers = [...heatmapData]
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((d) => ({
        province: d.province,
        provinceThai: d.provinceThai || getThaiProvinceName(d.province),
        value: d.value,
        yoyGrowth: provinceGrowthData.get(
          d.provinceThai || getThaiProvinceName(d.province)
        ),
      }));

    const risingStars = [...heatmapData]
      .map((d) => {
        const thaiName = d.provinceThai || getThaiProvinceName(d.province);
        const growth = provinceGrowthData.get(thaiName);
        const difference = provinceDifferenceData.get(thaiName) || 0;
        return {
          province: d.province,
          provinceThai: thaiName,
          value: d.value,
          difference: difference, // Store difference instead of value for Rising Stars
          yoyGrowth: growth,
        };
      })
      .filter((d) => d.yoyGrowth !== undefined && d.yoyGrowth > 0)
      .sort((a, b) => (b.yoyGrowth || 0) - (a.yoyGrowth || 0))
      .slice(0, 5);

    return { topPerformers, risingStars };
  }, [heatmapData, provinceGrowthData, provinceDifferenceData]);

  // Removed nationwideTrend - no longer needed

  // Get selected province data for modal
  const selectedProvinceData = useMemo(() => {
    if (!selectedProvince || heatmapData.length === 0) return null;

    const thaiName = getThaiProvinceName(selectedProvince);
    const data = heatmapData.find(
      (d) =>
        d.province === selectedProvince ||
        d.provinceThai === thaiName ||
        getThaiProvinceName(d.province) === thaiName
    );

    if (!data) return null;

    const festivals = month
      ? getFestivalsForProvinceAndMonth(
          rawData,
          thaiName || selectedProvince,
          month,
          year
        )
      : [];

    const yoyGrowth = provinceGrowthData.get(thaiName || selectedProvince);

    // Get actual values from raw data
    const provinceData = rawData.filter(
      (r) =>
        (r.province === thaiName ||
          getThaiProvinceName(r.province) === thaiName) &&
        r.year === year &&
        (month === undefined || r.month === month)
    );

    const actualIncome = provinceData.reduce((sum, r) => sum + r.income, 0);
    const actualTourists = provinceData.reduce(
      (sum, r) => sum + r.tourismAmount,
      0
    );

    return {
      ...data,
      festivals,
      yoyGrowth: yoyGrowth,
      actualIncome,
      actualTourists,
    };
  }, [selectedProvince, heatmapData, rawData, year, month, provinceGrowthData]);

  const handleProvinceClick = (province: string) => {
    setSelectedProvince(province);
  };

  // Load monthly data when province is selected - From Heatmap
  useEffect(() => {
    if (!selectedProvince || rawData.length === 0) {
      setMonthlyData([]);
      return;
    }

    // Convert map province name to Thai name
    const thaiName = getThaiProvinceName(selectedProvince);

    // Load data for both Thai and Foreign
    const thaiData = getMonthlyDataForProvince(rawData, thaiName, {
      year: year,
      tourismType: "Thai",
    });
    const foreignData = getMonthlyDataForProvince(rawData, thaiName, {
      year: year,
      tourismType: "Foreign",
    });
    const monthly: MonthlyDataPoint[] = [
      ...thaiData.map((d) => ({ ...d, tourism_type: "Thai" as const })),
      ...foreignData.map((d) => ({ ...d, tourism_type: "Foreign" as const })),
    ];

    setMonthlyData(monthly);
  }, [selectedProvince, rawData, year]);

  // Pie chart data for top 5 provinces
  // Removed pieChartData and COLORS - no longer needed

  return (
    <>
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="flex h-16 items-center gap-4 px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-3 flex-1">
            <h1 className="text-xl font-bold text-foreground">
              Tourism Insight AI — Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span className="hidden sm:inline">
              {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}
            </span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Filter Bar */}
        <Card className="p-4 bg-card border-border">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Label className="font-semibold">Filters:</Label>
            </div>

            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex items-center gap-2">
                <Label htmlFor="year" className="text-sm">
                  Year:
                </Label>
                <Select
                  value={year.toString()}
                  onValueChange={(value) => setYear(parseInt(value, 10))}
                >
                  <SelectTrigger id="year" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="month" className="text-sm">
                  Month:
                </Label>
                <Select
                  value={month?.toString() ?? "all"}
                  onValueChange={(value) =>
                    setMonth(value === "all" ? undefined : parseInt(value, 10))
                  }
                >
                  <SelectTrigger id="month" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {MONTHS.map((m) => (
                      <SelectItem key={m.value} value={m.value.toString()}>
                        {m.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-sm">Mode:</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Volume</span>
                  <Switch
                    checked={mode === "growth"}
                    onCheckedChange={(checked) =>
                      setMode(checked ? "growth" : "volume")
                    }
                  />
                  <span className="text-xs text-muted-foreground">Growth</span>
                </div>
              </div>

              {mode === "growth" && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Growth Type:</Label>
                  <Select
                    value={growthType}
                    onValueChange={(value: "yoy" | "mom") =>
                      setGrowthType(value)
                    }
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="yoy">YoY (Year)</SelectItem>
                      <SelectItem value="mom">MoM (Month)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Label className="text-sm">Metric:</Label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Revenue</span>
                  <Switch
                    checked={metric === "tourismAmount"}
                    onCheckedChange={(checked) =>
                      setMetric(checked ? "tourismAmount" : "income")
                    }
                  />
                  <span className="text-xs text-muted-foreground">Tourist</span>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Main Content: Heatmap (60%) + Ranking (40%) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Heatmap (60%) */}
          <div className="lg:col-span-7">
            {loading ? (
              <Card className="p-8 bg-card border-border">
                <div className="text-center text-muted-foreground">
                  Loading heatmap data...
                </div>
              </Card>
            ) : (
              <>
                <ProvinceHeatmap
                  data={heatmapData}
                  metric={metric}
                  mode={mode}
                  selectedProvince={selectedProvince}
                  onProvinceClick={handleProvinceClick}
                />
              </>
            )}
          </div>

          {/* Right: Ranking Board (40%) */}
          <div className="lg:col-span-5 space-y-4">
            <Card className="p-6 bg-card border-border shadow-lg">
              <Tabs
                value={mode === "volume" ? "top" : "rising"}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="top">Top Provinces</TabsTrigger>
                  <TabsTrigger value="rising">Most Growth</TabsTrigger>
                </TabsList>

                <TabsContent value="top" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    {rankings.topPerformers.map((item, index) => (
                      <div
                        key={item.province}
                        className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border cursor-pointer hover:bg-muted transition-colors"
                        onClick={() => {
                          // Highlight on map and show details, no modal
                          const provinceToSelect =
                            item.province || item.provinceThai;
                          handleProvinceClick(provinceToSelect);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center font-bold text-primary">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-semibold text-foreground">
                              {getEnglishProvinceName(item.provinceThai)}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {metric === "income"
                                ? `${(item.value * 1_000_000).toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )} Baht`
                                : `${item.value.toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })} people`}
                            </p>
                          </div>
                        </div>
                        {mode === "growth" && item.yoyGrowth !== undefined && (
                          <Badge
                            variant={
                              item.yoyGrowth >= 0 ? "default" : "destructive"
                            }
                          >
                            {item.yoyGrowth >= 0 ? "+" : ""}
                            {item.yoyGrowth.toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="rising" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    {rankings.risingStars.length > 0 ? (
                      rankings.risingStars.map((item, index) => (
                        <div
                          key={item.province}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border cursor-pointer hover:bg-muted transition-colors"
                          onClick={() => {
                            // Highlight on map and show details, no modal
                            const provinceToSelect =
                              item.province || item.provinceThai;
                            handleProvinceClick(provinceToSelect);
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center font-bold text-secondary">
                              {index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-foreground">
                                {getEnglishProvinceName(item.provinceThai)}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {metric === "income"
                                  ? `${(
                                      (item.difference || 0) * 1_000_000
                                    ).toLocaleString("en-US", {
                                      maximumFractionDigits: 0,
                                    })} Baht`
                                  : `${(item.difference || 0).toLocaleString(
                                      "en-US",
                                      {
                                        maximumFractionDigits: 0,
                                      }
                                    )} people`}
                              </p>
                            </div>
                          </div>
                          {item.yoyGrowth !== undefined && (
                            <Badge variant="default" className="bg-green-600">
                              {item.yoyGrowth >= 0 ? "+" : ""}
                              {item.yoyGrowth.toFixed(1)}%
                              <span className="ml-1 text-xs opacity-80">
                                ({growthType === "yoy" ? "YoY" : "MoM"})
                              </span>
                            </Badge>
                          )}
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No rising stars data available
                      </p>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            {/* Province Details - From Modal */}
            <Card className="p-6 bg-card border-border shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Province Details
              </h3>
              {selectedProvinceData ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Province:</p>
                    <p className="text-lg font-bold text-foreground">
                      {getEnglishProvinceName(
                        selectedProvinceData.provinceThai ||
                          getThaiProvinceName(selectedProvince) ||
                          selectedProvince
                      )}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/10">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Revenue</p>
                        <p className="text-lg font-bold text-primary">
                          {(() => {
                            const income =
                              selectedProvinceData.actualIncome ??
                              selectedProvinceData.income ??
                              selectedProvinceData.value;
                            // If value is in million Baht, convert to actual Baht
                            return (income * 1_000_000).toLocaleString(
                              "en-US",
                              {
                                maximumFractionDigits: 0,
                              }
                            );
                          })()}{" "}
                          Baht
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 p-3 bg-secondary/5 rounded-lg border border-secondary/10">
                      <Users className="h-5 w-5 text-secondary" />
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">
                          Visitors
                        </p>
                        <p className="text-lg font-bold text-secondary">
                          {(() => {
                            const tourists =
                              selectedProvinceData.actualTourists ??
                              selectedProvinceData.tourismAmount ??
                              selectedProvinceData.value;
                            // If value is already in actual number, use as is
                            // If value might be in millions, check and convert
                            return tourists.toLocaleString("en-US", {
                              maximumFractionDigits: 0,
                            });
                          })()}{" "}
                          people
                        </p>
                      </div>
                    </div>
                    {mode === "growth" &&
                      selectedProvinceData.yoyGrowth !== undefined && (
                        <div className="p-3 bg-accent/5 rounded-lg border border-accent/10">
                          <p className="text-xs text-muted-foreground mb-1">
                            {growthType === "yoy"
                              ? "Year-over-Year"
                              : "Month-over-Month"}{" "}
                            Growth
                          </p>
                          <p
                            className={`text-lg font-bold ${
                              selectedProvinceData.yoyGrowth >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                            }`}
                          >
                            {selectedProvinceData.yoyGrowth >= 0 ? "+" : ""}
                            {selectedProvinceData.yoyGrowth.toFixed(2)}%
                          </p>
                        </div>
                      )}
                  </div>
                  {selectedProvinceData.festivals &&
                    selectedProvinceData.festivals.length > 0 && (
                      <div className="pt-4 border-t border-border">
                        <p className="text-sm font-semibold text-foreground mb-2">
                          Festivals
                          {month
                            ? ` in ${
                                MONTHS.find((m) => m.value === month)?.label ||
                                "this month"
                              }`
                            : ""}
                          :
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {selectedProvinceData.festivals.map((festival) => (
                            <Badge key={festival} variant="outline">
                              {formatFestivalName(festival)}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  <div className="space-y-2 text-sm pt-2 border-t border-border">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        Data Period:
                      </span>
                      <span className="font-medium text-foreground">
                        {year}
                        {month
                          ? ` - ${MONTHS.find((m) => m.value === month)?.label}`
                          : ""}
                      </span>
                    </div>
                  </div>
                  {mode === "growth" &&
                    month !== undefined &&
                    selectedProvince && (
                      <div className="pt-4">
                        <Button
                          onClick={() => setProvinceDetailModalOpen(true)}
                          variant="outline"
                          className="w-full"
                        >
                          Show more details
                        </Button>
                      </div>
                    )}
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p>Click a province on the map to see details</p>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Festival Info Section */}
        {month && (
          <Card className="p-6 bg-card border-border shadow-lg">
            <h3 className="text-lg font-semibold mb-4 text-foreground">
              Festivals in{" "}
              {MONTHS.find((m) => m.value === month)?.label || "this month"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {(() => {
                // Get all unique festivals for the selected month
                const festivalSet = new Set<string>();
                rawData.forEach((row) => {
                  if (row.year === year && row.month === month) {
                    row.festivals.forEach((festival) =>
                      festivalSet.add(festival)
                    );
                  }
                });
                const festivals = Array.from(festivalSet).sort();
                return festivals.length > 0 ? (
                  festivals.map((festival) => (
                    <Badge key={festival} variant="outline" className="text-sm">
                      {formatFestivalName(festival)}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No festivals recorded for this month
                  </p>
                );
              })()}
            </div>
          </Card>
        )}

        {/* Monthly Trend Chart - From Heatmap */}
        {selectedProvince && monthlyData.length > 0 && (
          <div className="mt-6">
            <MonthlyTrendChart
              data={monthlyData}
              provinceName={
                getThaiProvinceName(selectedProvince) || selectedProvince
              }
              defaultYear={year}
              showCompareYear={false}
              showCompareProvince={true}
              rawData={rawData}
            />
          </div>
        )}

        {/* Ranking Detail Modal */}
        <Dialog open={rankingModalOpen} onOpenChange={setRankingModalOpen}>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedRankingItem?.provinceThai
                  ? getEnglishProvinceName(selectedRankingItem.provinceThai)
                  : "Province Details"}
              </DialogTitle>
            </DialogHeader>
            {selectedRankingItem && year && month && (
              <div className="space-y-4">
                {/* Current Period Data */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">
                    {MONTHS.find((m) => m.value === month)?.label} {year}{" "}
                    (Current)
                  </h4>
                  {(() => {
                    const currentData = rawData.filter(
                      (r) =>
                        (r.province === selectedRankingItem.province ||
                          getThaiProvinceName(r.province) ===
                            selectedRankingItem.provinceThai) &&
                        r.year === year &&
                        r.month === month
                    );

                    const thaiData = currentData.filter(
                      (r) => r.tourismType === "Thai"
                    );
                    const foreignData = currentData.filter(
                      (r) => r.tourismType === "Foreign"
                    );

                    const thaiIncome = thaiData.reduce(
                      (sum, r) => sum + r.income,
                      0
                    );
                    const thaiTourists = thaiData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );
                    const foreignIncome = foreignData.reduce(
                      (sum, r) => sum + r.income,
                      0
                    );
                    const foreignTourists = foreignData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );

                    return (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                          <p className="text-xs text-muted-foreground mb-1">
                            Thai Tourists
                          </p>
                          <p className="text-lg font-bold text-primary">
                            {metric === "income"
                              ? `${(thaiIncome * 1_000_000).toLocaleString(
                                  "en-US",
                                  {
                                    maximumFractionDigits: 0,
                                  }
                                )} Baht`
                              : `${thaiTourists.toLocaleString("en-US", {
                                  maximumFractionDigits: 0,
                                })} people`}
                          </p>
                          {metric === "income" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {thaiTourists.toLocaleString("en-US", {
                                maximumFractionDigits: 0,
                              })}{" "}
                              people
                            </p>
                          )}
                          {metric === "tourismAmount" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {(thaiIncome * 1_000_000).toLocaleString(
                                "en-US",
                                {
                                  maximumFractionDigits: 0,
                                }
                              )}{" "}
                              Baht
                            </p>
                          )}
                        </div>
                        <div className="p-3 bg-secondary/5 rounded-lg border border-secondary/10">
                          <p className="text-xs text-muted-foreground mb-1">
                            Foreign Tourists
                          </p>
                          <p className="text-lg font-bold text-secondary">
                            {metric === "income"
                              ? `${(foreignIncome * 1_000_000).toLocaleString(
                                  "en-US",
                                  {
                                    maximumFractionDigits: 0,
                                  }
                                )} Baht`
                              : `${foreignTourists.toLocaleString("en-US", {
                                  maximumFractionDigits: 0,
                                })} people`}
                          </p>
                          {metric === "income" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {foreignTourists.toLocaleString("en-US", {
                                maximumFractionDigits: 0,
                              })}{" "}
                              people
                            </p>
                          )}
                          {metric === "tourismAmount" && (
                            <p className="text-xs text-muted-foreground mt-1">
                              {(foreignIncome * 1_000_000).toLocaleString(
                                "en-US",
                                {
                                  maximumFractionDigits: 0,
                                }
                              )}{" "}
                              Baht
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Comparison Period Data */}
                {mode === "growth" &&
                  (() => {
                    const prevMonth =
                      growthType === "mom"
                        ? month === 1
                          ? 12
                          : month - 1
                        : month;
                    const prevYear =
                      growthType === "mom"
                        ? month === 1
                          ? year - 1
                          : year
                        : year - 1;

                    const comparisonData = rawData.filter(
                      (r) =>
                        (r.province === selectedRankingItem.province ||
                          getThaiProvinceName(r.province) ===
                            selectedRankingItem.provinceThai) &&
                        r.year === prevYear &&
                        r.month === prevMonth
                    );

                    if (comparisonData.length === 0) return null;

                    const thaiData = comparisonData.filter(
                      (r) => r.tourismType === "Thai"
                    );
                    const foreignData = comparisonData.filter(
                      (r) => r.tourismType === "Foreign"
                    );

                    const thaiIncome = thaiData.reduce(
                      (sum, r) => sum + r.income,
                      0
                    );
                    const thaiTourists = thaiData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );
                    const foreignIncome = foreignData.reduce(
                      (sum, r) => sum + r.income,
                      0
                    );
                    const foreignTourists = foreignData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );

                    return (
                      <div className="space-y-3 pt-4 border-t border-border">
                        <h4 className="font-semibold text-foreground">
                          {growthType === "yoy"
                            ? `${
                                MONTHS.find((m) => m.value === month)?.label
                              } ${year - 1} (Previous Year)`
                            : `${
                                MONTHS.find((m) => m.value === prevMonth)?.label
                              } ${prevYear} (Previous Month)`}
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-muted/50 rounded-lg border border-border">
                            <p className="text-xs text-muted-foreground mb-1">
                              Thai Tourists
                            </p>
                            <p className="text-lg font-bold text-foreground">
                              {metric === "income"
                                ? `${(thaiIncome * 1_000_000).toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )} Baht`
                                : `${thaiTourists.toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })} people`}
                            </p>
                            {metric === "income" && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {thaiTourists.toLocaleString("en-US", {
                                  maximumFractionDigits: 0,
                                })}{" "}
                                people
                              </p>
                            )}
                            {metric === "tourismAmount" && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {(thaiIncome * 1_000_000).toLocaleString(
                                  "en-US",
                                  {
                                    maximumFractionDigits: 0,
                                  }
                                )}{" "}
                                Baht
                              </p>
                            )}
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg border border-border">
                            <p className="text-xs text-muted-foreground mb-1">
                              Foreign Tourists
                            </p>
                            <p className="text-lg font-bold text-foreground">
                              {metric === "income"
                                ? `${(foreignIncome * 1_000_000).toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )} Baht`
                                : `${foreignTourists.toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })} people`}
                            </p>
                            {metric === "income" && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {foreignTourists.toLocaleString("en-US", {
                                  maximumFractionDigits: 0,
                                })}{" "}
                                people
                              </p>
                            )}
                            {metric === "tourismAmount" && (
                              <p className="text-xs text-muted-foreground mt-1">
                                {(foreignIncome * 1_000_000).toLocaleString(
                                  "en-US",
                                  {
                                    maximumFractionDigits: 0,
                                  }
                                )}{" "}
                                Baht
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {/* Growth Rate by Tourism Type Table */}
                {mode === "growth" &&
                  (() => {
                    const prevMonth =
                      growthType === "mom"
                        ? month === 1
                          ? 12
                          : month - 1
                        : month;
                    const prevYear =
                      growthType === "mom"
                        ? month === 1
                          ? year - 1
                          : year
                        : year - 1;

                    const currentData = rawData.filter(
                      (r) =>
                        (r.province === selectedRankingItem.province ||
                          getThaiProvinceName(r.province) ===
                            selectedRankingItem.provinceThai) &&
                        r.year === year &&
                        r.month === month
                    );

                    const comparisonData = rawData.filter(
                      (r) =>
                        (r.province === selectedRankingItem.province ||
                          getThaiProvinceName(r.province) ===
                            selectedRankingItem.provinceThai) &&
                        r.year === prevYear &&
                        r.month === prevMonth
                    );

                    if (currentData.length === 0 || comparisonData.length === 0)
                      return null;

                    // Calculate totals for current period
                    const currentTotalIncome =
                      currentData.reduce((sum, r) => sum + r.income, 0) *
                      1_000_000;
                    const currentTotalTourists = currentData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );

                    // Calculate totals for previous period
                    const previousTotalIncome =
                      comparisonData.reduce((sum, r) => sum + r.income, 0) *
                      1_000_000;
                    const previousTotalTourists = comparisonData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );

                    // Calculate growth rates
                    const incomeGrowthRate =
                      previousTotalIncome > 0
                        ? ((currentTotalIncome - previousTotalIncome) /
                            previousTotalIncome) *
                          100
                        : 0;
                    const touristsGrowthRate =
                      previousTotalTourists > 0
                        ? ((currentTotalTourists - previousTotalTourists) /
                            previousTotalTourists) *
                          100
                        : 0;

                    const currentMonthLabel =
                      MONTHS.find((m) => m.value === month)?.label || "";
                    const prevMonthLabel =
                      MONTHS.find((m) => m.value === prevMonth)?.label || "";

                    // Calculate breakdown by tourism type
                    const currentThaiData = currentData.filter(
                      (r) => r.tourismType === "Thai"
                    );
                    const currentForeignData = currentData.filter(
                      (r) => r.tourismType === "Foreign"
                    );
                    const previousThaiData = comparisonData.filter(
                      (r) => r.tourismType === "Thai"
                    );
                    const previousForeignData = comparisonData.filter(
                      (r) => r.tourismType === "Foreign"
                    );

                    const currentThaiIncome =
                      currentThaiData.reduce((sum, r) => sum + r.income, 0) *
                      1_000_000;
                    const currentThaiTourists = currentThaiData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );
                    const currentForeignIncome =
                      currentForeignData.reduce((sum, r) => sum + r.income, 0) *
                      1_000_000;
                    const currentForeignTourists = currentForeignData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );

                    const previousThaiIncome =
                      previousThaiData.reduce((sum, r) => sum + r.income, 0) *
                      1_000_000;
                    const previousThaiTourists = previousThaiData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );
                    const previousForeignIncome =
                      previousForeignData.reduce(
                        (sum, r) => sum + r.income,
                        0
                      ) * 1_000_000;
                    const previousForeignTourists = previousForeignData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );

                    // Calculate growth rates for each type
                    const thaiIncomeGrowth =
                      previousThaiIncome > 0
                        ? ((currentThaiIncome - previousThaiIncome) /
                            previousThaiIncome) *
                          100
                        : 0;
                    const thaiTouristsGrowth =
                      previousThaiTourists > 0
                        ? ((currentThaiTourists - previousThaiTourists) /
                            previousThaiTourists) *
                          100
                        : 0;
                    const foreignIncomeGrowth =
                      previousForeignIncome > 0
                        ? ((currentForeignIncome - previousForeignIncome) /
                            previousForeignIncome) *
                          100
                        : 0;
                    const foreignTouristsGrowth =
                      previousForeignTourists > 0
                        ? ((currentForeignTourists - previousForeignTourists) /
                            previousForeignTourists) *
                          100
                        : 0;

                    return (
                      <div className="pt-4 border-t border-border">
                        <h4 className="font-semibold text-foreground mb-4">
                          Growth Rate by Tourism Type
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-border bg-card">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b-2 border-border bg-muted/50">
                                <th className="text-left px-6 py-4 font-semibold text-foreground min-w-[200px]">
                                  Metric
                                </th>
                                <th className="text-right px-6 py-4 font-semibold text-foreground min-w-[180px] whitespace-nowrap">
                                  {prevMonthLabel} {prevYear}
                                </th>
                                <th className="text-right px-6 py-4 font-semibold text-foreground min-w-[180px] whitespace-nowrap">
                                  {currentMonthLabel} {year}
                                </th>
                                <th className="text-right px-6 py-4 font-semibold text-foreground min-w-[180px]">
                                  Difference
                                </th>
                                <th className="text-right px-6 py-4 font-semibold text-foreground min-w-[140px]">
                                  Growth Rate (%)
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                                <td className="px-6 py-4 font-semibold text-foreground">
                                  Total Revenue
                                </td>
                                <td className="px-6 py-4 text-right text-foreground font-mono text-sm">
                                  {previousTotalIncome.toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right text-foreground font-mono text-sm">
                                  {currentTotalIncome.toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-4 text-right font-mono text-sm font-semibold ${
                                    currentTotalIncome - previousTotalIncome >=
                                    0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {currentTotalIncome - previousTotalIncome >= 0
                                    ? "+"
                                    : ""}
                                  {(
                                    currentTotalIncome - previousTotalIncome
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-4 text-right font-bold text-base ${
                                    incomeGrowthRate >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {incomeGrowthRate >= 0 ? "+" : ""}
                                  {incomeGrowthRate.toFixed(2)}%
                                </td>
                              </tr>
                              <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                                <td className="px-6 py-3 font-medium text-foreground pl-10 text-sm">
                                  • Thai Tourists Revenue
                                </td>
                                <td className="px-6 py-3 text-right text-foreground font-mono text-sm">
                                  {previousThaiIncome.toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-right text-foreground font-mono text-sm">
                                  {currentThaiIncome.toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-3 text-right font-mono text-sm font-semibold ${
                                    currentThaiIncome - previousThaiIncome >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {currentThaiIncome - previousThaiIncome >= 0
                                    ? "+"
                                    : ""}
                                  {(
                                    currentThaiIncome - previousThaiIncome
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-3 text-right font-semibold ${
                                    thaiIncomeGrowth >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {thaiIncomeGrowth >= 0 ? "+" : ""}
                                  {thaiIncomeGrowth.toFixed(2)}%
                                </td>
                              </tr>
                              <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                                <td className="px-6 py-3 font-medium text-foreground pl-10 text-sm">
                                  • Foreign Tourists Revenue
                                </td>
                                <td className="px-6 py-3 text-right text-foreground font-mono text-sm">
                                  {previousForeignIncome.toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-right text-foreground font-mono text-sm">
                                  {currentForeignIncome.toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-3 text-right font-mono text-sm font-semibold ${
                                    currentForeignIncome -
                                      previousForeignIncome >=
                                    0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {currentForeignIncome -
                                    previousForeignIncome >=
                                  0
                                    ? "+"
                                    : ""}
                                  {(
                                    currentForeignIncome - previousForeignIncome
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-3 text-right font-semibold ${
                                    foreignIncomeGrowth >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {foreignIncomeGrowth >= 0 ? "+" : ""}
                                  {foreignIncomeGrowth.toFixed(2)}%
                                </td>
                              </tr>
                              <tr className="border-b-2 border-border">
                                <td className="px-6 py-4 font-semibold text-foreground">
                                  Total Tourists
                                </td>
                                <td className="px-6 py-4 text-right text-foreground font-mono text-sm">
                                  {previousTotalTourists.toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right text-foreground font-mono text-sm">
                                  {currentTotalTourists.toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-4 text-right font-mono text-sm font-semibold ${
                                    currentTotalTourists -
                                      previousTotalTourists >=
                                    0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {currentTotalTourists -
                                    previousTotalTourists >=
                                  0
                                    ? "+"
                                    : ""}
                                  {(
                                    currentTotalTourists - previousTotalTourists
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-4 text-right font-bold text-base ${
                                    touristsGrowthRate >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {touristsGrowthRate >= 0 ? "+" : ""}
                                  {touristsGrowthRate.toFixed(2)}%
                                </td>
                              </tr>
                              <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                                <td className="px-6 py-3 font-medium text-foreground pl-10 text-sm">
                                  • Thai Tourists
                                </td>
                                <td className="px-6 py-3 text-right text-foreground font-mono text-sm">
                                  {previousThaiTourists.toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-right text-foreground font-mono text-sm">
                                  {currentThaiTourists.toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-3 text-right font-mono text-sm font-semibold ${
                                    currentThaiTourists -
                                      previousThaiTourists >=
                                    0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {currentThaiTourists - previousThaiTourists >=
                                  0
                                    ? "+"
                                    : ""}
                                  {(
                                    currentThaiTourists - previousThaiTourists
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-3 text-right font-semibold ${
                                    thaiTouristsGrowth >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {thaiTouristsGrowth >= 0 ? "+" : ""}
                                  {thaiTouristsGrowth.toFixed(2)}%
                                </td>
                              </tr>
                              <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                                <td className="px-6 py-3 font-medium text-foreground pl-10 text-sm">
                                  • Foreign Tourists
                                </td>
                                <td className="px-6 py-3 text-right text-foreground font-mono text-sm">
                                  {previousForeignTourists.toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-right text-foreground font-mono text-sm">
                                  {currentForeignTourists.toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-3 text-right font-mono text-sm font-semibold ${
                                    currentForeignTourists -
                                      previousForeignTourists >=
                                    0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {currentForeignTourists -
                                    previousForeignTourists >=
                                  0
                                    ? "+"
                                    : ""}
                                  {(
                                    currentForeignTourists -
                                    previousForeignTourists
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-3 text-right font-semibold ${
                                    foreignTouristsGrowth >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {foreignTouristsGrowth >= 0 ? "+" : ""}
                                  {foreignTouristsGrowth.toFixed(2)}%
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}

                {/* Growth Summary */}
                {mode === "growth" &&
                  selectedRankingItem.yoyGrowth !== undefined && (
                    <div className="pt-4 border-t border-border">
                      <div className="p-3 bg-accent/5 rounded-lg border border-accent/10">
                        <p className="text-xs text-muted-foreground mb-1">
                          {growthType === "yoy"
                            ? "Year-over-Year"
                            : "Month-over-Month"}{" "}
                          Growth
                        </p>
                        <p
                          className={`text-2xl font-bold ${
                            selectedRankingItem.yoyGrowth >= 0
                              ? "text-green-600 dark:text-green-400"
                              : "text-red-600 dark:text-red-400"
                          }`}
                        >
                          {selectedRankingItem.yoyGrowth >= 0 ? "+" : ""}
                          {selectedRankingItem.yoyGrowth.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  )}
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Province Detail Modal */}
        <Dialog
          open={provinceDetailModalOpen}
          onOpenChange={setProvinceDetailModalOpen}
        >
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {selectedProvinceData?.provinceThai ||
                getThaiProvinceName(selectedProvince) ||
                selectedProvince
                  ? getEnglishProvinceName(
                      selectedProvinceData?.provinceThai ||
                        getThaiProvinceName(selectedProvince) ||
                        selectedProvince
                    )
                  : "Province Details"}
              </DialogTitle>
            </DialogHeader>
            {selectedProvince && year && month && (
              <div className="space-y-4">
                {/* Current Period Data */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-foreground">
                    {MONTHS.find((m) => m.value === month)?.label} {year}{" "}
                    (Current)
                  </h4>
                  {(() => {
                    const currentData = rawData.filter(
                      (r) =>
                        (r.province === selectedProvince ||
                          getThaiProvinceName(r.province) ===
                            getThaiProvinceName(selectedProvince)) &&
                        r.year === year &&
                        r.month === month
                    );

                    const thaiData = currentData.filter(
                      (r) => r.tourismType === "Thai"
                    );
                    const foreignData = currentData.filter(
                      (r) => r.tourismType === "Foreign"
                    );

                    const thaiIncome = thaiData.reduce(
                      (sum, r) => sum + r.income,
                      0
                    );
                    const thaiTourists = thaiData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );
                    const foreignIncome = foreignData.reduce(
                      (sum, r) => sum + r.income,
                      0
                    );
                    const foreignTourists = foreignData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );

                    return (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="p-3 bg-primary/5 rounded-lg border border-primary/10">
                          <p className="text-xs text-muted-foreground mb-1">
                            Thai Tourists
                          </p>
                          <p className="text-lg font-bold text-primary">
                            {(thaiIncome * 1_000_000).toLocaleString("en-US", {
                              maximumFractionDigits: 0,
                            })}{" "}
                            Baht
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {thaiTourists.toLocaleString("en-US", {
                              maximumFractionDigits: 0,
                            })}{" "}
                            people
                          </p>
                        </div>
                        <div className="p-3 bg-secondary/5 rounded-lg border border-secondary/10">
                          <p className="text-xs text-muted-foreground mb-1">
                            Foreign Tourists
                          </p>
                          <p className="text-lg font-bold text-secondary">
                            {(foreignIncome * 1_000_000).toLocaleString(
                              "en-US",
                              {
                                maximumFractionDigits: 0,
                              }
                            )}{" "}
                            Baht
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {foreignTourists.toLocaleString("en-US", {
                              maximumFractionDigits: 0,
                            })}{" "}
                            people
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* Comparison Period Data */}
                {mode === "growth" &&
                  (() => {
                    const prevMonth =
                      growthType === "mom"
                        ? month === 1
                          ? 12
                          : month - 1
                        : month;
                    const prevYear =
                      growthType === "mom"
                        ? month === 1
                          ? year - 1
                          : year
                        : year - 1;

                    const comparisonData = rawData.filter(
                      (r) =>
                        (r.province === selectedProvince ||
                          getThaiProvinceName(r.province) ===
                            getThaiProvinceName(selectedProvince)) &&
                        r.year === prevYear &&
                        r.month === prevMonth
                    );

                    if (comparisonData.length === 0) return null;

                    const thaiData = comparisonData.filter(
                      (r) => r.tourismType === "Thai"
                    );
                    const foreignData = comparisonData.filter(
                      (r) => r.tourismType === "Foreign"
                    );

                    const thaiIncome = thaiData.reduce(
                      (sum, r) => sum + r.income,
                      0
                    );
                    const thaiTourists = thaiData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );
                    const foreignIncome = foreignData.reduce(
                      (sum, r) => sum + r.income,
                      0
                    );
                    const foreignTourists = foreignData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );

                    return (
                      <div className="space-y-3 pt-4 border-t border-border">
                        <h4 className="font-semibold text-foreground">
                          {growthType === "yoy"
                            ? `${
                                MONTHS.find((m) => m.value === month)?.label
                              } ${year - 1} (Previous Year)`
                            : `${
                                MONTHS.find((m) => m.value === prevMonth)?.label
                              } ${prevYear} (Previous Month)`}
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-muted/50 rounded-lg border border-border">
                            <p className="text-xs text-muted-foreground mb-1">
                              Thai Tourists
                            </p>
                            <p className="text-lg font-bold text-foreground">
                              {(thaiIncome * 1_000_000).toLocaleString(
                                "en-US",
                                {
                                  maximumFractionDigits: 0,
                                }
                              )}{" "}
                              Baht
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {thaiTourists.toLocaleString("en-US", {
                                maximumFractionDigits: 0,
                              })}{" "}
                              people
                            </p>
                          </div>
                          <div className="p-3 bg-muted/50 rounded-lg border border-border">
                            <p className="text-xs text-muted-foreground mb-1">
                              Foreign Tourists
                            </p>
                            <p className="text-lg font-bold text-foreground">
                              {(foreignIncome * 1_000_000).toLocaleString(
                                "en-US",
                                {
                                  maximumFractionDigits: 0,
                                }
                              )}{" "}
                              Baht
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {foreignTourists.toLocaleString("en-US", {
                                maximumFractionDigits: 0,
                              })}{" "}
                              people
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                {/* Growth Rate by Tourism Type Table */}
                {mode === "growth" &&
                  (() => {
                    const prevMonth =
                      growthType === "mom"
                        ? month === 1
                          ? 12
                          : month - 1
                        : month;
                    const prevYear =
                      growthType === "mom"
                        ? month === 1
                          ? year - 1
                          : year
                        : year - 1;

                    const currentData = rawData.filter(
                      (r) =>
                        (r.province === selectedProvince ||
                          getThaiProvinceName(r.province) ===
                            getThaiProvinceName(selectedProvince)) &&
                        r.year === year &&
                        r.month === month
                    );

                    const comparisonData = rawData.filter(
                      (r) =>
                        (r.province === selectedProvince ||
                          getThaiProvinceName(r.province) ===
                            getThaiProvinceName(selectedProvince)) &&
                        r.year === prevYear &&
                        r.month === prevMonth
                    );

                    if (currentData.length === 0 || comparisonData.length === 0)
                      return null;

                    // Calculate totals for current period
                    const currentTotalIncome =
                      currentData.reduce((sum, r) => sum + r.income, 0) *
                      1_000_000;
                    const currentTotalTourists = currentData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );

                    // Calculate totals for previous period
                    const previousTotalIncome =
                      comparisonData.reduce((sum, r) => sum + r.income, 0) *
                      1_000_000;
                    const previousTotalTourists = comparisonData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );

                    // Calculate growth rates
                    const incomeGrowthRate =
                      previousTotalIncome > 0
                        ? ((currentTotalIncome - previousTotalIncome) /
                            previousTotalIncome) *
                          100
                        : 0;
                    const touristsGrowthRate =
                      previousTotalTourists > 0
                        ? ((currentTotalTourists - previousTotalTourists) /
                            previousTotalTourists) *
                          100
                        : 0;

                    const currentMonthLabel =
                      MONTHS.find((m) => m.value === month)?.label || "";
                    const prevMonthLabel =
                      MONTHS.find((m) => m.value === prevMonth)?.label || "";

                    // Calculate breakdown by tourism type
                    const currentThaiData = currentData.filter(
                      (r) => r.tourismType === "Thai"
                    );
                    const currentForeignData = currentData.filter(
                      (r) => r.tourismType === "Foreign"
                    );
                    const previousThaiData = comparisonData.filter(
                      (r) => r.tourismType === "Thai"
                    );
                    const previousForeignData = comparisonData.filter(
                      (r) => r.tourismType === "Foreign"
                    );

                    const currentThaiIncome =
                      currentThaiData.reduce((sum, r) => sum + r.income, 0) *
                      1_000_000;
                    const currentThaiTourists = currentThaiData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );
                    const currentForeignIncome =
                      currentForeignData.reduce((sum, r) => sum + r.income, 0) *
                      1_000_000;
                    const currentForeignTourists = currentForeignData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );

                    const previousThaiIncome =
                      previousThaiData.reduce((sum, r) => sum + r.income, 0) *
                      1_000_000;
                    const previousThaiTourists = previousThaiData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );
                    const previousForeignIncome =
                      previousForeignData.reduce(
                        (sum, r) => sum + r.income,
                        0
                      ) * 1_000_000;
                    const previousForeignTourists = previousForeignData.reduce(
                      (sum, r) => sum + r.tourismAmount,
                      0
                    );

                    // Calculate growth rates for each type
                    const thaiIncomeGrowth =
                      previousThaiIncome > 0
                        ? ((currentThaiIncome - previousThaiIncome) /
                            previousThaiIncome) *
                          100
                        : 0;
                    const thaiTouristsGrowth =
                      previousThaiTourists > 0
                        ? ((currentThaiTourists - previousThaiTourists) /
                            previousThaiTourists) *
                          100
                        : 0;
                    const foreignIncomeGrowth =
                      previousForeignIncome > 0
                        ? ((currentForeignIncome - previousForeignIncome) /
                            previousForeignIncome) *
                          100
                        : 0;
                    const foreignTouristsGrowth =
                      previousForeignTourists > 0
                        ? ((currentForeignTourists - previousForeignTourists) /
                            previousForeignTourists) *
                          100
                        : 0;

                    return (
                      <div className="pt-4 border-t border-border">
                        <h4 className="font-semibold text-foreground mb-4">
                          Growth Rate by Tourism Type
                        </h4>
                        <div className="overflow-x-auto rounded-lg border border-border bg-card">
                          <table className="w-full border-collapse">
                            <thead>
                              <tr className="border-b-2 border-border bg-muted/50">
                                <th className="text-left px-6 py-4 font-semibold text-foreground min-w-[200px]">
                                  Metric
                                </th>
                                <th className="text-right px-6 py-4 font-semibold text-foreground min-w-[180px] whitespace-nowrap">
                                  {prevMonthLabel} {prevYear}
                                </th>
                                <th className="text-right px-6 py-4 font-semibold text-foreground min-w-[180px] whitespace-nowrap">
                                  {currentMonthLabel} {year}
                                </th>
                                <th className="text-right px-6 py-4 font-semibold text-foreground min-w-[180px]">
                                  Difference
                                </th>
                                <th className="text-right px-6 py-4 font-semibold text-foreground min-w-[140px]">
                                  Growth Rate (%)
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                                <td className="px-6 py-4 font-semibold text-foreground">
                                  Total Revenue
                                </td>
                                <td className="px-6 py-4 text-right text-foreground font-mono text-sm">
                                  {previousTotalIncome.toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right text-foreground font-mono text-sm">
                                  {currentTotalIncome.toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-4 text-right font-mono text-sm font-semibold ${
                                    currentTotalIncome - previousTotalIncome >=
                                    0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {currentTotalIncome - previousTotalIncome >= 0
                                    ? "+"
                                    : ""}
                                  {(
                                    currentTotalIncome - previousTotalIncome
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-4 text-right font-bold text-base ${
                                    incomeGrowthRate >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {incomeGrowthRate >= 0 ? "+" : ""}
                                  {incomeGrowthRate.toFixed(2)}%
                                </td>
                              </tr>
                              <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                                <td className="px-6 py-3 font-medium text-foreground pl-10 text-sm">
                                  • Thai Tourists Revenue
                                </td>
                                <td className="px-6 py-3 text-right text-foreground font-mono text-sm">
                                  {previousThaiIncome.toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-right text-foreground font-mono text-sm">
                                  {currentThaiIncome.toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-3 text-right font-mono text-sm font-semibold ${
                                    currentThaiIncome - previousThaiIncome >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {currentThaiIncome - previousThaiIncome >= 0
                                    ? "+"
                                    : ""}
                                  {(
                                    currentThaiIncome - previousThaiIncome
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-3 text-right font-semibold ${
                                    thaiIncomeGrowth >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {thaiIncomeGrowth >= 0 ? "+" : ""}
                                  {thaiIncomeGrowth.toFixed(2)}%
                                </td>
                              </tr>
                              <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                                <td className="px-6 py-3 font-medium text-foreground pl-10 text-sm">
                                  • Foreign Tourists Revenue
                                </td>
                                <td className="px-6 py-3 text-right text-foreground font-mono text-sm">
                                  {previousForeignIncome.toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-right text-foreground font-mono text-sm">
                                  {currentForeignIncome.toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-3 text-right font-mono text-sm font-semibold ${
                                    currentForeignIncome -
                                      previousForeignIncome >=
                                    0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {currentForeignIncome -
                                    previousForeignIncome >=
                                  0
                                    ? "+"
                                    : ""}
                                  {(
                                    currentForeignIncome - previousForeignIncome
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    Baht
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-3 text-right font-semibold ${
                                    foreignIncomeGrowth >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {foreignIncomeGrowth >= 0 ? "+" : ""}
                                  {foreignIncomeGrowth.toFixed(2)}%
                                </td>
                              </tr>
                              <tr className="border-b-2 border-border">
                                <td className="px-6 py-4 font-semibold text-foreground">
                                  Total Tourists
                                </td>
                                <td className="px-6 py-4 text-right text-foreground font-mono text-sm">
                                  {previousTotalTourists.toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td className="px-6 py-4 text-right text-foreground font-mono text-sm">
                                  {currentTotalTourists.toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-4 text-right font-mono text-sm font-semibold ${
                                    currentTotalTourists -
                                      previousTotalTourists >=
                                    0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {currentTotalTourists -
                                    previousTotalTourists >=
                                  0
                                    ? "+"
                                    : ""}
                                  {(
                                    currentTotalTourists - previousTotalTourists
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-4 text-right font-bold text-base ${
                                    touristsGrowthRate >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {touristsGrowthRate >= 0 ? "+" : ""}
                                  {touristsGrowthRate.toFixed(2)}%
                                </td>
                              </tr>
                              <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                                <td className="px-6 py-3 font-medium text-foreground pl-10 text-sm">
                                  • Thai Tourists
                                </td>
                                <td className="px-6 py-3 text-right text-foreground font-mono text-sm">
                                  {previousThaiTourists.toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-right text-foreground font-mono text-sm">
                                  {currentThaiTourists.toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-3 text-right font-mono text-sm font-semibold ${
                                    currentThaiTourists -
                                      previousThaiTourists >=
                                    0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {currentThaiTourists - previousThaiTourists >=
                                  0
                                    ? "+"
                                    : ""}
                                  {(
                                    currentThaiTourists - previousThaiTourists
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-3 text-right font-semibold ${
                                    thaiTouristsGrowth >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {thaiTouristsGrowth >= 0 ? "+" : ""}
                                  {thaiTouristsGrowth.toFixed(2)}%
                                </td>
                              </tr>
                              <tr className="border-b border-border hover:bg-muted/20 transition-colors">
                                <td className="px-6 py-3 font-medium text-foreground pl-10 text-sm">
                                  • Foreign Tourists
                                </td>
                                <td className="px-6 py-3 text-right text-foreground font-mono text-sm">
                                  {previousForeignTourists.toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td className="px-6 py-3 text-right text-foreground font-mono text-sm">
                                  {currentForeignTourists.toLocaleString(
                                    "en-US",
                                    {
                                      maximumFractionDigits: 0,
                                    }
                                  )}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-3 text-right font-mono text-sm font-semibold ${
                                    currentForeignTourists -
                                      previousForeignTourists >=
                                    0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {currentForeignTourists -
                                    previousForeignTourists >=
                                  0
                                    ? "+"
                                    : ""}
                                  {(
                                    currentForeignTourists -
                                    previousForeignTourists
                                  ).toLocaleString("en-US", {
                                    maximumFractionDigits: 0,
                                  })}{" "}
                                  <span className="text-muted-foreground text-xs">
                                    people
                                  </span>
                                </td>
                                <td
                                  className={`px-6 py-3 text-right font-semibold ${
                                    foreignTouristsGrowth >= 0
                                      ? "text-green-600 dark:text-green-400"
                                      : "text-red-600 dark:text-red-400"
                                  }`}
                                >
                                  {foreignTouristsGrowth >= 0 ? "+" : ""}
                                  {foreignTouristsGrowth.toFixed(2)}%
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })()}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
    </>
  );
}
