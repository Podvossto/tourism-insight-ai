"use client";
import { useEffect, useState } from "react";
import { Calendar } from "lucide-react";
import { TIDLogo } from "@/components/layout/TIDLogo";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { ThailandMap } from "@/components/dashboard/ThailandMap";
import { StatsInsights } from "@/components/dashboard/StatsInsights";
import { StatsProvinceDetails } from "@/components/dashboard/StatsProvinceDetails";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { loadHistoricalData } from "@/lib/csvLoader";
import { getThaiProvinceName } from "@/lib/provinceMapping";
import type { ProvinceData } from "@/types/tourism";

export default function StatsPage() {
  const [provinceData, setProvinceData] = useState<
    Record<string, ProvinceData>
  >({});
  const [selectedProvinceThai, setSelectedProvinceThai] = useState<string>("");

  useEffect(() => {
    loadHistoricalData().then((data) => {
      setProvinceData(data);
    });
  }, []);

  const handleProvinceClick = (province: string) => {
    // Province might be English name from map or Thai name from insights
    const thaiName = getThaiProvinceName(province) || province;
    setSelectedProvinceThai(thaiName);
  };

  return (
    <>
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="flex h-16 items-center gap-4 px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-3 flex-1">
            <TIDLogo size="sm" showText={false} />
            <h1 className="text-xl font-bold text-foreground">
              Tourism Insight AI — Statistics & Insights
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
      <main className="container mx-auto px-2 sm:px-4 py-8 space-y-8">
        <SummaryCards data={provinceData} />

        {/* Map and Details Section */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 flex min-w-0">
            <div className="flex-1 w-full min-h-[440px]">
              <ThailandMap
                selectedProvince={selectedProvinceThai}
                onProvinceClick={handleProvinceClick}
                provinceData={provinceData}
              />
            </div>
          </div>
          <div className="lg:col-span-7 flex min-w-0">
            <div className="flex-1 w-full">
              <StatsProvinceDetails provinceThai={selectedProvinceThai} />
            </div>
          </div>
        </div>

        {/* Historical Statistics Section - Moved below map */}
        <StatsInsights onProvinceClick={handleProvinceClick} />
      </main>
    </>
  );
}
