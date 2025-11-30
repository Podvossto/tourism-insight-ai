import { useState, useEffect } from "react";
import { MapPin, TrendingUp, Users, Calendar } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ProvinceData, MonthlyDataPoint } from "@/types/tourism";

import { FestivalImpactChart } from "./charts/FestivalImpactChart";
import { TrendChart } from "./charts/TrendChart";
import { MonthlyTrendChart } from "./charts/MonthlyTrendChart";
import {
  getMonthlyDataForProvince,
  loadTourismData,
} from "@/utils/tourismDataLoader";
import type { TourismDataRow } from "@/types/tourism";
import { MONTHS } from "@/data/provinces";
import { getEnglishProvinceName } from "@/utils/provinceMapping";

interface ProvinceDetailsProps {
  province?: ProvinceData;
  comparisonMode?: boolean;
}

export function ProvinceDetails({
  province,
  comparisonMode,
}: ProvinceDetailsProps) {
  const [showCompare, setShowCompare] = useState(false);
  const [compareYear, setCompareYear] = useState<number | undefined>();
  const [comparisonYears, setComparisonYears] = useState<number[]>([]);
  const [combinedMonthlyData, setCombinedMonthlyData] = useState<
    MonthlyDataPoint[]
  >([]);
  const [compareTourismType, setCompareTourismType] = useState<boolean>(false);
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>();
  const [rawData, setRawData] = useState<TourismDataRow[]>([]);

  // Load raw data for festival detection
  useEffect(() => {
    loadTourismData()
      .then((data) => {
        setRawData(data);
      })
      .catch((error) => {
        console.error("Failed to load tourism data:", error);
      });
  }, []);

  useEffect(() => {
    if (!comparisonMode || !province?.monthlyHistory) return;
    // collect all years except latest
    const years = Array.from(
      new Set(province.monthlyHistory.map((p) => p.year))
    ).sort((a, b) => a - b);
    if (years.length > 1) {
      setShowCompare(true);
      setComparisonYears(years.filter((y) => y !== province.year));
      setCompareYear(years[years.length - 2]);
    } else {
      setShowCompare(false);
    }
  }, [province?.monthlyHistory, province?.year, comparisonMode]);

  // Load actual data and combine with predicted data
  useEffect(() => {
    if (!province?.provinceThai) {
      setCombinedMonthlyData([]);
      return;
    }

    const loadAndCombine = async () => {
      try {
        const rawData = await loadTourismData();
        // Load actual data for both Thai and Foreign to allow selection
        const actualDataThai = getMonthlyDataForProvince(
          rawData,
          province.provinceThai,
          {
            tourismType: "Thai",
          }
        );
        const actualDataForeign = getMonthlyDataForProvince(
          rawData,
          province.provinceThai,
          {
            tourismType: "Foreign",
          }
        );

        // Mark actual data with tourism_type
        const actualDataMarked: MonthlyDataPoint[] = [
          ...actualDataThai.map((d) => ({
            ...d,
            isPredicted: false,
            tourism_type: "Thai" as const,
          })),
          ...actualDataForeign.map((d) => ({
            ...d,
            isPredicted: false,
            tourism_type: "Foreign" as const,
          })),
        ];

        // Get predicted data and mark with tourism_type
        // Only use data that has tourism_type explicitly set, or if province has single tourism_type
        const predictedData: MonthlyDataPoint[] =
          province.monthlyHistory
            ?.filter((d) => {
              // Only include if tourism_type is set, or if province has a single tourism_type
              return d.tourism_type || province.tourism_type;
            })
            .map((d) => ({
            ...d,
            tourism_type: d.tourism_type || province.tourism_type,
          })) || [];

        // Combine and sort by year, then month
        const combined = [...actualDataMarked, ...predictedData].sort(
          (a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            return a.month - b.month;
          }
        );

        setCombinedMonthlyData(combined);
      } catch (error) {
        console.error("Failed to load actual data:", error);
        // Fallback to just predicted data with tourism_type
        // Only use data that has tourism_type explicitly set
        setCombinedMonthlyData(
          province.monthlyHistory
            ?.filter((d) => {
              // Only include if tourism_type is set, or if province has a single tourism_type
              return d.tourism_type || province.tourism_type;
            })
            .map((d) => ({
            ...d,
              tourism_type: d.tourism_type || province.tourism_type,
          })) || []
        );
      }
    };

    loadAndCombine();
  }, [
    province?.provinceThai,
    province?.monthlyHistory,
    province?.tourism_type,
  ]);

  if (!province) {
    return (
      <Card className="p-8 bg-card border-border shadow-lg">
        <div className="text-center text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select any province on the map to inspect its metrics.</p>
        </div>
      </Card>
    );
  }

  const provinceLabel = getEnglishProvinceName(
    province.provinceThai || province.province
  );
  // Revenue per visitor: income is in million Baht, tourism amount is in people
  // So we need to convert income to Baht (multiply by 1,000,000) then divide by people
  const incomePerVisitor =
    province.predicted_tourism_amount_people > 0
      ? (province.predicted_income_million_baht * 1_000_000) /
        province.predicted_tourism_amount_people
      : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-foreground">
          Province detail: {provinceLabel}
        </h2>
      </div>

      {/* Overview Card */}
      <Card className="p-6 bg-card border-border shadow-lg">
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">Overview</h3>
          {/* Month Selector - Moved to top */}
          {combinedMonthlyData.length > 0 && (
            <Card className="bg-muted/30 border-border">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">
                    Select Month (from Predictions)
                  </Label>
                  <Select
                    value={selectedMonth?.toString() ?? "all"}
                    onValueChange={(value) =>
                      setSelectedMonth(
                        value === "all" ? undefined : parseInt(value, 10)
                      )
                    }
                  >
                    <SelectTrigger className="w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Months</SelectItem>
                      {Array.from(
                        new Set(
                          combinedMonthlyData
                            .filter((d) => d.isPredicted)
                            .map((d) => d.month)
                        )
                      )
                        .sort((a, b) => a - b)
                        .map((month) => (
                          <SelectItem key={month} value={month.toString()}>
                            {MONTHS.find((m) => m.value === month)?.label ||
                              `Month ${month}`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Thai vs Foreign Tourists Comparison */}
          {(() => {
            let thaiRevenue = 0;
            let thaiVisitors = 0;
            let foreignRevenue = 0;
            let foreignVisitors = 0;

            // If month is selected, always calculate from monthlyHistory for that month
            // Otherwise, prefer aggregated data from thaiData/foreignData if available
            if (selectedMonth) {
              // Calculate from monthlyHistory filtered by selected month
              const predictedData = combinedMonthlyData.filter(
                (d) => d.isPredicted && d.month === selectedMonth
              );

              const thaiDataPoints = predictedData.filter(
                (d) => d.tourism_type === "Thai"
              );
              const foreignDataPoints = predictedData.filter(
                (d) => d.tourism_type === "Foreign"
              );

              thaiRevenue = thaiDataPoints.reduce(
                (sum, d) => sum + d.revenue * 1_000_000,
                0
              );
              thaiVisitors = thaiDataPoints.reduce(
                (sum, d) => sum + d.tourists,
                0
              );

              foreignRevenue = foreignDataPoints.reduce(
                (sum, d) => sum + d.revenue * 1_000_000,
                0
              );
              foreignVisitors = foreignDataPoints.reduce(
                (sum, d) => sum + d.tourists,
                0
              );
            } else if (
              province.thaiData &&
              province.foreignData &&
              province.thaiData.predicted_income_million_baht !== undefined &&
              province.foreignData.predicted_income_million_baht !==
                undefined &&
              province.thaiData.tourism_type === "Thai" &&
              province.foreignData.tourism_type === "Foreign"
            ) {
              // Use aggregated data if available (all months)
              // Verify that thaiData and foreignData have valid data and correct tourism_type
              thaiRevenue =
                province.thaiData.predicted_income_million_baht * 1_000_000;
              thaiVisitors = province.thaiData.predicted_tourism_amount_people;
              foreignRevenue =
                province.foreignData.predicted_income_million_baht * 1_000_000;
              foreignVisitors =
                province.foreignData.predicted_tourism_amount_people;
            } else {
              // Calculate from all monthlyHistory
              // Only use data that has tourism_type explicitly set
              const predictedData = combinedMonthlyData.filter(
                (d) => d.isPredicted && d.tourism_type
              );

              const thaiDataPoints = predictedData.filter(
                (d) => d.tourism_type === "Thai"
              );
              const foreignDataPoints = predictedData.filter(
                (d) => d.tourism_type === "Foreign"
              );

              thaiRevenue = thaiDataPoints.reduce(
                (sum, d) => sum + d.revenue * 1_000_000,
                0
              );
              thaiVisitors = thaiDataPoints.reduce(
                (sum, d) => sum + d.tourists,
                0
              );

              foreignRevenue = foreignDataPoints.reduce(
                (sum, d) => sum + d.revenue * 1_000_000,
                0
              );
              foreignVisitors = foreignDataPoints.reduce(
                (sum, d) => sum + d.tourists,
                0
              );
            }

            const thaiRevenuePerVisitor =
              thaiVisitors > 0 ? thaiRevenue / thaiVisitors : 0;
            const foreignRevenuePerVisitor =
              foreignVisitors > 0 ? foreignRevenue / foreignVisitors : 0;

            // Only show if we have data for at least one type
            if (thaiVisitors === 0 && foreignVisitors === 0) return null;

            return (
              <div className="grid grid-cols-2 gap-4">
                {/* Thai Tourists Panel */}
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <h4 className="font-semibold text-foreground">
                      Thai Tourists
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Revenue
                      </p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {thaiRevenue.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}{" "}
                        Baht
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Visitors
                      </p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {thaiVisitors.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}{" "}
                        people
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Revenue per Visitor
                      </p>
                      <p className="text-base font-bold text-foreground">
                        {thaiRevenuePerVisitor.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        Baht/person
                      </p>
                    </div>
                  </div>
                </div>

                {/* Foreign Tourists Panel */}
                <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <h4 className="font-semibold text-foreground">
                      Foreign Tourists
                    </h4>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Revenue
                      </p>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        {foreignRevenue.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}{" "}
                        Baht
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Visitors
                      </p>
                      <p className="text-lg font-bold text-green-600 dark:text-green-400">
                        {foreignVisitors.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}{" "}
                        people
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        Revenue per Visitor
                      </p>
                      <p className="text-base font-bold text-foreground">
                        {foreignRevenuePerVisitor.toLocaleString("en-US", {
                          maximumFractionDigits: 2,
                        })}{" "}
                        Baht/person
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          <Card className="bg-muted/50 border-border">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-4 text-foreground">
                Quick stats
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Province:</span>
                  <span className="font-medium text-foreground">
                    {provinceLabel}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    Revenue per visitor:
                  </span>
                  <span className="font-medium text-foreground">
                    {incomePerVisitor.toLocaleString("en-US", {
                      maximumFractionDigits: 2,
                    })}{" "}
                    Baht/person
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status:</span>
                  <span className="font-medium text-success">
                    Latest AI forecast
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </Card>

      {/* Monthly Trend Card */}
      <Card className="p-6 bg-card border-border shadow-lg">
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">
            Monthly Trend
          </h3>
          {combinedMonthlyData.length > 0 ? (
            <MonthlyTrendChart
              data={combinedMonthlyData}
              provinceName={provinceLabel}
              tourismType={province.tourism_type}
              rawData={rawData}
              predictionYear={province.year}
            />
          ) : province.monthlyHistory && province.monthlyHistory.length > 0 ? (
            <MonthlyTrendChart
              data={province.monthlyHistory}
              provinceName={provinceLabel}
              tourismType={province.tourism_type}
              rawData={rawData}
              predictionYear={province.year}
            />
          ) : (
            <div className="text-center text-muted-foreground py-8">
              <p>Monthly trend data is not available for this province yet.</p>
              <p className="text-sm mt-2">
                Run a prediction to see monthly trends.
              </p>
            </div>
          )}
        </div>
      </Card>

      {/* Festival Impact Card */}
      <Card className="p-6 bg-card border-border shadow-lg">
        <div className="space-y-6">
          <h3 className="text-xl font-semibold text-foreground">
            Festival Impact
          </h3>
          <FestivalImpactChart
            data={province.festivalImpact}
            provinceName={provinceLabel}
          />
          <Card className="bg-accent/50 border-border">
            <CardContent className="pt-6">
              <h3 className="font-semibold mb-3 text-foreground">
                Recommendation
              </h3>
              <p className="text-sm text-muted-foreground">
                Focus campaign budgets around the festivals with the highest
                uplift to maximise both revenue and visitor volume.
              </p>
            </CardContent>
          </Card>
        </div>
      </Card>
    </div>
  );
}
