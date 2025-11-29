"use client";

import { useMemo } from "react";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { Card } from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import type { HeatmapDataPoint } from "@/types/tourism";
import {
  getMapProvinceName,
  getThaiProvinceName,
} from "@/utils/provinceMapping";
import { TrendingUp, Users } from "lucide-react";

const THAILAND_TOPO_JSON =
  "https://raw.githubusercontent.com/apisit/thailand.json/master/thailand.json";

interface ProvinceHeatmapProps {
  data: HeatmapDataPoint[];
  metric: "income" | "tourismAmount";
  mode?: "volume" | "growth";
  selectedProvince?: string;
  onProvinceClick?: (province: string) => void;
}

export function ProvinceHeatmap({
  data,
  metric,
  mode = "volume",
  selectedProvince,
  onProvinceClick,
}: ProvinceHeatmapProps) {
  // Create a map for quick lookup - map Thai names to map names
  const dataMap = useMemo(() => {
    const map = new Map<string, HeatmapDataPoint>();
    data.forEach((point) => {
      // Store by English name (for map matching)
      map.set(point.province, point);
      // Also store by Thai name as fallback
      if (point.provinceThai && point.provinceThai !== point.province) {
        map.set(point.provinceThai, point);
      }
      // Also store by reverse mapping
      const thaiName = getThaiProvinceName(point.province);
      if (thaiName && thaiName !== point.province) {
        map.set(thaiName, point);
      }
    });
    // Debug: Log data values for volume mode
    if (data.length > 0 && mode === "volume") {
      const sampleValues = data
        .slice(0, 5)
        .map((d) => ({ province: d.province, value: d.value }));
      console.log("Heatmap data map created:", map.size, "entries");
      console.log("Sample values (volume mode):", sampleValues);
      const allValues = data.map((d) => d.value);
      console.log("All values range:", {
        min: Math.min(...allValues),
        max: Math.max(...allValues),
        avg: allValues.reduce((sum, v) => sum + v, 0) / allValues.length,
      });
    }
    return map;
  }, [data]);

  // Calculate min/max for color scaling - use percentiles for better contrast
  const { min, max } = useMemo(() => {
    if (data.length === 0) return { min: 0, max: 1 };

    // For growth mode, use absolute values for scaling
    const values = data
      .map((d) => {
        if (mode === "growth") {
          const growthValue = (d as any).growthValue;
          return growthValue !== undefined ? Math.abs(growthValue) : d.value;
        }
        return d.value;
      })
      .filter((v) => v > 0)
      .sort((a, b) => a - b);
    if (values.length === 0) return { min: 0, max: 1 };

    // Use 5th and 95th percentile for better color contrast
    const p5 = values[Math.floor(values.length * 0.05)] || values[0];
    const p95 =
      values[Math.floor(values.length * 0.95)] || values[values.length - 1];

    return {
      min: p5,
      max: p95,
    };
  }, [data, mode]);

  const getProvinceColor = (
    mapProvinceName: string,
    point?: HeatmapDataPoint
  ): string => {
    // Use provided point or try to find data
    const dataPoint =
      point ||
      dataMap.get(mapProvinceName) ||
      dataMap.get(getThaiProvinceName(mapProvinceName));

    if (!dataPoint || max === min) {
      return "hsl(var(--muted))";
    }

    // Normalize value to 0-1 range (clamp to handle outliers)
    const normalized = Math.max(
      0,
      Math.min(1, (dataPoint.value - min) / (max - min))
    );

    // Different color scales for different modes
    if (mode === "growth") {
      // For growth: use red-green scale (red for negative, green for positive)
      const growthValue = (dataPoint as any).growthValue;

      // If growthValue is undefined, we can't determine the sign, use muted color
      if (growthValue === undefined || growthValue === null) {
        return "hsl(var(--muted))";
      }

      // Ensure growthValue is a number
      const numGrowthValue =
        typeof growthValue === "number" ? growthValue : Number(growthValue);

      // Check if it's a valid number
      if (isNaN(numGrowthValue)) {
        return "hsl(var(--muted))";
      }

      // Check the sign of growthValue (not the absolute value)
      // Positive = Green, Negative = Red
      if (numGrowthValue > 0) {
        // Positive growth: green scale (เขียว)
        const hue = 140; // Green
        const saturation = 50 + normalized * 30; // From 50% to 80%
        const lightness = 85 - normalized * 20; // From 85% to 65%
        return `hsl(${hue} ${saturation}% ${lightness}%)`;
      } else if (numGrowthValue < 0) {
        // Negative growth: red scale (แดง)
        const hue = 0; // Red
        const saturation = 50 + normalized * 30; // From 50% to 80%
        const lightness = 85 - normalized * 20; // From 85% to 65%
        return `hsl(${hue} ${saturation}% ${lightness}%)`;
      } else {
        // Zero growth: neutral color
        return "hsl(var(--muted))";
      }
    } else {
      // For volume: use soft green color scale - gentle on the eyes
      // Higher values = slightly darker but still soft
      const hue = 140; // Soft green
      const saturation = 30 + normalized * 20; // From 30% to 50% saturation (soft)
      const lightness = 92 - normalized * 15; // From 92% (very light) to 77% (still light)
      return `hsl(${hue} ${saturation}% ${lightness}%)`;
    }
  };

  const formatValue = (value: number, growthValue?: number): string => {
    if (mode === "growth") {
      const displayValue = growthValue !== undefined ? growthValue : value;
      return `${displayValue >= 0 ? "+" : ""}${displayValue.toFixed(2)}%`;
    }
    if (metric === "income") {
      return `${value.toLocaleString("en-US", {
        maximumFractionDigits: 0,
      })} million Baht`;
    } else {
      return `${(value / 1_000_000).toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} million people`;
    }
  };

  return (
    <Card className="p-6 bg-card border-border shadow-lg h-full">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Province Heatmap
          </h2>
          <p className="text-sm text-muted-foreground">
            {mode === "growth"
              ? "Year-over-Year Growth"
              : metric === "income"
              ? "Revenue"
              : "Visitors"}{" "}
            {mode === "volume" ? "distribution" : ""} across Thailand
          </p>
        </div>

        <div className="relative w-full h-[500px] bg-accent/20 rounded-lg overflow-hidden border border-border/50 shadow-inner">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 2000,
              center: [100.5, 13.7],
            }}
            className="w-full h-full"
          >
            <Geographies geography={THAILAND_TOPO_JSON}>
              {({ geographies }) => {
                // Debug: log first few province names from map
                if (geographies.length > 0 && data.length > 0) {
                  const sampleNames = geographies
                    .slice(0, 3)
                    .map((g) => g.properties.name);
                  console.log("Map province names (sample):", sampleNames);
                }
                return geographies.map((geo) => {
                  const mapProvinceName = geo.properties.name;
                  const thaiName = getThaiProvinceName(mapProvinceName);

                  // Try multiple lookup strategies
                  let point =
                    dataMap.get(mapProvinceName) || dataMap.get(thaiName);

                  // If no direct match, try to find by any matching key
                  if (!point && dataMap.size > 0) {
                    const entries = Array.from(dataMap.entries());
                    for (const [key, value] of entries) {
                      const keyThaiName = getThaiProvinceName(key);
                      const keyMapName = getMapProvinceName(key);
                      if (
                        key === mapProvinceName ||
                        key === thaiName ||
                        keyThaiName === mapProvinceName ||
                        keyThaiName === thaiName ||
                        keyMapName === mapProvinceName ||
                        keyMapName === thaiName
                      ) {
                        point = value;
                        break;
                      }
                    }
                  }

                  const isSelected =
                    selectedProvince === mapProvinceName ||
                    selectedProvince === thaiName ||
                    getMapProvinceName(selectedProvince) === mapProvinceName ||
                    getThaiProvinceName(selectedProvince) === thaiName;
                  const color = getProvinceColor(mapProvinceName, point);

                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => onProvinceClick?.(mapProvinceName)}
                      style={{
                        default: {
                          fill: color,
                          stroke: isSelected
                            ? "hsl(var(--primary))"
                            : "hsl(var(--border))",
                          strokeWidth: isSelected ? 3 : 0.8,
                          outline: "none",
                          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                          opacity: isSelected ? 1 : 0.95,
                        },
                        hover: {
                          fill: "hsl(var(--primary))",
                          stroke: "hsl(var(--primary))",
                          strokeWidth: 2.5,
                          outline: "none",
                          cursor: "pointer",
                          filter: "brightness(1.15) saturate(1.2)",
                          opacity: 1,
                          transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                        },
                        pressed: {
                          fill: "hsl(var(--primary))",
                          stroke: "hsl(var(--primary))",
                          strokeWidth: 3,
                          outline: "none",
                          filter: "brightness(0.95)",
                          transition: "all 0.1s ease",
                        },
                      }}
                    >
                      {point && (
                        <HoverCard>
                          <HoverCardTrigger asChild>
                            <title>
                              {point.provinceThai || mapProvinceName}
                              {"\n"}
                              {metric === "income"
                                ? "Revenue"
                                : "Visitors"}: {formatValue(point.value)}
                            </title>
                          </HoverCardTrigger>
                          <HoverCardContent className="w-80">
                            <div className="space-y-2">
                              <h4 className="font-semibold text-foreground">
                                {point.provinceThai || mapProvinceName}
                              </h4>
                              <div className="space-y-1 text-sm">
                                {mode === "growth" ? (
                                  <div className="flex items-center gap-2">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    <span className="text-muted-foreground">
                                      YoY Growth:
                                    </span>
                                    <span
                                      className={`font-medium ${
                                        ((point as any).growthValue ??
                                          point.value) >= 0
                                          ? "text-green-600 dark:text-green-400"
                                          : "text-red-600 dark:text-red-400"
                                      }`}
                                    >
                                      {formatValue(
                                        point.value,
                                        (point as any).growthValue
                                      )}
                                    </span>
                                  </div>
                                ) : (
                                  <>
                                    <div className="flex items-center gap-2">
                                      <TrendingUp className="h-4 w-4 text-primary" />
                                      <span className="text-muted-foreground">
                                        Revenue:
                                      </span>
                                      <span className="font-medium text-foreground">
                                        {(
                                          point.income ?? point.value
                                        ).toLocaleString("en-US", {
                                          maximumFractionDigits: 0,
                                        })}{" "}
                                        million Baht
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <Users className="h-4 w-4 text-secondary" />
                                      <span className="text-muted-foreground">
                                        Visitors:
                                      </span>
                                      <span className="font-medium text-foreground">
                                        {(
                                          (point.tourismAmount ?? point.value) /
                                          1_000_000
                                        ).toLocaleString("en-US", {
                                          minimumFractionDigits: 2,
                                          maximumFractionDigits: 2,
                                        })}{" "}
                                        million people
                                      </span>
                                    </div>
                                  </>
                                )}
                                <div className="text-xs text-muted-foreground">
                                  {point.year && point.month
                                    ? `Year: ${point.year} | Month: ${point.month}`
                                    : ""}
                                  {point.tourismType
                                    ? ` | Type: ${point.tourismType}`
                                    : ""}
                                </div>
                              </div>
                            </div>
                          </HoverCardContent>
                        </HoverCard>
                      )}
                    </Geography>
                  );
                });
              }}
            </Geographies>
          </ComposableMap>

          {/* Tooltip hint */}
          <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-md px-4 py-2 rounded-lg border border-border/50 shadow-lg">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="font-medium">
                {selectedProvince
                  ? `Selected: ${selectedProvince}`
                  : "Hover or click a province to see details"}
              </span>
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">Low:</span>
            <div
              className="w-4 h-4 rounded shadow-sm"
              style={{ backgroundColor: `hsl(140 30% 92%)` }}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground">High:</span>
            <div
              className="w-4 h-4 rounded shadow-sm"
              style={{ backgroundColor: `hsl(140 50% 77%)` }}
            />
          </div>
          <div className="text-muted-foreground">
            Min:{" "}
            {mode === "growth"
              ? `${min.toFixed(2)}%`
              : `${min.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })} ${metric === "income" ? "million Baht" : "people"}`}
          </div>
          <div className="text-muted-foreground">
            Max:{" "}
            {mode === "growth"
              ? `${max.toFixed(2)}%`
              : `${max.toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })} ${metric === "income" ? "million Baht" : "people"}`}
          </div>
        </div>
      </div>
    </Card>
  );
}
