import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { Card } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ProvinceData } from "@/types/tourism";
import { TrendingUp, Users } from "lucide-react";

const THAILAND_TOPO_JSON = "https://raw.githubusercontent.com/apisit/thailand.json/master/thailand.json";

interface ThailandMapProps {
  selectedProvince?: string;
  onProvinceClick: (province: string) => void;
  provinceData?: Record<string, ProvinceData>;
}

export function ThailandMap({ selectedProvince, onProvinceClick, provinceData }: ThailandMapProps) {
  const getProvinceColor = (provinceName: string) => {
    if (!provinceData || !provinceData[provinceName]) {
      return "hsl(var(--muted))";
    }

    const income = provinceData[provinceName].predicted_income_million_baht;
    
    if (income > 100) return "hsl(165 100% 25%)";
    if (income > 75) return "hsl(165 100% 33%)";
    if (income > 50) return "hsl(165 80% 40%)";
    if (income > 25) return "hsl(165 60% 50%)";
    return "hsl(165 40% 65%)";
  };

  return (
    <Card className="p-6 bg-card border-border shadow-lg h-full">
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Thailand Tourism Forecast Map</h2>
          <p className="text-sm text-muted-foreground">เลื่อนเมาส์เพื่อดูข้อมูล • คลิกที่จังหวัดเพื่อดูรายละเอียดเพิ่มเติม</p>
        </div>
        
        <div className="relative w-full h-[500px] bg-accent/20 rounded-lg overflow-hidden border border-border/50 shadow-inner transition-all duration-300 hover:shadow-lg">
          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 2000,
              center: [100.5, 13.7]
            }}
            className="w-full h-full"
          >
            <Geographies geography={THAILAND_TOPO_JSON}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const provinceName = geo.properties.name;
                  const isSelected = selectedProvince === provinceName;
                  const data = provinceData?.[provinceName];

                  return (
                     <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      onClick={() => onProvinceClick(provinceName)}
                      style={{
                        default: {
                          fill: getProvinceColor(provinceName),
                          stroke: isSelected ? "hsl(var(--primary))" : "hsl(var(--border))",
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
                      {data && (
                        <title>
                          {provinceName}
                          {"\n"}รายได้: ฿{data.predicted_income_million_baht.toFixed(2)} ล้านบาท
                          {"\n"}นักท่องเที่ยว: {(data.predicted_tourism_amount_people / 1000000).toFixed(2)} ล้านคน
                        </title>
                      )}
                    </Geography>
                  );
                })
              }
            </Geographies>
          </ComposableMap>
          
          {/* Tooltip hint */}
          <div className="absolute bottom-4 left-4 bg-background/90 backdrop-blur-md px-4 py-2 rounded-lg border border-border/50 shadow-lg transition-all duration-300 hover:scale-105">
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse shadow-[0_0_8px_rgba(var(--primary),0.5)]" />
              <span className="font-medium">
                {selectedProvince ? `เลือก: ${selectedProvince}` : "เลือกจังหวัดบนแผนที่"}
              </span>
            </p>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs flex-wrap">
          <div className="flex items-center gap-2 group cursor-pointer transition-all duration-200 hover:scale-110">
            <div className="w-4 h-4 rounded shadow-sm transition-all duration-200 group-hover:shadow-md" style={{ backgroundColor: "hsl(165 100% 25%)" }} />
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">&gt;100M</span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer transition-all duration-200 hover:scale-110">
            <div className="w-4 h-4 rounded shadow-sm transition-all duration-200 group-hover:shadow-md" style={{ backgroundColor: "hsl(165 100% 33%)" }} />
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">75-100M</span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer transition-all duration-200 hover:scale-110">
            <div className="w-4 h-4 rounded shadow-sm transition-all duration-200 group-hover:shadow-md" style={{ backgroundColor: "hsl(165 80% 40%)" }} />
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">50-75M</span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer transition-all duration-200 hover:scale-110">
            <div className="w-4 h-4 rounded shadow-sm transition-all duration-200 group-hover:shadow-md" style={{ backgroundColor: "hsl(165 60% 50%)" }} />
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">25-50M</span>
          </div>
          <div className="flex items-center gap-2 group cursor-pointer transition-all duration-200 hover:scale-110">
            <div className="w-4 h-4 rounded shadow-sm transition-all duration-200 group-hover:shadow-md" style={{ backgroundColor: "hsl(165 40% 65%)" }} />
            <span className="text-muted-foreground group-hover:text-foreground transition-colors">&lt;25M</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
