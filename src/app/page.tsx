"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Calendar } from "lucide-react";

import { PredictionForm } from "@/components/dashboard/PredictionForm";
import { ProvinceDetails } from "@/components/dashboard/ProvinceDetails";
import { ThailandMap } from "@/components/dashboard/ThailandMap";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useToast } from "@/hooks/use-toast";
import { predict } from "@/lib/predictionService";
import {
  getMapProvinceName,
  getThaiProvinceName,
} from "@/lib/provinceMapping";
import type {
  PredictionInput,
  PredictionResult,
  ProvinceData,
} from "@/types/tourism";

export default function HomePage() {
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [provinceData, setProvinceData] = useState<
    Record<string, ProvinceData>
  >({});
  const [currentPrediction, setCurrentPrediction] = useState<
    ProvinceData | undefined
  >(undefined);
  const { toast } = useToast();


  const predictMutation = useMutation<PredictionResult, Error, PredictionInput>(
    {
      mutationFn: predict,
      onSuccess: async (data, variables) => {
        // Get festivals for this province and month from dataset
        const { loadTourismData } = await import("@/lib/tourismDataLoader");
        const { getFestivalsForProvinceAndMonth } = await import(
          "@/lib/festivalDetector"
        );
        const tourismData = await loadTourismData();
        const detectedFestivals = getFestivalsForProvinceAndMonth(
          tourismData,
          data.province,
          variables.month
        );

        // Convert festivals to FestivalImpact format
        const festivalImpact = detectedFestivals.map((festival) => ({
          festival,
          impact: 0, // We don't have impact data, just show the festival
          revenue: 0, // We don't have impact data, just show the festival
        }));

        const newData: ProvinceData = {
          ...data,
          provinceThai: data.province,
          tourism_type: variables.tourism_type,
          trends: [
            {
              year: data.year,
              revenue: data.predicted_income_million_baht,
              tourists: data.predicted_tourism_amount_people,
            },
          ],
          festivalImpact: festivalImpact,
          monthlyHistory: [
            {
              year: data.year,
              month: variables.month,
              revenue: data.predicted_income_million_baht,
              tourists: data.predicted_tourism_amount_people,
              isPredicted: true, // Mark as predicted data
              tourism_type: variables.tourism_type, // Add tourism_type to predicted data
            },
          ],
        };

        // Store by province + tourism_type key
        const key = `${data.province}_${variables.tourism_type}`;
        setProvinceData((prev) => {
          // Use functional update to ensure we always have the latest state
          const existing = prev[key];

          // Merge monthlyHistory: keep existing months and add/update new month
          // Ensure we preserve all existing data points
          const existingMonthlyHistory = existing?.monthlyHistory ? [...existing.monthlyHistory] : [];
          const newMonthData = {
            year: data.year,
            month: variables.month,
            revenue: data.predicted_income_million_baht,
            tourists: data.predicted_tourism_amount_people,
            isPredicted: true,
            tourism_type: variables.tourism_type,
          };

          // Check if this month already exists in history (same year, month, and tourism_type)
          const monthIndex = existingMonthlyHistory.findIndex(
            (d) =>
              d.year === data.year &&
              d.month === variables.month &&
              d.tourism_type === variables.tourism_type
          );

          let mergedMonthlyHistory: typeof existingMonthlyHistory;
          if (monthIndex >= 0) {
            // Update existing month - preserve all other months
            mergedMonthlyHistory = [...existingMonthlyHistory];
            mergedMonthlyHistory[monthIndex] = newMonthData;
          } else {
            // Add new month - preserve all existing months
            mergedMonthlyHistory = [
              ...existingMonthlyHistory,
              newMonthData,
            ].sort((a, b) => {
              if (a.year !== b.year) return a.year - b.year;
              if (a.month !== b.month) return a.month - b.month;
              // If same year/month, prioritize by tourism_type
              if (a.tourism_type === "Thai" && b.tourism_type === "Foreign") return -1;
              if (a.tourism_type === "Foreign" && b.tourism_type === "Thai") return 1;
              return 0;
            });
          }

          // Merge festivalImpact: combine existing and new
          const existingFestivalImpact = existing?.festivalImpact || [];
          const mergedFestivalImpact = [...existingFestivalImpact];
          festivalImpact.forEach((newFestival) => {
            if (
              !mergedFestivalImpact.find(
                (f) => f.festival === newFestival.festival
              )
            ) {
              mergedFestivalImpact.push(newFestival);
            }
          });

          const updatedData: ProvinceData = {
            ...newData,
            // Ensure monthlyHistory is properly set with all months
            monthlyHistory: mergedMonthlyHistory.length > 0 ? mergedMonthlyHistory : newData.monthlyHistory,
            festivalImpact: mergedFestivalImpact,
            // Keep existing trends or use new
            trends: existing?.trends || newData.trends,
          };
          
          const updated = { ...prev, [key]: updatedData };

          // Link Thai and Foreign data if both exist
          const thaiKey = `${data.province}_Thai`;
          const foreignKey = `${data.province}_Foreign`;

          if (updated[thaiKey] && updated[foreignKey]) {
            updated[thaiKey].thaiData = updated[thaiKey];
            updated[thaiKey].foreignData = updated[foreignKey];
            updated[foreignKey].thaiData = updated[thaiKey];
            updated[foreignKey].foreignData = updated[foreignKey];
          }

          // Update currentPrediction immediately with updated data
          setSelectedProvince(data.province);

          // Show the latest prediction (or combined if both exist)
          if (updated[thaiKey] && updated[foreignKey]) {
            // If both exist, combine monthlyHistory from both
            // Ensure all data points have tourism_type
            const thaiHistory = (updated[thaiKey].monthlyHistory || []).map((d) => ({
              ...d,
              tourism_type: d.tourism_type || "Thai",
            }));
            const foreignHistory = (updated[foreignKey].monthlyHistory || []).map((d) => ({
              ...d,
              tourism_type: d.tourism_type || "Foreign",
            }));
            
            const combinedMonthlyHistory = [
              ...thaiHistory,
              ...foreignHistory,
            ].sort((a, b) => {
              if (a.year !== b.year) return a.year - b.year;
              if (a.month !== b.month) return a.month - b.month;
              // If same year/month, prioritize Thai first
              if (a.tourism_type === "Thai" && b.tourism_type === "Foreign")
                return -1;
              if (a.tourism_type === "Foreign" && b.tourism_type === "Thai")
                return 1;
              return 0;
            });

            // Create combined prediction with both monthly histories and link thaiData/foreignData
            // Calculate aggregated values from monthlyHistory instead of using thaiData values
            const thaiPredictedData = combinedMonthlyHistory.filter(
              (d) => d.tourism_type === "Thai" && d.isPredicted
            );
            const foreignPredictedData = combinedMonthlyHistory.filter(
              (d) => d.tourism_type === "Foreign" && d.isPredicted
            );

            const totalThaiRevenue = thaiPredictedData.reduce(
              (sum, d) => sum + d.revenue,
              0
            );
            const totalThaiVisitors = thaiPredictedData.reduce(
              (sum, d) => sum + d.tourists,
              0
            );
            const totalForeignRevenue = foreignPredictedData.reduce(
              (sum, d) => sum + d.revenue,
              0
            );
            const totalForeignVisitors = foreignPredictedData.reduce(
              (sum, d) => sum + d.tourists,
              0
            );

            const combinedPrediction: ProvinceData = {
              province: updated[thaiKey].province,
              provinceThai: updated[thaiKey].provinceThai,
              year: updated[thaiKey].year,
              // Use combined totals (revenue is already in million baht)
              predicted_income_million_baht:
                totalThaiRevenue + totalForeignRevenue > 0
                  ? totalThaiRevenue + totalForeignRevenue
                  : updated[thaiKey].predicted_income_million_baht,
              predicted_tourism_amount_people:
                totalThaiVisitors + totalForeignVisitors > 0
                  ? totalThaiVisitors + totalForeignVisitors
                  : updated[thaiKey].predicted_tourism_amount_people,
              monthlyHistory: combinedMonthlyHistory,
              thaiData: updated[thaiKey],
              foreignData: updated[foreignKey],
              trends: updated[thaiKey].trends,
              festivalImpact: updated[thaiKey].festivalImpact,
            };
            setCurrentPrediction(combinedPrediction);
          } else {
            setCurrentPrediction(updatedData);
          }

          // Scroll to ProvinceDetails after state update
          setTimeout(() => {
            const provinceDetailsElement =
              document.getElementById("province-details");
            if (provinceDetailsElement) {
              provinceDetailsElement.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }
          }, 300);

          return updated;
        });

        toast({
          title: "Prediction ready",
          description:
            data.source === "api"
              ? `Live model prediction for ${data.province} (${variables.tourism_type}).`
              : `Precomputed model output for ${data.province} (${variables.tourism_type}).`,
        });
      },
      onError: (error) => {
        toast({
          title: "Prediction failed",
          description:
            error instanceof Error
              ? error.message
              : "Unable to run the prediction. Please try again.",
          variant: "destructive",
        });
      },
    }
  );

  const handlePredict = async (input: PredictionInput) => {
    // Run prediction without festival comparison
    predictMutation.mutate(input);
    // Scroll will be handled in onSuccess callback
  };

  const handleProvinceInteraction = (province: string) => {
    // Province comes from form (Thai name) or map (English name)
    // Always convert to Thai name for consistency
    const thaiName = getThaiProvinceName(province) || province;

    // Toggle selection: if clicking the same province, unselect it
    if (selectedProvince === thaiName) {
      setSelectedProvince("");
      setCurrentPrediction(undefined);
      return;
    }

    setSelectedProvince(thaiName);

    // Try to find data - check for both Thai and Foreign
    // Priority: Thai > Foreign > direct name match
    const thaiKey = `${thaiName}_Thai`;
    const foreignKey = `${thaiName}_Foreign`;

    // Also try with original province name (in case it's already Thai)
    const originalThaiKey = `${province}_Thai`;
    const originalForeignKey = `${province}_Foreign`;

    // Try multiple lookup strategies - prioritize combined data if both Thai and Foreign exist
    const thaiData = provinceData[thaiKey] || provinceData[originalThaiKey];
    const foreignData =
      provinceData[foreignKey] || provinceData[originalForeignKey];

    // If both Thai and Foreign data exist, create combined prediction
    if (thaiData && foreignData) {
      const combinedMonthlyHistory = [
        ...(thaiData.monthlyHistory || []),
        ...(foreignData.monthlyHistory || []),
      ].sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        if (a.month !== b.month) return a.month - b.month;
        // If same year/month, prioritize Thai first
        if (a.tourism_type === "Thai" && b.tourism_type === "Foreign")
          return -1;
        if (a.tourism_type === "Foreign" && b.tourism_type === "Thai") return 1;
        return 0;
      });

      // Calculate aggregated values from monthlyHistory
      const thaiPredictedData = combinedMonthlyHistory.filter(
        (d) => d.tourism_type === "Thai" && d.isPredicted
      );
      const foreignPredictedData = combinedMonthlyHistory.filter(
        (d) => d.tourism_type === "Foreign" && d.isPredicted
      );

          const totalThaiRevenue = thaiPredictedData.reduce(
            (sum, d) => sum + d.revenue,
            0
          );
          const totalThaiVisitors = thaiPredictedData.reduce(
            (sum, d) => sum + d.tourists,
            0
          );
          const totalForeignRevenue = foreignPredictedData.reduce(
            (sum, d) => sum + d.revenue,
            0
          );
          const totalForeignVisitors = foreignPredictedData.reduce(
            (sum, d) => sum + d.tourists,
            0
          );

      const combinedPrediction: ProvinceData = {
            province: thaiData.province,
            provinceThai: thaiData.provinceThai,
            year: thaiData.year,
            // Use combined totals (revenue is already in million baht)
            predicted_income_million_baht:
              totalThaiRevenue + totalForeignRevenue > 0
                ? totalThaiRevenue + totalForeignRevenue
                : thaiData.predicted_income_million_baht,
            predicted_tourism_amount_people:
              totalThaiVisitors + totalForeignVisitors > 0
                ? totalThaiVisitors + totalForeignVisitors
                : thaiData.predicted_tourism_amount_people,
        monthlyHistory: combinedMonthlyHistory,
        thaiData: thaiData,
        foreignData: foreignData,
        trends: thaiData.trends,
        festivalImpact: thaiData.festivalImpact,
      };
      setCurrentPrediction(combinedPrediction);
    } else if (thaiData) {
      setCurrentPrediction(thaiData);
    } else if (foreignData) {
      setCurrentPrediction(foreignData);
    } else if (provinceData[thaiName]) {
      setCurrentPrediction(provinceData[thaiName]);
    } else if (provinceData[province]) {
      setCurrentPrediction(provinceData[province]);
    } else {
      // Try to find by converting name
      const mapName = getMapProvinceName(province);
      if (mapName && mapName !== province) {
        const mapThaiKey = `${mapName}_Thai`;
        const mapForeignKey = `${mapName}_Foreign`;
        const mapThaiData = provinceData[mapThaiKey];
        const mapForeignData = provinceData[mapForeignKey];

        // If both exist, combine them
        if (mapThaiData && mapForeignData) {
          const combinedMonthlyHistory = [
            ...(mapThaiData.monthlyHistory || []),
            ...(mapForeignData.monthlyHistory || []),
          ].sort((a, b) => {
            if (a.year !== b.year) return a.year - b.year;
            if (a.month !== b.month) return a.month - b.month;
            if (a.tourism_type === "Thai" && b.tourism_type === "Foreign")
              return -1;
            if (a.tourism_type === "Foreign" && b.tourism_type === "Thai")
              return 1;
            return 0;
          });

          // Calculate aggregated values from monthlyHistory
          const thaiPredictedData = combinedMonthlyHistory.filter(
            (d) => d.tourism_type === "Thai" && d.isPredicted
          );
          const foreignPredictedData = combinedMonthlyHistory.filter(
            (d) => d.tourism_type === "Foreign" && d.isPredicted
          );

          const totalThaiRevenue = thaiPredictedData.reduce(
            (sum, d) => sum + d.revenue,
            0
          );
          const totalThaiVisitors = thaiPredictedData.reduce(
            (sum, d) => sum + d.tourists,
            0
          );
          const totalForeignRevenue = foreignPredictedData.reduce(
            (sum, d) => sum + d.revenue,
            0
          );
          const totalForeignVisitors = foreignPredictedData.reduce(
            (sum, d) => sum + d.tourists,
            0
          );

          const combinedPrediction: ProvinceData = {
            province: mapThaiData.province,
            provinceThai: mapThaiData.provinceThai,
            year: mapThaiData.year,
            // Use combined totals (revenue is already in million baht)
            predicted_income_million_baht:
              totalThaiRevenue + totalForeignRevenue > 0
                ? totalThaiRevenue + totalForeignRevenue
                : mapThaiData.predicted_income_million_baht,
            predicted_tourism_amount_people:
              totalThaiVisitors + totalForeignVisitors > 0
                ? totalThaiVisitors + totalForeignVisitors
                : mapThaiData.predicted_tourism_amount_people,
            monthlyHistory: combinedMonthlyHistory,
            thaiData: mapThaiData,
            foreignData: mapForeignData,
            trends: mapThaiData.trends,
            festivalImpact: mapThaiData.festivalImpact,
          };
          setCurrentPrediction(combinedPrediction);
        } else if (mapThaiData) {
          setCurrentPrediction(mapThaiData);
        } else if (mapForeignData) {
          setCurrentPrediction(mapForeignData);
        } else if (provinceData[mapName]) {
          setCurrentPrediction(provinceData[mapName]);
        }
      }
    }
  };

  const handleProvinceSelectFromMap = (province: string) => {
    // Convert English name from map to Thai name for form
    const thaiName = getThaiProvinceName(province) || province;

    // Toggle selection: if clicking the same province, unselect it
    if (selectedProvince === thaiName) {
      setSelectedProvince("");
      setCurrentPrediction(undefined);
      return;
    }

    setSelectedProvince(thaiName);
    // Data loading will be handled by handleProvinceInteraction
  };

  return (
    <>
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="flex h-16 items-center gap-4 px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-3 flex-1">
            
            

            <h1 className="text-xl font-bold text-foreground">
              Tourism Insight AI — Prediction
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

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-12 gap-8">
          {/* Left: Prediction Form */}
          <div className="col-span-12 md:col-span-4">
            <PredictionForm
              onPredict={handlePredict}
              isLoading={predictMutation.isPending}
              onProvinceSelect={handleProvinceInteraction}
              selectedProvince={selectedProvince}
            />
          </div>
          {/* Right: Map - Larger */}
          <div className="col-span-12 md:col-span-8">
            <ThailandMap
              selectedProvince={selectedProvince}
              onProvinceClick={handleProvinceInteraction}
              onProvinceSelectFromMap={handleProvinceSelectFromMap}
              provinceData={provinceData}
            />
          </div>
          {/* ProvinceDetails at Bottom - Only show when province is selected */}
          {currentPrediction && (
            <div
              id="province-details"
              className="col-span-12 flex flex-col items-stretch gap-4 mt-8"
            >
              <ProvinceDetails
                province={currentPrediction}
                comparisonMode={!!currentPrediction}
              />
            </div>
          )}
        </div>
      </main>
    </>
  );
}
