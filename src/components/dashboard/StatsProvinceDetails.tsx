"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MapPin, TrendingUp, Users, Calendar } from "lucide-react";
import { MonthlyTrendChart } from "./charts/MonthlyTrendChart";
import { loadTourismData, getMonthlyDataForProvince } from "@/utils/tourismDataLoader";
import type { MonthlyDataPoint } from "@/types/tourism";
import { getMapProvinceName } from "@/utils/provinceMapping";

interface StatsProvinceDetailsProps {
  provinceThai?: string;
}

export function StatsProvinceDetails({
  provinceThai,
}: StatsProvinceDetailsProps) {
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!provinceThai) {
      setMonthlyData([]);
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const rawData = await loadTourismData();
        const data = getMonthlyDataForProvince(rawData, provinceThai);
        setMonthlyData(data);
      } catch (error) {
        console.error("Failed to load province data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [provinceThai]);

  if (!provinceThai) {
    return (
      <Card className="p-8 bg-card border-border shadow-lg">
        <div className="text-center text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Select a province to view detailed statistics</p>
        </div>
      </Card>
    );
  }

  const provinceName = getMapProvinceName(provinceThai) || provinceThai;

  // Calculate statistics
  const totalRevenue = monthlyData.reduce((sum, d) => sum + d.revenue, 0);
  const totalVisitors = monthlyData.reduce((sum, d) => sum + d.tourists, 0);
  const avgRevenue = monthlyData.length > 0 ? totalRevenue / monthlyData.length : 0;
  const avgVisitors = monthlyData.length > 0 ? totalVisitors / monthlyData.length : 0;
  const years = Array.from(new Set(monthlyData.map((d) => d.year))).sort((a, b) => a - b);

  return (
    <Card className="p-6 bg-card border-border shadow-lg">
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            {provinceName}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Historical Statistics
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/20 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Revenue
                      </p>
                      <p className="text-2xl font-bold text-primary mt-1">
                        {totalRevenue.toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          million Baht
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-secondary/20 rounded-lg">
                      <Users className="h-6 w-6 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Total Visitors
                      </p>
                      <p className="text-2xl font-bold text-secondary mt-1">
                        {(totalVisitors / 1_000_000).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        <span className="text-sm font-normal text-muted-foreground">
                          million people
                        </span>
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-gradient-to-br from-accent/50 to-accent/30 border-accent/40">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-accent/40 rounded-lg">
                      <Calendar className="h-6 w-6 text-foreground" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-muted-foreground">
                        Data Period
                      </p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        {years.length > 0 ? `${years[0]} - ${years[years.length - 1]}` : "N/A"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {monthlyData.length} data points
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    Average Monthly Revenue
                  </p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {avgRevenue.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      million Baht
                    </span>
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <p className="text-sm font-medium text-muted-foreground">
                    Average Monthly Visitors
                  </p>
                  <p className="text-xl font-bold text-foreground mt-1">
                    {(avgVisitors / 1_000_000).toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{" "}
                    <span className="text-sm font-normal text-muted-foreground">
                      million people
                    </span>
                  </p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="trends" className="mt-6">
            {loading ? (
              <div className="text-center text-muted-foreground py-8">
                Loading trend data...
              </div>
            ) : monthlyData.length > 0 ? (
              <MonthlyTrendChart
                data={monthlyData}
                provinceName={provinceName}
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>No trend data available for this province</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}

