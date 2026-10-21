"use client";

import { useEffect, useMemo, useState } from "react";
import {
  LineChart,
  ComposedChart,
  Line,
  Bar,
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { MONTHS, THAI_PROVINCES } from "@/lib/provinces";
import type { MonthlyDataPoint, TourismDataRow } from "@/types/tourism";
import {
  getFestivalsForProvinceAndMonth,
  formatFestivalName,
} from "@/lib/festivalDetector";
import {
  COMMON_FESTIVALS,
  getProvinceSpecificFestivals,
} from "@/lib/festivalLogic";
import { getEnglishProvinceName, getThaiProvinceName } from "@/lib/provinceMapping";
import { getMonthlyDataForProvince } from "@/lib/tourismDataLoader";

interface MonthlyTrendChartProps {
  data: MonthlyDataPoint[];
  provinceName?: string;
  tourismType?: "Thai" | "Foreign"; // Tourism type for the chart
  defaultYear?: number; // Default year from parent filter
  showCompareYear?: boolean; // Show compare year selector (default: true)
  showCompareProvince?: boolean; // Show compare province selector (default: true)
  rawData?: TourismDataRow[]; // Raw data for festival detection
  predictionYear?: number; // Year used for prediction - cannot be selected as compare year
}

const monthLabels = MONTHS.map((month) => ({
  value: month.value,
  label: month.label.slice(0, 3),
}));

export function MonthlyTrendChart({
  data,
  provinceName,
  tourismType,
  defaultYear,
  showCompareYear = true,
  showCompareProvince = true,
  rawData = [],
  predictionYear,
}: MonthlyTrendChartProps) {
  const [chartType, setChartType] = useState<"line" | "combo">("line");
  const [metric, setMetric] = useState<"revenue" | "tourists">("revenue");
  const [selectedYear, setSelectedYear] = useState<number | undefined>(
    defaultYear
  );
  const [selectedTourismType, setSelectedTourismType] = useState<
    "Thai" | "Foreign" | "All"
  >(tourismType || "All");

  // Update selectedTourismType when tourismType prop changes
  useEffect(() => {
    if (tourismType) {
      setSelectedTourismType(tourismType);
    }
  }, [tourismType]);

  // Update selectedYear when defaultYear prop changes
  useEffect(() => {
    if (defaultYear !== undefined) {
      setSelectedYear(defaultYear);
    }
  }, [defaultYear]);

  const [compareYear, setCompareYear] = useState<number | undefined>(undefined);
  const [compareProvince, setCompareProvince] = useState<string | undefined>(undefined);
  const [compareProvinceOpen, setCompareProvinceOpen] = useState(false);
  const [compareProvinceSearchQuery, setCompareProvinceSearchQuery] = useState("");

  // Check if both Thai and Foreign data exist
  const hasBothTourismTypes = useMemo(() => {
    const hasThai = data.some((d) => d.tourism_type === "Thai");
    const hasForeign = data.some((d) => d.tourism_type === "Foreign");
    return hasThai && hasForeign;
  }, [data]);

  // Check if year should be disabled (if there's predicted data with a specific year)
  const isYearDisabled = useMemo(() => {
    const predictedData = data.filter((d) => d.isPredicted);
    if (predictedData.length === 0) return false;
    // If all predicted data has the same year, disable year selector
    const predictedYears = new Set(predictedData.map((d) => d.year));
    return predictedYears.size === 1;
  }, [data]);

  const yearOptions = useMemo(() => {
    const years = Array.from(new Set(data.map((d) => d.year))).sort(
      (a, b) => a - b
    );
    return years;
  }, [data]);

  // Filter out prediction year from compare year options
  const compareYearOptions = useMemo(() => {
    if (predictionYear === undefined) return yearOptions;
    return yearOptions.filter((year) => year !== predictionYear);
  }, [yearOptions, predictionYear]);

  // Reset compareYear if it matches predictionYear
  useEffect(() => {
    if (predictionYear !== undefined && compareYear === predictionYear) {
      setCompareYear(undefined);
    }
  }, [predictionYear, compareYear]);

  useEffect(() => {
    if (yearOptions.length > 0 && !selectedYear && defaultYear === undefined) {
      setSelectedYear(yearOptions[yearOptions.length - 1]);
    }
  }, [yearOptions, selectedYear, defaultYear]);

  const chartData = useMemo(() => {
    // Filter by tourism type if not "All"
    let filteredByType = data;
    if (selectedTourismType !== "All") {
      filteredByType = data.filter(
        (d) => {
          // Must match the selected tourism type exactly
          // Check if tourism_type matches, or if it's undefined and we're looking for a specific type, exclude it
          if (d.tourism_type === undefined) {
            // If tourism_type is undefined, only include if selectedTourismType is "All"
            return false;
          }
          return d.tourism_type === selectedTourismType;
        }
      );
    }

    // Filter by selected year
    const filtered = selectedYear
      ? filteredByType.filter((d) => d.year === selectedYear)
      : filteredByType;

    // Separate actual and predicted data
    const actualData = filtered.filter((d) => !d.isPredicted);
    // For predicted data, must match the selected type exactly
    const predictedData = filtered.filter((d) => {
      if (!d.isPredicted) return false;
      // Must match the selected tourism type exactly
      if (selectedTourismType !== "All") {
        return d.tourism_type === selectedTourismType;
      }
      return true;
    });

    // Group actual data by month
    const actualMonthMap = new Map<
      number,
      { revenue: number; tourists: number; count: number }
    >();

    actualData.forEach((point) => {
      const existing = actualMonthMap.get(point.month);
      if (existing) {
        existing.revenue += point.revenue;
        existing.tourists += point.tourists;
        existing.count += 1;
      } else {
        actualMonthMap.set(point.month, {
          revenue: point.revenue,
          tourists: point.tourists,
          count: 1,
        });
      }
    });

    // Group predicted data by month
    const predictedMonthMap = new Map<
      number,
      { revenue: number; tourists: number; count: number }
    >();

    predictedData.forEach((point) => {
      const existing = predictedMonthMap.get(point.month);
      if (existing) {
        existing.revenue += point.revenue;
        existing.tourists += point.tourists;
        existing.count += 1;
      } else {
        predictedMonthMap.set(point.month, {
          revenue: point.revenue,
          tourists: point.tourists,
          count: 1,
        });
      }
    });

    // Find the last month with actual data
    const actualMonthKeys = Array.from(actualMonthMap.keys());
    const lastActualMonth = actualMonthKeys.length > 0 ? Math.max(...actualMonthKeys) : -1;

    return monthLabels.map(({ value, label }) => {
      const actualMonthData = actualMonthMap.get(value);
      const predictedMonthData = predictedMonthMap.get(value);

      const actualRevenue = actualMonthData
        ? actualMonthData.revenue / actualMonthData.count
        : null;
      const predictedRevenue = predictedMonthData
        ? predictedMonthData.revenue / predictedMonthData.count
        : null;
      const actualTourists = actualMonthData
        ? actualMonthData.tourists / actualMonthData.count
        : null;
      const predictedTourists = predictedMonthData
        ? predictedMonthData.tourists / predictedMonthData.count
        : null;

      // For connecting predicted line to actual line:
      // Make predicted line parallel to actual by starting from the last actual value
      // This ensures smooth connection and parallel continuation
      const isFirstPredictedMonth = value === lastActualMonth + 1;
      
      // Get last actual month data for connection
      const lastActualData = lastActualMonth >= 0 && actualMonthMap.has(lastActualMonth) ? actualMonthMap.get(lastActualMonth)! : null;
      const lastActualRevenue = lastActualData ? (lastActualData.revenue / lastActualData.count) : null;
      const lastActualTourists = lastActualData ? (lastActualData.tourists / lastActualData.count) : null;

      // For predicted line: start from last actual value to make it parallel/continuous
      let predictedRevenueWithConnection: number | null = null;
      let predictedTouristsWithConnection: number | null = null;
      
      // If we have predicted data for this month, use it directly
      // Don't try to connect to last actual value - just show predicted value
      if (predictedRevenue !== null) {
        predictedRevenueWithConnection = predictedRevenue;
      }
      
      if (predictedTourists !== null) {
        predictedTouristsWithConnection = predictedTourists;
      }

      // Determine if this month should show predicted (dashed) line
      const isPredictedMonth =
        value > lastActualMonth && actualRevenue === null && predictedRevenue !== null;

      // Get festivals for this month
      let festivals: string[] = [];
      if (rawData.length > 0 && provinceName && selectedYear) {
        festivals = getFestivalsForProvinceAndMonth(
          rawData,
          provinceName,
          value,
          selectedYear
        );
      }

      return {
        month: label,
        monthValue: value,
        actualRevenue,
        actualTourists,
        predictedRevenue: predictedRevenueWithConnection,
        predictedTourists: predictedTouristsWithConnection,
        combinedRevenue: null, // Don't use combined for line chart
        combinedTourists: null, // Don't use combined for line chart
        isPredictedMonth, // Flag to determine if this should be dashed
        // For combo chart - separate actual and predicted
        // Actual should stop at last actual month (null for months without actual data)
        // Predicted should only show for predicted months
        actualRevenueForCombo: actualRevenue ?? null,
        predictedRevenueForCombo: predictedRevenue && value > lastActualMonth ? predictedRevenue : null,
        actualTouristsForCombo: actualTourists ?? null,
        predictedTouristsForCombo: predictedTourists && value > lastActualMonth ? predictedTourists : null,
        // Combined for backward compatibility
        revenue: actualRevenue ?? predictedRevenue ?? 0,
        tourists: actualTourists ?? predictedTourists ?? 0,
        festivals, // Add festivals data
      };
    });
  }, [data, selectedYear, selectedTourismType, rawData, provinceName]);

  // Calculate compare year data if compareYear is selected
  const compareYearData = useMemo(() => {
    if (!compareYear || chartType !== "line" || !showCompareYear) return null;

    // Filter by tourism type if not "All"
    let filteredByType = data;
    if (selectedTourismType !== "All") {
      filteredByType = data.filter(
        (d) => d.tourism_type === selectedTourismType
      );
    }

    // Filter by compare year
    const compareData = filteredByType.filter((d) => d.year === compareYear);

    // Group by month
    const monthMap = new Map<
      number,
      { revenue: number; tourists: number; count: number }
    >();

    compareData.forEach((point) => {
      const existing = monthMap.get(point.month);
      if (existing) {
        existing.revenue += point.revenue;
        existing.tourists += point.tourists;
        existing.count += 1;
      } else {
        monthMap.set(point.month, {
          revenue: point.revenue,
          tourists: point.tourists,
          count: 1,
        });
      }
    });

    return monthLabels.map(({ value, label }) => {
      const monthData = monthMap.get(value);
      return {
        month: label,
        compareRevenue: monthData
          ? monthData.revenue / monthData.count
          : null,
        compareTourists: monthData
          ? monthData.tourists / monthData.count
          : null,
      };
    });
  }, [data, compareYear, selectedTourismType, chartType, showCompareYear]);

  // Calculate compare province data if compareProvince is selected
  const compareProvinceData = useMemo(() => {
    if (!compareProvince || !rawData.length || !selectedYear || !showCompareProvince) return null;

    const thaiName = getThaiProvinceName(compareProvince) || compareProvince;
    
    // Load data for both Thai and Foreign if "All" is selected, otherwise load for selected type
    let compareData: MonthlyDataPoint[] = [];
    if (selectedTourismType === "All") {
      const thaiData = getMonthlyDataForProvince(rawData, thaiName, {
        year: selectedYear,
        tourismType: "Thai",
      });
      const foreignData = getMonthlyDataForProvince(rawData, thaiName, {
        year: selectedYear,
        tourismType: "Foreign",
      });
      compareData = [
        ...thaiData.map((d) => ({ ...d, tourism_type: "Thai" as const })),
        ...foreignData.map((d) => ({ ...d, tourism_type: "Foreign" as const })),
      ];
    } else {
      compareData = getMonthlyDataForProvince(rawData, thaiName, {
        year: selectedYear,
        tourismType: selectedTourismType,
      }).map((d) => ({ ...d, tourism_type: selectedTourismType }));
    }

    // Group by month
    const monthMap = new Map<
      number,
      { revenue: number; tourists: number; count: number }
    >();

    compareData.forEach((point) => {
      const existing = monthMap.get(point.month);
      if (existing) {
        existing.revenue += point.revenue;
        existing.tourists += point.tourists;
        existing.count += 1;
      } else {
        monthMap.set(point.month, {
          revenue: point.revenue,
          tourists: point.tourists,
          count: 1,
        });
      }
    });

    return monthLabels.map(({ value, label }) => {
      const monthData = monthMap.get(value);
      return {
        month: label,
        compareProvinceRevenue: monthData
          ? monthData.revenue / monthData.count
          : null,
        compareProvinceTourists: monthData
          ? monthData.tourists / monthData.count
          : null,
      };
    });
  }, [compareProvince, rawData, selectedYear, selectedTourismType, showCompareProvince]);

  // Merge compare year and province data into chartData
  const chartDataWithCompare = useMemo(() => {
    type CompareFields = {
      compareRevenue?: number | null;
      compareTourists?: number | null;
      compareProvinceRevenue?: number | null;
      compareProvinceTourists?: number | null;
    };
    let result: Array<(typeof chartData)[number] & CompareFields> = chartData;
    
    // Merge compare year data
    if (compareYearData) {
      result = result.map((item, index) => ({
        ...item,
        compareRevenue: compareYearData[index]?.compareRevenue ?? null,
        compareTourists: compareYearData[index]?.compareTourists ?? null,
      }));
    }
    
    // Merge compare province data
    if (compareProvinceData) {
      result = result.map((item, index) => ({
        ...item,
        compareProvinceRevenue: compareProvinceData[index]?.compareProvinceRevenue ?? null,
        compareProvinceTourists: compareProvinceData[index]?.compareProvinceTourists ?? null,
      }));
    }
    
    return result;
  }, [chartData, compareYearData, compareProvinceData]);

  const metricLabel =
    metric === "revenue"
      ? "Revenue (million Baht)"
      : "Visitors (million people)";

  if (data.length === 0) {
    return (
      <Card className="bg-card border-border shadow-md">
        <CardHeader>
          <CardTitle className="text-base font-semibold">
            Monthly Trend (
            {provinceName
              ? getEnglishProvinceName(provinceName)
              : "Selected Province"}
            )
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            No monthly data available for this province.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border shadow-md">
      <CardHeader className="space-y-3">
        <CardTitle className="text-base font-semibold">
          Monthly Trend (
          {provinceName
            ? getEnglishProvinceName(provinceName)
            : "Selected Province"}
          )
        </CardTitle>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Chart Type</Label>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant={chartType === "line" ? "default" : "outline"}
                  onClick={() => setChartType("line")}
                >
                  Line
                </Button>
                <Button
                  size="sm"
                  variant={chartType === "combo" ? "default" : "outline"}
                  onClick={() => setChartType("combo")}
                >
                  Combo
                </Button>
              </div>
            </div>
            {chartType === "line" && (
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
            )}
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="flex items-center gap-2">
              <Label className="text-sm">Tourism Type</Label>
              <Select
                value={selectedTourismType}
                onValueChange={(value) =>
                  setSelectedTourismType(value as "Thai" | "Foreign" | "All")
                }
                disabled={!hasBothTourismTypes}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All</SelectItem>
                  <SelectItem value="Thai">Thai</SelectItem>
                  <SelectItem value="Foreign">Foreign</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {chartType === "line" && showCompareYear && (
              <div className="flex items-center gap-2">
                <Label className="text-sm">Compare Year</Label>
                <Select
                  value={compareYear?.toString() ?? "none"}
                  onValueChange={(value) =>
                    setCompareYear(
                      value === "none" ? undefined : parseInt(value, 10)
                    )
                  }
                >
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {compareYearOptions.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            {chartType === "line" && showCompareProvince && rawData.length > 0 && (
              <div className="flex items-center gap-2">
                <Label className="text-sm">Compare Province</Label>
                <Popover open={compareProvinceOpen} onOpenChange={setCompareProvinceOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={compareProvinceOpen}
                      className="w-40 justify-between"
                    >
                      {compareProvince
                        ? getEnglishProvinceName(compareProvince) || compareProvince
                        : "Select province..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-40 p-0" align="start">
                    <Command>
                      <CommandInput
                        placeholder="Search province..."
                        value={compareProvinceSearchQuery}
                        onValueChange={setCompareProvinceSearchQuery}
                      />
                      <CommandList>
                        <CommandEmpty>No province found.</CommandEmpty>
                        <CommandGroup>
                          <CommandItem
                            value="none"
                            onSelect={() => {
                              setCompareProvince(undefined);
                              setCompareProvinceOpen(false);
                              setCompareProvinceSearchQuery("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                !compareProvince ? "opacity-100" : "opacity-0"
                              )}
                            />
                            None
                          </CommandItem>
                          {THAI_PROVINCES.filter((province) => {
                            // Exclude current province from comparison options
                            const currentThaiName = provinceName ? getThaiProvinceName(provinceName) || provinceName : null;
                            return province !== currentThaiName;
                          })
                            .filter((province) => {
                              const englishName = getEnglishProvinceName(province) || "";
                              const searchLower = compareProvinceSearchQuery.toLowerCase();
                              return (
                                province.toLowerCase().includes(searchLower) ||
                                englishName.toLowerCase().includes(searchLower)
                              );
                            })
                            .map((province) => (
                              <CommandItem
                                key={province}
                                value={province}
                                onSelect={() => {
                                  setCompareProvince(province);
                                  setCompareProvinceOpen(false);
                                  setCompareProvinceSearchQuery("");
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    compareProvince === province
                                      ? "opacity-100"
                                      : "opacity-0"
                                  )}
                                />
                                {getEnglishProvinceName(province) || province}
                              </CommandItem>
                            ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          {chartType === "line" ? (
            <LineChart data={chartDataWithCompare}>
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
              {/* Actual data line (solid) - only for months with actual data */}
              <Line
                type="monotone"
                dataKey={
                  metric === "revenue" ? "actualRevenue" : "actualTourists"
                }
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls={false}
                name={`Actual ${metric === "revenue" ? "Revenue" : "Visitors"}`}
              />
              {/* Predicted data line (dashed) - connects from last actual point */}
              {/* Show predicted line only if there's predicted data */}
              {(() => {
                // Check if there's predicted data in chartData (before compare merge)
                const hasPredictedData = chartData.some((d) => {
                  const value = metric === "revenue" ? d.predictedRevenue : d.predictedTourists;
                  return value !== null && value !== undefined;
                });
                if (!hasPredictedData) return null;
                
                return (
                  <Line
                    type="monotone"
                    dataKey={
                      metric === "revenue" ? "predictedRevenue" : "predictedTourists"
                    }
                    stroke="hsl(var(--secondary))"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={{ r: 4, fill: "hsl(var(--secondary))" }}
                    connectNulls={true}
                    name={`Predicted ${
                      metric === "revenue" ? "Revenue" : "Visitors"
                    }`}
                  />
                );
              })()}
              {/* Compare year line (if compareYear is selected) */}
              {compareYear && showCompareYear && (
                <Line
                  type="monotone"
                  dataKey={
                    metric === "revenue" ? "compareRevenue" : "compareTourists"
                  }
                  stroke="hsl(var(--accent-foreground))"
                  strokeWidth={2}
                  strokeDasharray="8 4"
                  dot={{ r: 4 }}
                  connectNulls={true}
                  name={`${compareYear} (Compare)`}
                />
              )}
              {/* Compare province line (if compareProvince is selected) */}
              {compareProvince && showCompareProvince && (
                <Line
                  type="monotone"
                  dataKey={
                    metric === "revenue" ? "compareProvinceRevenue" : "compareProvinceTourists"
                  }
                  stroke="#10b981"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: "#10b981" }}
                  connectNulls={true}
                  name={`${getEnglishProvinceName(compareProvince) || compareProvince} (Compare)`}
                />
              )}
            </LineChart>
          ) : (
            <ComposedChart data={chartData}>
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
                yAxisId="left"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "12px" }}
                label={{
                  value: "Visitors (million people)",
                  angle: -90,
                  position: "insideLeft",
                }}
                tickFormatter={(v) =>
                  (v / 1_000_000).toLocaleString("en-US", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })
                }
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="hsl(var(--muted-foreground))"
                style={{ fontSize: "12px" }}
                label={{
                  value: "Revenue (million Baht)",
                  angle: 90,
                  position: "insideRight",
                }}
                tickFormatter={(v) =>
                  v.toLocaleString("en-US", { maximumFractionDigits: 0 })
                }
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null;
                  
                  const data = payload[0].payload;
                  const festivals = data?.festivals || [];
                  const monthValue = data?.monthValue;
                  
                  // Separate common and province-specific festivals
                  const commonFestivalValues = new Set(
                    COMMON_FESTIVALS.map((f) => f.value)
                  );
                  const provinceSpecificFestivals = getProvinceSpecificFestivals(
                    provinceName || ""
                  );
                  const provinceSpecificFestivalValues = new Set(
                    provinceSpecificFestivals.map((f) => f.value)
                  );

                  const commonFestivals = festivals.filter((f: string) =>
                    commonFestivalValues.has(f)
                  );
                  const provinceSpecific = festivals.filter((f: string) =>
                    provinceSpecificFestivalValues.has(f)
                  );

                  return (
                    <div className="bg-popover border border-border rounded-lg p-4 shadow-lg max-w-sm">
                      <div className="mb-3">
                        <p className="font-semibold text-foreground mb-2">
                          {data?.month}
                        </p>
                        {payload.map((entry, index) => {
                          if (!entry.value) return null;
                          const value = entry.value as number;
                          const name = entry.name as string;
                          let formattedValue = "";
                          if (name === "Visitors" || name.includes("Visitors")) {
                            formattedValue = `${(value / 1_000_000).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })} million people`;
                          } else if (name === "Revenue" || name.includes("Revenue")) {
                            formattedValue = `${value.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })} million Baht`;
                          } else {
                            formattedValue = value.toString();
                          }
                          return (
                            <div key={index} className="text-sm">
                              <span className="text-muted-foreground">{name}:</span>{" "}
                              <span className="font-semibold text-foreground">
                                {formattedValue}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                      {festivals.length > 0 && (
                        <div className="border-t border-border pt-3 space-y-2">
                          {commonFestivals.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-foreground mb-1">
                                Common Festivals:
                              </p>
                              <ul className="text-xs text-muted-foreground space-y-0.5">
                                {commonFestivals.map((festival: string) => (
                                  <li key={festival}>
                                    {formatFestivalName(festival)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {provinceSpecific.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold text-foreground mb-1">
                                Province-Specific Festivals:
                              </p>
                              <ul className="text-xs text-muted-foreground space-y-0.5">
                                {provinceSpecific.map((festival: string) => (
                                  <li key={festival}>
                                    {formatFestivalName(festival)}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          <p className="text-xs text-muted-foreground pt-1 border-t border-border">
                            ✓ {festivals.length} festival
                            {festivals.length !== 1 ? "s" : ""} detected for{" "}
                            {provinceName
                              ? getEnglishProvinceName(provinceName)
                              : "this province"}{" "}
                            in{" "}
                            {MONTHS.find((m) => m.value === monthValue)?.label ||
                              data?.month}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                }}
              />
              <Legend />
              {/* Bar Chart for Visitors - Actual */}
              <Bar
                yAxisId="left"
                dataKey="actualTouristsForCombo"
                fill="hsl(var(--primary))"
                name="Actual Visitors"
              />
              {/* Bar Chart for Visitors - Predicted */}
              <Bar
                yAxisId="left"
                dataKey="predictedTouristsForCombo"
                fill="hsl(var(--primary)/0.6)"
                name="Predicted Visitors"
              />
              {/* Line Chart for Revenue - Actual */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="actualRevenueForCombo"
                stroke="hsl(var(--secondary))"
                strokeWidth={2}
                dot={{ r: 4 }}
                connectNulls={false}
                name="Actual Revenue"
              />
              {/* Line Chart for Revenue - Predicted */}
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="predictedRevenueForCombo"
                stroke="hsl(var(--secondary)/0.6)"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={{ r: 4 }}
                connectNulls={false}
                name="Predicted Revenue"
              />
            </ComposedChart>
          )}
        </ResponsiveContainer>
        
        {/* Comparison Stats - Show by Month */}
        {compareYear && chartType === "line" && showCompareYear && (
          <div className="mt-6 p-4 bg-accent/30 rounded-lg border border-border">
            <h4 className="text-sm font-semibold mb-3 text-foreground">
              Year Comparison: {selectedYear} vs {compareYear}
            </h4>
              {(() => {
                // Find predicted months (months that have predicted data)
                const predictedMonths = new Set<number>();
                chartData.forEach((d) => {
                  const monthObj = MONTHS.find((m) => m.label.slice(0, 3) === d.month);
                  if (monthObj) {
                    const predictedValue = metric === "revenue" ? d.predictedRevenue : d.predictedTourists;
                    if (predictedValue !== null && predictedValue !== undefined) {
                      predictedMonths.add(monthObj.value);
                    }
                  }
                });
                
              const predictedMonthsList = Array.from(predictedMonths).sort((a, b) => a - b);
              
              // Format values
              const formatValue = (val: number) => {
                if (metric === "revenue") {
                  return `${val.toLocaleString("en-US", { maximumFractionDigits: 0 })} M Baht`;
                } else {
                  return `${(val / 1_000_000).toLocaleString("en-US", { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })} M people`;
                }
              };
              
              // Get data for each predicted month
              const monthComparisons = predictedMonthsList.map((monthValue) => {
                const monthLabel = MONTHS.find(m => m.value === monthValue)?.label || `Month ${monthValue}`;
                const monthData = chartData.find((d) => {
                  const monthObj = MONTHS.find((m) => m.label.slice(0, 3) === d.month);
                  return monthObj?.value === monthValue;
                });
                const compareData = chartDataWithCompare.find((d) => {
                  const monthObj = MONTHS.find((m) => m.label.slice(0, 3) === d.month);
                  return monthObj?.value === monthValue;
                });
                
                const currentValue = monthData ? (metric === "revenue" ? monthData.predictedRevenue : monthData.predictedTourists) : null;
                const compareValue = compareData ? (metric === "revenue" ? compareData.compareRevenue : compareData.compareTourists) : null;
                
                if (currentValue === null || currentValue === undefined || compareValue === null || compareValue === undefined) {
                  return null;
                }
                
                const difference = currentValue - compareValue;
                const percentageChange = compareValue > 0 
                  ? ((difference / compareValue) * 100) 
                  : 0;
                const isIncrease = percentageChange > 0;
                
                return {
                  month: monthLabel,
                  monthValue,
                  currentValue,
                  compareValue,
                  difference,
                  percentageChange,
                  isIncrease,
                };
              }).filter((c): c is NonNullable<typeof c> => c !== null);
              
              if (monthComparisons.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground">
                    No predicted data available for comparison.
                  </p>
                );
              }
              
              return (
                <div className="space-y-3">
                  {monthComparisons.map((comp) => (
                    <div key={comp.monthValue} className="p-3 bg-background/50 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-foreground">{comp.month}</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          comp.isIncrease ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {comp.isIncrease ? "↑" : "↓"} {Math.abs(comp.percentageChange).toFixed(1)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground mb-1">{selectedYear}:</p>
                          <p className="font-semibold text-foreground">{formatValue(comp.currentValue)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">{compareYear}:</p>
                          <p className="font-semibold text-foreground">{formatValue(comp.compareValue)}</p>
                      </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-border">
                      <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Difference:</span>
                          <span className={`text-xs font-semibold ${
                            comp.isIncrease ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                        }`}>
                            {comp.isIncrease ? "+" : ""}{formatValue(comp.difference)}
                        </span>
                      </div>
                      </div>
                    </div>
                  ))}
                </div>
                );
              })()}
          </div>
        )}

        {/* Province Comparison Stats */}
        {compareProvince && chartType === "line" && showCompareProvince && (
          <div className="mt-6 p-4 bg-accent/30 rounded-lg border border-border">
            <h4 className="text-sm font-semibold mb-3 text-foreground">
              Province Comparison: {provinceName ? getEnglishProvinceName(provinceName) : "Current"} vs {getEnglishProvinceName(compareProvince) || compareProvince}
            </h4>
            {(() => {
              // Get all months with data
              const monthsWithData = chartData
                .map((d, index) => {
                  const monthObj = MONTHS.find((m) => m.label.slice(0, 3) === d.month);
                  if (!monthObj) return null;
                  
                  const currentValue = metric === "revenue" 
                    ? (d.actualRevenue ?? d.predictedRevenue) 
                    : (d.actualTourists ?? d.predictedTourists);
                  const compareValue = metric === "revenue"
                    ? (chartDataWithCompare[index]?.compareProvinceRevenue ?? null)
                    : (chartDataWithCompare[index]?.compareProvinceTourists ?? null);
                  
                  if (currentValue === null || currentValue === undefined || compareValue === null || compareValue === undefined) {
                    return null;
                  }
                  
                  const difference = currentValue - compareValue;
                  const percentageChange = compareValue > 0 
                    ? ((difference / compareValue) * 100) 
                    : 0;
                  const isIncrease = percentageChange > 0;
                  
                  return {
                    month: MONTHS.find(m => m.value === monthObj.value)?.label || d.month,
                    monthValue: monthObj.value,
                    currentValue,
                    compareValue,
                    difference,
                    percentageChange,
                    isIncrease,
                  };
                })
                .filter(Boolean) as Array<{
                  month: string;
                  monthValue: number;
                  currentValue: number;
                  compareValue: number;
                  difference: number;
                  percentageChange: number;
                  isIncrease: boolean;
                }>;
              
              if (monthsWithData.length === 0) {
                return (
                  <p className="text-sm text-muted-foreground">
                    No data available for comparison.
                  </p>
                );
              }
              
              // Format values
              const formatValue = (val: number) => {
                if (metric === "revenue") {
                  return `${val.toLocaleString("en-US", { maximumFractionDigits: 0 })} M Baht`;
                } else {
                  return `${(val / 1_000_000).toLocaleString("en-US", { 
                    minimumFractionDigits: 2, 
                    maximumFractionDigits: 2 
                  })} M people`;
                }
              };
              
              return (
                <div className="space-y-3">
                  {monthsWithData.map((comp) => (
                    <div key={comp.monthValue} className="p-3 bg-background/50 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-foreground">{comp.month}</span>
                        <span className={`text-xs font-medium px-2 py-1 rounded ${
                          comp.isIncrease ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}>
                          {comp.isIncrease ? "↑" : "↓"} {Math.abs(comp.percentageChange).toFixed(1)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <p className="text-muted-foreground mb-1">{provinceName ? getEnglishProvinceName(provinceName) : "Current"}:</p>
                          <p className="font-semibold text-foreground">{formatValue(comp.currentValue)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground mb-1">{getEnglishProvinceName(compareProvince) || compareProvince}:</p>
                          <p className="font-semibold text-foreground">{formatValue(comp.compareValue)}</p>
                        </div>
                      </div>
                      <div className="mt-2 pt-2 border-t border-border">
                        <div className="flex justify-between items-center">
                          <span className="text-xs text-muted-foreground">Difference:</span>
                          <span className={`text-xs font-semibold ${
                            comp.isIncrease ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                          }`}>
                            {comp.isIncrease ? "+" : ""}{formatValue(comp.difference)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
