"use client";

import { useState, useMemo } from "react";
import {
  ComposableMap,
  Geographies,
  Geography,
  ZoomableGroup,
} from "react-simple-maps";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
import type { HeatmapDataPoint } from "@/types/tourism";
import {
  getMapProvinceName,
  getThaiProvinceName,
  getEnglishProvinceName,
} from "@/lib/provinceMapping";
import {
  TrendingUp,
  Users,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Check,
  ChevronsUpDown,
} from "lucide-react";
import { THAI_PROVINCES } from "@/lib/provinces";
import { cn } from "@/lib/utils";

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
  const [position, setPosition] = useState({
    coordinates: [0, 0] as [number, number],
    zoom: 1,
  });
  const [provinceSearchOpen, setProvinceSearchOpen] = useState(false);
  const [provinceSearchQuery, setProvinceSearchQuery] = useState("");

  const handleMoveEnd = (position: {
    coordinates: [number, number];
    zoom: number;
  }) => {
    setPosition(position);
  };

  const handleZoomIn = () => {
    if (position.zoom >= 4) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom * 1.5 }));
  };

  const handleZoomOut = () => {
    if (position.zoom <= 1) return;
    setPosition((pos) => ({ ...pos, zoom: pos.zoom / 1.5 }));
  };

  const handleReset = () => {
    setPosition({ coordinates: [0, 0], zoom: 1 });
  };

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

  // Calculate actual min/max for red scale display
  const { actualMin, actualMax } = useMemo(() => {
    if (data.length === 0) return { actualMin: 0, actualMax: 1 };

    const values = data.map((d) => d.value).filter((v) => v > 0);

    if (values.length === 0) return { actualMin: 0, actualMax: 1 };

    return {
      actualMin: Math.min(...values),
      actualMax: Math.max(...values),
    };
  }, [data]);

  // Calculate min/max for growth mode (positive and negative)
  const { positiveMin, positiveMax, negativeMin, negativeMax } = useMemo(() => {
    if (data.length === 0 || mode !== "growth")
      return { positiveMin: 0, positiveMax: 0, negativeMin: 0, negativeMax: 0 };

    const positiveValues = data
      .map((d) => {
        const growthValue = (d as any).growthValue;
        return growthValue !== undefined && growthValue > 0
          ? growthValue
          : null;
      })
      .filter((v): v is number => v !== null && v > 0);

    const negativeValues = data
      .map((d) => {
        const growthValue = (d as any).growthValue;
        return growthValue !== undefined && growthValue < 0
          ? Math.abs(growthValue)
          : null;
      })
      .filter((v): v is number => v !== null && v > 0);

    return {
      positiveMin: positiveValues.length > 0 ? Math.min(...positiveValues) : 0,
      positiveMax: positiveValues.length > 0 ? Math.max(...positiveValues) : 0,
      negativeMin: negativeValues.length > 0 ? Math.min(...negativeValues) : 0,
      negativeMax: negativeValues.length > 0 ? Math.max(...negativeValues) : 0,
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
        // Negative growth: red scale (แดง) - darker
        const hue = 0; // Red
        const saturation = 60 + normalized * 25; // From 60% to 85%
        const lightness = 75 - normalized * 25; // From 75% to 50% (darker)
        return `hsl(${hue} ${saturation}% ${lightness}%)`;
      } else {
        // Zero growth: neutral color
        return "hsl(var(--muted))";
      }
    } else {
      // For volume: use soft green color scale - darker
      // Higher values = darker
      const hue = 140; // Soft green
      const saturation = 40 + normalized * 30; // From 40% to 70% saturation (more vibrant)
      const lightness = 80 - normalized * 25; // From 80% to 55% (darker)
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

        <div className="relative w-full h-[500px] bg-accent/20 rounded-lg overflow-hidden border border-border/50 shadow-inner transition-all duration-300 hover:shadow-lg">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 2000,
              center: [100.5, 13.7],
            }}
            className="w-full h-full"
          >
            <ZoomableGroup
              zoom={position.zoom}
              center={position.coordinates}
              onMoveEnd={handleMoveEnd}
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
                      getMapProvinceName(selectedProvince) ===
                        mapProvinceName ||
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
                                            (point.tourismAmount ??
                                              point.value) / 1_000_000
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
            </ZoomableGroup>
          </ComposableMap>

          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2 z-10">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-background/90 backdrop-blur-md hover:bg-background shadow-md"
              onClick={handleZoomIn}
              disabled={position.zoom >= 4}
              title="Zoom In"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-background/90 backdrop-blur-md hover:bg-background shadow-md"
              onClick={handleZoomOut}
              disabled={position.zoom <= 1}
              title="Zoom Out"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-background/90 backdrop-blur-md hover:bg-background shadow-md"
              onClick={handleReset}
              title="Reset View"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Search Province */}
          <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-md px-4 py-2 rounded-lg border border-border/50 shadow-lg">
            <Popover
              open={provinceSearchOpen}
              onOpenChange={setProvinceSearchOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={provinceSearchOpen}
                  className="w-[200px] justify-between bg-background"
                >
                  {selectedProvince
                    ? getEnglishProvinceName(selectedProvince) ||
                      selectedProvince
                    : "Search province..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[200px] p-0" align="start">
                <Command>
                  <CommandInput
                    placeholder="Search province..."
                    value={provinceSearchQuery}
                    onValueChange={setProvinceSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>No province found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="none"
                        onSelect={() => {
                          if (onProvinceClick) {
                            onProvinceClick("");
                          }
                          setProvinceSearchOpen(false);
                          setProvinceSearchQuery("");
                        }}
                      >
                        <Check
                          className={cn(
                            "mr-2 h-4 w-4",
                            !selectedProvince ? "opacity-100" : "opacity-0"
                          )}
                        />
                        None
                      </CommandItem>
                      {THAI_PROVINCES.filter((province) => {
                        const englishName =
                          getEnglishProvinceName(province) || "";
                        const searchLower = provinceSearchQuery.toLowerCase();
                        return (
                          province.toLowerCase().includes(searchLower) ||
                          englishName.toLowerCase().includes(searchLower)
                        );
                      }).map((province) => {
                        const mapName = getMapProvinceName(province);
                        const isSelected =
                          selectedProvince === province ||
                          selectedProvince === mapName ||
                          getThaiProvinceName(selectedProvince) === province;

                        return (
                          <CommandItem
                            key={province}
                            value={province}
                            onSelect={() => {
                              // Use map name if available, otherwise use Thai name
                              const provinceToSelect = mapName || province;
                              if (onProvinceClick) {
                                onProvinceClick(provinceToSelect);
                              }
                              setProvinceSearchOpen(false);
                              setProvinceSearchQuery("");
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                isSelected ? "opacity-100" : "opacity-0"
                              )}
                            />
                            {getEnglishProvinceName(province) || province}
                          </CommandItem>
                        );
                      })}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Legend */}
        <div className="space-y-2">
          {/* Green Scale */}
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
                ? positiveMin > 0
                  ? `${positiveMin.toFixed(2)}%`
                  : "N/A"
                : `${min.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })} ${metric === "income" ? "million Baht" : "people"}`}
            </div>
            <div className="text-muted-foreground">
              Max:{" "}
              {mode === "growth"
                ? positiveMax > 0
                  ? `${positiveMax.toFixed(2)}%`
                  : "N/A"
                : `${max.toLocaleString("en-US", {
                    maximumFractionDigits: 0,
                  })} ${metric === "income" ? "million Baht" : "people"}`}
            </div>
          </div>
          {/* Red Scale - Show for volume mode with income metric OR growth mode */}
          {(mode === "volume" && metric === "income") || mode === "growth" ? (
            <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">Low:</span>
                <div
                  className="w-4 h-4 rounded shadow-sm"
                  style={{ backgroundColor: `hsl(0 60% 75%)` }}
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground">High:</span>
                <div
                  className="w-4 h-4 rounded shadow-sm"
                  style={{ backgroundColor: `hsl(0 85% 50%)` }}
                />
              </div>
              <div className="text-muted-foreground">
                Min:{" "}
                {mode === "growth"
                  ? negativeMin > 0
                    ? `${negativeMin.toFixed(2)}%`
                    : "N/A"
                  : `${actualMin.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })} million Baht`}
              </div>
              <div className="text-muted-foreground">
                Max:{" "}
                {mode === "growth"
                  ? negativeMax > 0
                    ? `${negativeMax.toFixed(2)}%`
                    : "N/A"
                  : `${actualMax.toLocaleString("en-US", {
                      maximumFractionDigits: 0,
                    })} million Baht`}
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
