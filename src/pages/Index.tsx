import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Brain, Calendar } from "lucide-react";
import { PredictionForm } from "@/components/dashboard/PredictionForm";
import { ThailandMap } from "@/components/dashboard/ThailandMap";
import { SummaryCards } from "@/components/dashboard/SummaryCards";
import { ProvinceDetails } from "@/components/dashboard/ProvinceDetails";
import { useToast } from "@/hooks/use-toast";
import { loadHistoricalData } from "@/utils/csvLoader";
import type { PredictionInput, PredictionResult, ProvinceData } from "@/types/tourism";

const Index = () => {
  const [selectedProvince, setSelectedProvince] = useState<string>("");
  const [provinceData, setProvinceData] = useState<Record<string, ProvinceData>>({});
  const [currentPrediction, setCurrentPrediction] = useState<ProvinceData | undefined>();
  const [isLoadingData, setIsLoadingData] = useState(true);
  const { toast } = useToast();

  // Load historical data on mount
  useEffect(() => {
    loadHistoricalData().then((data) => {
      setProvinceData(data);
      setIsLoadingData(false);
    });
  }, []);

  // Mock API call - replace with actual API endpoint
  const predictMutation = useMutation({
    mutationFn: async (input: PredictionInput): Promise<PredictionResult> => {
      // TODO: Replace with actual API call to your FastAPI backend
      // const response = await fetch('YOUR_API_ENDPOINT/predict/', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(input),
      // });
      // return response.json();

      // Mock response for now
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      return {
        province: input.province,
        year: input.year,
        predicted_income_million_baht: Math.random() * 100 + 50,
        predicted_tourism_amount_people: Math.random() * 2000000 + 1000000,
      };
    },
    onSuccess: (data) => {
      const newData: ProvinceData = {
        ...data,
        provinceThai: data.province,
        trends: [
          { year: 2020, revenue: 5000, tourists: 3.5 },
          { year: 2021, revenue: 5500, tourists: 4.2 },
          { year: 2022, revenue: 6200, tourists: 5.8 },
          { year: 2023, revenue: 6800, tourists: 7.0 },
          { year: 2024, revenue: 7200, tourists: 7.8 },
          { year: data.year, revenue: data.predicted_income_million_baht * 1000, tourists: data.predicted_tourism_amount_people / 1000000 },
        ],
        festivalImpact: [
          { festival: "ปกติ", impact: 1, revenue: data.predicted_income_million_baht * 0.7 },
          { festival: "สงกรานต์", impact: 1.5, revenue: data.predicted_income_million_baht * 1.1 },
          { festival: "เทศกาลดอกไม้", impact: 1.2, revenue: data.predicted_income_million_baht * 0.85 },
        ],
      };

      setProvinceData(prev => ({
        ...prev,
        [data.province]: newData,
      }));
      
      setSelectedProvince(data.province);
      setCurrentPrediction(newData);

      toast({
        title: "การทำนายสำเร็จ",
        description: `ได้รับผลการทำนายสำหรับ ${data.province} แล้ว`,
      });
    },
    onError: (error) => {
      toast({
        title: "เกิดข้อผิดพลาด",
        description: "ไม่สามารถทำนายข้อมูลได้ กรุณาลองใหม่อีกครั้ง",
        variant: "destructive",
      });
      console.error("Prediction error:", error);
    },
  });

  const handlePredict = (input: PredictionInput) => {
    predictMutation.mutate(input);
  };

  const handleProvinceClick = (province: string) => {
    setSelectedProvince(province);
    if (provinceData[province]) {
      setCurrentPrediction(provinceData[province]);
    }
  };

  const handleProvinceSelect = (province: string) => {
    setSelectedProvince(province);
    if (provinceData[province]) {
      setCurrentPrediction(provinceData[province]);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Brain className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Tourism Predictor AI</h1>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>27 พฤศจิกายน 2025</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Left Sidebar - Prediction Form */}
          <div className="col-span-12 lg:col-span-3">
            <PredictionForm 
              onPredict={handlePredict}
              isLoading={predictMutation.isPending}
              onProvinceSelect={handleProvinceSelect}
            />
          </div>

          {/* Center - Map */}
          <div className="col-span-12 lg:col-span-6">
            <ThailandMap
              selectedProvince={selectedProvince}
              onProvinceClick={handleProvinceClick}
              provinceData={provinceData}
            />
          </div>

          {/* Right Sidebar - Summary */}
          <div className="col-span-12 lg:col-span-3">
            <SummaryCards data={provinceData} />
          </div>

          {/* Bottom - Province Details */}
          <div className="col-span-12">
            <ProvinceDetails province={currentPrediction} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
