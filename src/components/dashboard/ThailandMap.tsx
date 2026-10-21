"use client";

import { useState } from "react";
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
  
  
  
  
} from "@/components/ui/tooltip";
import { ProvinceData } from "@/types/tourism";
import {
  TrendingUp,
  Users,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  MapPin,
} from "lucide-react";
import {
  getThaiProvinceName,
  getMapProvinceName,
  getEnglishProvinceName,
} from "@/lib/provinceMapping";

const THAILAND_TOPO_JSON =
  "https://raw.githubusercontent.com/apisit/thailand.json/master/thailand.json";

interface ThailandMapProps {
  selectedProvince?: string;
  selectedProvinces?: string[];
  onProvinceClick: (province: string) => void;
  provinceData?: Record<string, ProvinceData>;
  onProvinceSelectFromMap?: (province: string) => void; // Callback when province is selected from map
}

export function ThailandMap({
  selectedProvince,
  selectedProvinces = [],
  onProvinceClick,
  provinceData,
  onProvinceSelectFromMap,
}: ThailandMapProps) {
  const [position, setPosition] = useState({
    coordinates: [0, 0] as [number, number],
    zoom: 1,
  });

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

  const getProvinceColor = (provinceName: string) => {
    if (!provinceData) {
      return "hsl(0 0% 85%)"; // Lighter gray for better visibility
    }

    // Try to get data by multiple lookup strategies
    const thaiName = getThaiProvinceName(provinceName);
    const thaiKey = `${thaiName}_Thai`;
    const foreignKey = `${thaiName}_Foreign`;
    const englishThaiKey = `${provinceName}_Thai`;
    const englishForeignKey = `${provinceName}_Foreign`;

    let data =
      provinceData[provinceName] ||
      provinceData[thaiName] ||
      provinceData[thaiKey] ||
      provinceData[foreignKey] ||
      provinceData[englishThaiKey] ||
      provinceData[englishForeignKey];

    // If no direct match, try to find any data for this province
    if (!data) {
      const matchingKey = Object.keys(provinceData).find(
        (key) =>
          key.startsWith(`${thaiName}_`) ||
          key.startsWith(`${provinceName}_`) ||
          key === thaiName ||
          key === provinceName
      );
      if (matchingKey) {
        data = provinceData[matchingKey];
      }
    }

    if (!data) {
      return "hsl(0 0% 90%)"; // Lighter gray for better visibility
    }

    const income = data.predicted_income_million_baht;

    // Use darker, more vibrant colors with higher saturation for better visibility
    if (income > 60000) return "hsl(165 100% 25%)";
    if (income > 40000) return "hsl(165 100% 32%)";
    if (income > 20000) return "hsl(165 95% 38%)";
    if (income > 10000) return "hsl(165 80% 48%)";
    return "hsl(165 60% 60%)";
  };

  return (
    <Card className="p-6 bg-card border-border shadow-lg h-full">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">
            Thailand Tourism Forecast Map
          </h2>
          <p className="text-sm text-muted-foreground">
            {/* Hover to preview values. Click provinces to compare (up to 5). Click
            again to deselect. */}
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
                {({ geographies }) =>
                  geographies.map((geo) => {
                    const provinceName = geo.properties.name;
                    // Check if selected (either by English name or Thai name)
                    const thaiName = getThaiProvinceName(provinceName);

                    const isSelected =
                      selectedProvince === provinceName ||
                      selectedProvince === thaiName ||
                      (selectedProvince &&
                        getMapProvinceName(selectedProvince) === provinceName);
                    const isInMultiSelect =
                      selectedProvinces.includes(provinceName) ||
                      selectedProvinces.includes(thaiName) ||
                      selectedProvinces.some(
                        (p) => getMapProvinceName(p) === provinceName
                      );
                    // Try to get data by both English and Thai name
                    // Check for both Thai and Foreign predictions
                    const thaiKey = `${thaiName}_Thai`;
                    const foreignKey = `${thaiName}_Foreign`;
                    const englishThaiKey = `${provinceName}_Thai`;
                    const englishForeignKey = `${provinceName}_Foreign`;

                    // Try multiple lookup strategies - prioritize Thai, then Foreign
                    let data =
                      provinceData?.[thaiKey] ||
                      provinceData?.[foreignKey] ||
                      provinceData?.[englishThaiKey] ||
                      provinceData?.[englishForeignKey] ||
                      provinceData?.[thaiName] ||
                      provinceData?.[provinceName];

                    // If no direct match, try to find any data for this province
                    if (!data && provinceData) {
                      const matchingKey = Object.keys(provinceData).find(
                        (key) =>
                          key.startsWith(`${thaiName}_`) ||
                          key.startsWith(`${provinceName}_`) ||
                          key === thaiName ||
                          key === provinceName
                      );
                      if (matchingKey) {
                        data = provinceData[matchingKey];
                      }
                    }

                    return (
                      <HoverCard key={geo.rsmKey}>
                        <HoverCardTrigger asChild>
                          <Geography
                            geography={geo}
                            onClick={() => {
                              // Convert to Thai name for consistency
                              const thaiName =
                                getThaiProvinceName(provinceName) ||
                                provinceName;
                              onProvinceClick(thaiName);
                              // Also notify parent to update form
                              if (onProvinceSelectFromMap) {
                                onProvinceSelectFromMap(thaiName);
                              }
                            }}
                            style={{
                              default: {
                                fill: getProvinceColor(provinceName),
                                stroke:
                                  isSelected || isInMultiSelect
                                    ? "hsl(142, 71%, 45%)" // Green color
                                    : "hsl(0 0% 40%)", // Darker gray border for better visibility
                                strokeWidth:
                                  isSelected || isInMultiSelect ? 3 : 1.2, // Thicker border
                                outline: "none",
                                transition:
                                  "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
                                opacity:
                                  isSelected || isInMultiSelect ? 1 : 1, // Full opacity
                              },
                              hover: {
                                fill:
                                  isSelected || isInMultiSelect
                                    ? "hsl(142, 71%, 50%)" // Lighter green when selected
                                    : "hsl(var(--primary))",
                                stroke:
                                  isSelected || isInMultiSelect
                                    ? "hsl(142, 71%, 45%)" // Green
                                    : "hsl(var(--primary))",
                                strokeWidth: 2.5,
                                outline: "none",
                                cursor: "pointer",
                                filter: "brightness(1.15) saturate(1.2)",
                                opacity: 1,
                                transition:
                                  "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
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
                            <title>{provinceName}</title>
                          </Geography>
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64 bg-popover border-2 border-primary/20 shadow-xl rounded-lg p-4">
                          <div className="space-y-3">
                            <div className="flex items-center gap-2 pb-2 border-b border-border">
                              <div className="p-1.5 bg-primary/10 rounded-md">
                                <MapPin className="h-4 w-4 text-primary" />
                              </div>
                              <h4 className="font-bold text-lg text-foreground">
                                {getEnglishProvinceName(
                                  data?.provinceThai || thaiName || provinceName
                                )}
                              </h4>
                            </div>
                            {data ? (
                              <div className="space-y-2.5">
                                <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-md border border-primary/10">
                                  <TrendingUp className="h-4 w-4 text-primary flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground">
                                      Revenue
                                    </p>
                                    <p className="text-sm font-bold text-primary">
                                      {data.predicted_income_million_baht.toLocaleString(
                                        "en-US",
                                        { maximumFractionDigits: 0 }
                                      )}{" "}
                                      <span className="text-xs font-normal">
                                        million Baht
                                      </span>
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2 p-2 bg-secondary/5 rounded-md border border-secondary/10">
                                  <Users className="h-4 w-4 text-secondary flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-muted-foreground">
                                      Visitors
                                    </p>
                                    <p className="text-sm font-bold text-secondary">
                                      {(
                                        data.predicted_tourism_amount_people /
                                        1_000_000
                                      ).toLocaleString("en-US", {
                                        minimumFractionDigits: 2,
                                        maximumFractionDigits: 2,
                                      })}{" "}
                                      <span className="text-xs font-normal">
                                        million people
                                      </span>
                                    </p>
                                  </div>
                                </div>
                                {/* Statistics from monthlyHistory if available */}
                                {data.monthlyHistory &&
                                  data.monthlyHistory.length > 0 && (
                                    <div className="pt-2 border-t border-border space-y-1.5">
                                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                        Statistics
                                      </p>
                                      {(() => {
                                        const totalRevenue =
                                          data.monthlyHistory.reduce(
                                            (sum, d) => sum + d.revenue,
                                            0
                                          );
                                        const totalVisitors =
                                          data.monthlyHistory.reduce(
                                            (sum, d) => sum + d.tourists,
                                            0
                                          );
                                        const avgRevenue =
                                          totalRevenue /
                                          data.monthlyHistory.length;
                                        const avgVisitors =
                                          totalVisitors /
                                          data.monthlyHistory.length;
                                        const years = Array.from(
                                          new Set(
                                            data.monthlyHistory.map(
                                              (d) => d.year
                                            )
                                          )
                                        ).sort((a, b) => a - b);

                                        return (
                                          <>
                                            <div className="flex justify-between items-center text-xs">
                                              <span className="text-muted-foreground">
                                                Avg Revenue:
                                              </span>
                                              <span className="font-medium text-foreground">
                                                {avgRevenue.toLocaleString(
                                                  "en-US",
                                                  {
                                                    maximumFractionDigits: 0,
                                                  }
                                                )}{" "}
                                                M Baht
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                              <span className="text-muted-foreground">
                                                Avg Visitors:
                                              </span>
                                              <span className="font-medium text-foreground">
                                                {(
                                                  avgVisitors / 1_000_000
                                                ).toLocaleString("en-US", {
                                                  minimumFractionDigits: 2,
                                                  maximumFractionDigits: 2,
                                                })}{" "}
                                                M people
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                              <span className="text-muted-foreground">
                                                Data Period:
                                              </span>
                                              <span className="font-medium text-foreground">
                                                {years.length > 0
                                                  ? `${years[0]} - ${
                                                      years[years.length - 1]
                                                    }`
                                                  : "N/A"}
                                              </span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                              <span className="text-muted-foreground">
                                                Data Points:
                                              </span>
                                              <span className="font-medium text-foreground">
                                                {data.monthlyHistory.length}
                                              </span>
                                            </div>
                                          </>
                                        );
                                      })()}
                                    </div>
                                  )}
                                {/* Always show basic stats even without monthlyHistory */}
                                {(!data.monthlyHistory ||
                                  data.monthlyHistory.length === 0) && (
                                  <div className="pt-2 border-t border-border space-y-1.5">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                      Quick Stats
                                    </p>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-muted-foreground">
                                        Year:
                                      </span>
                                      <span className="font-medium text-foreground">
                                        {data.year || "N/A"}
                                      </span>
                                    </div>
                                    <div className="flex justify-between items-center text-xs">
                                      <span className="text-muted-foreground">
                                        Type:
                                      </span>
                                      <span className="font-medium text-foreground">
                                        {data.tourism_type || "N/A"}
                                      </span>
                                    </div>
                                    {data.monthlyHistory &&
                                      data.monthlyHistory.length > 0 && (
                                        <div className="flex justify-between items-center text-xs">
                                          <span className="text-muted-foreground">
                                            Months:
                                          </span>
                                          <span className="font-medium text-foreground">
                                            {
                                              new Set(
                                                data.monthlyHistory.map(
                                                  (d) => d.month
                                                )
                                              ).size
                                            }
                                          </span>
                                        </div>
                                      )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <p className="text-sm text-muted-foreground text-center py-2">
                                No prediction data available
                              </p>
                            )}
                          </div>
                        </HoverCardContent>
                      </HoverCard>
                    );
                  })
                }
              </Geographies>
            </ZoomableGroup>
          </ComposableMap>

          {/* Zoom Controls */}
          <div className="absolute top-4 right-4 flex flex-col gap-2">
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 bg-background/90 backdrop-blur-md"
              onClick={handleZoomIn}
              disabled={position.zoom >= 4}
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 bg-background/90 backdrop-blur-md"
              onClick={handleZoomOut}
              disabled={position.zoom <= 1}
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="outline"
              className="h-8 w-8 bg-background/90 backdrop-blur-md"
              onClick={handleReset}
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {/* Tooltip hint */}
          <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-md px-4 py-2 rounded-lg border border-border/50 shadow-lg transition-all duration-300 hover:scale-105">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              <span className="font-medium">
                {selectedProvinces.length > 0
                  ? `Selected: ${selectedProvinces.length} province${
                      selectedProvinces.length > 1 ? "s" : ""
                    }`
                  : selectedProvince
                  ? `Selected: ${selectedProvince}`
                  : "Pick a province on the map"}
              </span>
            </p>
          </div>
        </div>

        {/* Legend */}
        {/* <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-2 group cursor-pointer transition-all duration-200 hover:scale-110">
            <div
              className="w-4 h-4 rounded shadow-sm transition-all duration-200 group-hover:shadow-md"
              style={{ backgroundColor: "hsl(165 100% 25%)" }}
            />
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              &gt; {Number(60000).toLocaleString("en-US")} million Baht
            </span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer transition-all duration-200 hover:scale-110">
            <div
              className="w-4 h-4 rounded shadow-sm transition-all duration-200 group-hover:shadow-md"
              style={{ backgroundColor: "hsl(165 100% 33%)" }}
            />
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              {Number(40000).toLocaleString("en-US")}-
              {Number(60000).toLocaleString("en-US")}
              million Baht
            </span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer transition-all duration-200 hover:scale-110">
            <div
              className="w-4 h-4 rounded shadow-sm transition-all duration-200 group-hover:shadow-md"
              style={{ backgroundColor: "hsl(165 80% 40%)" }}
            />
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              {Number(20000).toLocaleString("en-US")}-
              {Number(40000).toLocaleString("en-US")}
              million Baht
            </span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer transition-all duration-200 hover:scale-110">
            <div
              className="w-4 h-4 rounded shadow-sm transition-all duration-200 group-hover:shadow-md"
              style={{ backgroundColor: "hsl(165 60% 50%)" }}
            />
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              {Number(10000).toLocaleString("en-US")}-
              {Number(20000).toLocaleString("en-US")}
              million Baht
            </span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer transition-all duration-200 hover:scale-110">
            <div
              className="w-4 h-4 rounded shadow-sm transition-all duration-200 group-hover:shadow-md"
              style={{ backgroundColor: "hsl(165 40% 65%)" }}
            />
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">
              &lt; {Number(10000).toLocaleString("en-US")}
              million Baht
            </span>
          </div>
        </div> */}
      </div>
    </Card>
  );
}
