import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { Card } from "@/components/ui/card";
import { ProvinceData } from "@/types/tourism";

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
          <p className="text-sm text-muted-foreground">คลิกที่จังหวัดเพื่อดูรายละเอียด</p>
        </div>
        
        <div className="relative w-full h-[500px] bg-accent/20 rounded-lg overflow-hidden">
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
                          stroke: "hsl(var(--background))",
                          strokeWidth: isSelected ? 2 : 0.5,
                          outline: "none",
                        },
                        hover: {
                          fill: "hsl(var(--primary))",
                          stroke: "hsl(var(--background))",
                          strokeWidth: 2,
                          outline: "none",
                          cursor: "pointer",
                        },
                        pressed: {
                          fill: "hsl(var(--primary))",
                          stroke: "hsl(var(--background))",
                          strokeWidth: 2,
                          outline: "none",
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
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 text-xs">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(165 100% 25%)" }} />
            <span className="text-muted-foreground">&gt;100M</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(165 100% 33%)" }} />
            <span className="text-muted-foreground">75-100M</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(165 80% 40%)" }} />
            <span className="text-muted-foreground">50-75M</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(165 60% 50%)" }} />
            <span className="text-muted-foreground">25-50M</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: "hsl(165 40% 65%)" }} />
            <span className="text-muted-foreground">&lt;25M</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
