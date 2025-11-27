import { useState } from "react";
import { Calendar, MapPin, Users, Sparkles, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { THAI_PROVINCES, FESTIVALS, MONTHS } from "@/data/provinces";
import type { PredictionInput } from "@/types/tourism";

interface PredictionFormProps {
  onPredict: (input: PredictionInput) => void;
  isLoading?: boolean;
}

export function PredictionForm({ onPredict, isLoading }: PredictionFormProps) {
  const [formData, setFormData] = useState<PredictionInput>({
    province: "",
    tourism_type: "Thai",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    high_season: 0,
    festival: null,
  });

  const [selectedFestivals, setSelectedFestivals] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!formData.province) {
      return;
    }
    onPredict({
      ...formData,
      festival: selectedFestivals.length > 0 ? selectedFestivals[0] : null,
    });
  };

  const toggleFestival = (festival: string) => {
    setSelectedFestivals(prev =>
      prev.includes(festival)
        ? prev.filter(f => f !== festival)
        : [...prev, festival]
    );
  };

  return (
    <Card className="p-6 space-y-6 bg-card border-border shadow-lg">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          ตัวควบคุมการทำนาย
        </h2>
        <p className="text-sm text-muted-foreground">ปรับแต่งพารามิเตอร์เพื่อทำนายรายได้</p>
      </div>

      <div className="space-y-4">
        {/* Month/Year */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            เดือน/ปี
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Select
              value={formData.month.toString()}
              onValueChange={(value) => setFormData({ ...formData, month: parseInt(value) })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {MONTHS.map((month) => (
                  <SelectItem key={month.value} value={month.value.toString()}>
                    {month.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={formData.year.toString()}
              onValueChange={(value) => setFormData({ ...formData, year: parseInt(value) })}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {[2024, 2025, 2026, 2027, 2028].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Province */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            จังหวัด
          </Label>
          <Select
            value={formData.province}
            onValueChange={(value) => setFormData({ ...formData, province: value })}
          >
            <SelectTrigger className="bg-background">
              <SelectValue placeholder="เลือกจังหวัด" />
            </SelectTrigger>
            <SelectContent className="bg-popover max-h-[300px]">
              <SelectItem value="all">ทุกจังหวัด</SelectItem>
              {THAI_PROVINCES.map((province) => (
                <SelectItem key={province} value={province}>
                  {province}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* High Season Toggle */}
        <div className="flex items-center justify-between p-4 bg-accent/50 rounded-lg">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-secondary" />
            ช่วงไฮซีซั่น
          </Label>
          <Switch
            checked={formData.high_season === 1}
            onCheckedChange={(checked) => setFormData({ ...formData, high_season: checked ? 1 : 0 })}
            className="data-[state=checked]:bg-secondary"
          />
        </div>

        {/* Tourism Type */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            ประเภทนักท่องเที่ยว
          </Label>
          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant={formData.tourism_type === "Thai" ? "default" : "outline"}
              onClick={() => setFormData({ ...formData, tourism_type: "Thai" })}
              className="w-full"
            >
              ไทย
            </Button>
            <Button
              type="button"
              variant={formData.tourism_type === "Foreign" ? "default" : "outline"}
              onClick={() => setFormData({ ...formData, tourism_type: "Foreign" })}
              className="w-full"
            >
              ต่างชาติ
            </Button>
          </div>
        </div>

        {/* Festivals */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">เทศกาล</Label>
          <div className="flex flex-wrap gap-2 p-3 bg-accent/30 rounded-lg min-h-[60px]">
            {FESTIVALS.slice(0, 6).map((festival) => (
              <Badge
                key={festival.value}
                variant={selectedFestivals.includes(festival.value) ? "default" : "outline"}
                className="cursor-pointer hover:scale-105 transition-transform"
                onClick={() => toggleFestival(festival.value)}
              >
                {festival.label}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={isLoading || !formData.province}
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-md"
      >
        {isLoading ? "กำลังทำนาย..." : "RUN PREDICTION"}
      </Button>
    </Card>
  );
}
