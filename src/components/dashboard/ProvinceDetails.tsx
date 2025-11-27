import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendChart } from "./charts/TrendChart";
import { FestivalImpactChart } from "./charts/FestivalImpactChart";
import { MapPin, TrendingUp, Users, Calendar } from "lucide-react";
import type { ProvinceData } from "@/types/tourism";

interface ProvinceDetailsProps {
  province?: ProvinceData;
}

export function ProvinceDetails({ province }: ProvinceDetailsProps) {
  const [activeTab, setActiveTab] = useState("overview");

  if (!province) {
    return (
      <Card className="p-8 bg-card border-border shadow-lg">
        <div className="text-center text-muted-foreground">
          <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>เลือกจังหวัดจากแผนที่เพื่อดูรายละเอียด</p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 bg-card border-border shadow-lg">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-foreground">
            Province Detail: {province.provinceThai || province.province}
          </h2>
          <button className="text-muted-foreground hover:text-foreground transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </button>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-muted">
            <TabsTrigger value="overview">ภาพรวม</TabsTrigger>
            <TabsTrigger value="trends">แนวโน้มย้อนหลัง</TabsTrigger>
            <TabsTrigger value="festivals">ผลกระทบเทศกาล</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6 mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-primary/20 rounded-lg">
                      <TrendingUp className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">รายได้ที่คาดการณ์</p>
                      <p className="text-2xl font-bold text-primary">
                        ฿{province.predicted_income_million_baht.toFixed(2)}M
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-secondary/10 to-secondary/5 border-secondary/20">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-secondary/20 rounded-lg">
                      <Users className="h-6 w-6 text-secondary" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">นักท่องเที่ยว</p>
                      <p className="text-2xl font-bold text-secondary">
                        {(province.predicted_tourism_amount_people / 1000000).toFixed(2)}M
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-accent to-accent/50 border-border">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-background/50 rounded-lg">
                      <Calendar className="h-6 w-6 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">ปี</p>
                      <p className="text-2xl font-bold text-foreground">{province.year}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="bg-muted/50 border-border">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-4 text-foreground">สรุปข้อมูลจังหวัด</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">จังหวัด:</span>
                    <span className="font-medium text-foreground">{province.provinceThai || province.province}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">รายได้ต่อนักท่องเที่ยว:</span>
                    <span className="font-medium text-foreground">
                      ฿{((province.predicted_income_million_baht * 1000000) / province.predicted_tourism_amount_people).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">สถานะ:</span>
                    <span className="font-medium text-success">คาดการณ์ล่าสุด</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="trends" className="mt-6">
            <TrendChart data={province.trends} />
          </TabsContent>

          <TabsContent value="festivals" className="space-y-6 mt-6">
            <FestivalImpactChart data={province.festivalImpact} />
            <Card className="bg-accent/50 border-border">
              <CardContent className="pt-6">
                <h3 className="font-semibold mb-3 text-foreground">คำแนะนำ</h3>
                <p className="text-sm text-muted-foreground">
                  เทศกาลสงกรานต์และเทศกาลดอกไม้มีผลกระทบสูงสุดต่อรายได้การท่องเที่ยวในจังหวัดนี้
                  แนะนำให้เพิ่มกิจกรรมและโปรโมชั่นในช่วงเทศกาลเหล่านี้
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Card>
  );
}
