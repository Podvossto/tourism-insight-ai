"use client";

import { useEffect, useState, useMemo } from "react";
import { Map, Filter, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProvinceHeatmap } from "@/components/dashboard/ProvinceHeatmap";
import { MonthlyTrendChart } from "@/components/dashboard/charts/MonthlyTrendChart";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  loadTourismData,
  aggregateHeatmapData,
  getMonthlyDataForProvince,
} from "@/utils/tourismDataLoader";
import {
  getMapProvinceName,
  getThaiProvinceName,
} from "@/utils/provinceMapping";
import type {
  HeatmapDataPoint,
  TourismDataRow,
  MonthlyDataPoint,
} from "@/types/tourism";

export default function HeatmapPage() {
  const [rawData, setRawData] = useState<TourismDataRow[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]);
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [monthlyData, setMonthlyData] = useState<MonthlyDataPoint[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters - default to all years, no filters
  const [year, setYear] = useState<number | undefined>(undefined);
  const [month, setMonth] = useState<number | undefined>(undefined);
  const [metric, setMetric] = useState<"income" | "tourismAmount">("income");
  const [tourismType, setTourismType] = useState<"Thai" | "Foreign" | "All">(
    "All"
  );

  useEffect(() => {
    loadTourismData()
      .then((data) => {
        console.log("Loaded tourism data:", data.length, "rows");
        console.log("Sample rows:", data.slice(0, 3));
        setRawData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load tourism data:", error);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (rawData.length === 0) return;

    const aggregated = aggregateHeatmapData(rawData, {
      year,
      month,
      metric,
      tourismType: tourismType === "All" ? undefined : tourismType,
    });

    console.log("Aggregated heatmap data:", aggregated.length, "provinces");
    console.log("Sample data:", aggregated.slice(0, 3));
    setHeatmapData(aggregated);
  }, [rawData, year, month, metric, tourismType]);

  const selectedData = useMemo(() => {
    if (!selectedProvince || heatmapData.length === 0) return undefined;
    
    // Try multiple lookup strategies
    const thaiName = getThaiProvinceName(selectedProvince);
    const mapName = getMapProvinceName(selectedProvince);
    
    return heatmapData.find((d) => {
      const dThaiName = getThaiProvinceName(d.province);
      const dMapName = getMapProvinceName(d.province);
      
      return (
        d.province === selectedProvince ||
        d.province === thaiName ||
        d.province === mapName ||
        dThaiName === selectedProvince ||
        dThaiName === thaiName ||
        dMapName === selectedProvince ||
        dMapName === mapName
      );
    });
  }, [selectedProvince, heatmapData]);

  // Load monthly data when province is selected
  useEffect(() => {
    if (!selectedProvince || rawData.length === 0) {
      setMonthlyData([]);
      return;
    }

    // Convert map province name to Thai name
    const thaiName = getThaiProvinceName(selectedProvince);
    
    // Load data for both Thai and Foreign if "All" is selected, otherwise load for selected type
    let monthly: MonthlyDataPoint[] = [];
    if (tourismType === "All") {
      const thaiData = getMonthlyDataForProvince(rawData, thaiName, {
        year: year,
        tourismType: "Thai",
      });
      const foreignData = getMonthlyDataForProvince(rawData, thaiName, {
        year: year,
        tourismType: "Foreign",
      });
      monthly = [
        ...thaiData.map((d) => ({ ...d, tourism_type: "Thai" as const })),
        ...foreignData.map((d) => ({ ...d, tourism_type: "Foreign" as const })),
      ];
    } else {
      monthly = getMonthlyDataForProvince(rawData, thaiName, {
        year: year,
        tourismType: tourismType,
      }).map((d) => ({ ...d, tourism_type: tourismType }));
    }
    
    setMonthlyData(monthly);
  }, [selectedProvince, rawData, year, tourismType]);

  return (
    <>
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="flex h-16 items-center gap-4 px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Map className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Tourism Insight AI — Province Heatmap
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

      <main className="container mx-auto px-2 sm:px-4 py-8 space-y-6">

        {/* Heatmap and Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            {loading ? (
              <Card className="p-8 bg-card border-border">
                <div className="text-center text-muted-foreground">
                  Loading heatmap data...
                </div>
              </Card>
            ) : (
              <ProvinceHeatmap
                data={heatmapData}
                metric={metric}
                selectedProvince={selectedProvince}
                onProvinceClick={setSelectedProvince}
              />
            )}
          </div>

          <div className="lg:col-span-4">
            <Card className="p-6 bg-card border-border shadow-lg">
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Province Details
              </h3>
              {selectedData ? (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Province:</p>
                    <p className="text-lg font-bold text-foreground">
                      {selectedData.provinceThai}
                    </p>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Revenue:</p>
                      <p className="text-xl font-bold text-primary">
                        {(
                          selectedData.income ?? selectedData.value
                        ).toLocaleString("en-US", {
                          maximumFractionDigits: 0,
                        })}{" "}
                        million Baht
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Visitors:</p>
                      <p className="text-xl font-bold text-secondary">
                        {(
                          (selectedData.tourismAmount ?? selectedData.value) /
                          1_000_000
                        ).toLocaleString("en-US", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}{" "}
                        million people
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2 text-sm pt-2 border-t border-border">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Data Period:</span>
                      <span className="font-medium text-foreground">
                        All Years
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center text-muted-foreground py-8">
                  <p>Click a province on the map to see details</p>
                </div>
              )}
            </Card>
          </div>
        </div>

        {/* Monthly Trend Chart - Moved to bottom */}
        {selectedProvince && monthlyData.length > 0 && (
          <div className="mt-6">
            <MonthlyTrendChart
              data={monthlyData}
              provinceName={
                getThaiProvinceName(selectedProvince) || selectedProvince
              }
            />
          </div>
        )}
      </main>
    </>
  );
}
