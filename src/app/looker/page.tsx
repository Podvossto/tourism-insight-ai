"use client";

import { useState } from "react";
import { Eye, ExternalLink, Settings, Calendar } from "lucide-react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

/**
 * Google Looker Studio Dashboard Embedding Guide:
 * 
 * วิธีฝัง Google Looker Studio Dashboard:
 * 
 * 1. วิธีที่ 1: ใช้ Embed URL (แนะนำ)
 *    - ไปที่ Google Looker Studio Dashboard ที่ต้องการ
 *    - คลิก Share (ปุ่ม Share ด้านบนขวา)
 *    - เลือก "Embed report"
 *    - คัดลอก Embed URL
 *    - วาง URL ในช่องด้านล่าง
 * 
 * ตัวอย่าง Embed URL format:
 * https://lookerstudio.google.com/embed/reporting/{report_id}/page/{page_id}
 * 
 * สำหรับ Production:
 * - ตรวจสอบว่า Dashboard ตั้งค่าเป็น "Anyone with the link can view"
 * - หรือใช้ Google OAuth สำหรับการเข้าถึงแบบ private
 */

export default function LookerPage() {
  // Default Google Looker Studio URL
  const defaultLookerUrl = 
    process.env.NEXT_PUBLIC_LOOKER_STUDIO_URL || 
    "https://lookerstudio.google.com/embed/reporting/adb49c7a-da5e-48e9-adcc-93308c073ffc/page/p_019src7gyd";
  
  const [embedUrl, setEmbedUrl] = useState<string>(defaultLookerUrl);
  const [isConfigured, setIsConfigured] = useState<boolean>(!!defaultLookerUrl);

  const handleEmbed = () => {
    if (embedUrl.trim()) {
      setIsConfigured(true);
    }
  };

  const handleReset = () => {
    setEmbedUrl("");
    setIsConfigured(false);
  };

  return (
    <>
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="flex h-16 items-center gap-4 px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Tourism Insight AI — Looker Studio
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

        {!isConfigured ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                ตั้งค่า Google Looker Studio Dashboard
              </CardTitle>
              <CardDescription>
                กรุณาใส่ Embed URL จาก Google Looker Studio Dashboard ที่ต้องการแสดง
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="embed-url">Google Looker Studio Embed URL</Label>
                <Input
                  id="embed-url"
                  placeholder="https://lookerstudio.google.com/embed/reporting/..."
                  value={embedUrl}
                  onChange={(e) => setEmbedUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleEmbed();
                    }
                  }}
                />
                <p className="text-sm text-muted-foreground">
                  คัดลอก Embed URL จาก Google Looker Studio (Share → Embed report)
                </p>
              </div>

              {defaultLookerUrl && embedUrl !== defaultLookerUrl && (
                <Alert>
                  <Eye className="h-4 w-4" />
                  <AlertTitle>Default Dashboard</AlertTitle>
                  <AlertDescription>
                    <span>มี Dashboard ที่ตั้งค่าไว้แล้ว</span>
                    <Button
                      variant="link"
                      className="p-0 h-auto ml-2"
                      onClick={() => {
                        setEmbedUrl(defaultLookerUrl);
                        setIsConfigured(true);
                      }}
                    >
                      ใช้ Dashboard นี้
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex gap-2">
                <Button onClick={handleEmbed} disabled={!embedUrl.trim()}>
                  <Eye className="mr-2 h-4 w-4" />
                  แสดง Dashboard
                </Button>
              </div>

              <Alert>
                <AlertTitle>คำแนะนำ</AlertTitle>
                <AlertDescription className="space-y-2">
                  <p>
                    <strong>วิธีหา Embed URL จาก Google Looker Studio:</strong>
                  </p>
                  <ol className="list-decimal list-inside space-y-1 ml-2">
                    <li>เปิด Google Looker Studio Dashboard ที่ต้องการ</li>
                    <li>คลิกปุ่ม <strong>Share</strong> (ด้านบนขวา)</li>
                    <li>เลือก <strong>&quot;Embed report&quot;</strong></li>
                    <li>คัดลอก Embed URL ที่แสดง</li>
                    <li>วาง URL ในช่องด้านบน</li>
                  </ol>
                  <p className="mt-2">
                    <strong>หมายเหตุ:</strong> ตรวจสอบว่า Dashboard ตั้งค่าเป็น 
                    &quot;Anyone with the link can view&quot; เพื่อให้สามารถ embed ได้
                  </p>
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Eye className="h-5 w-5" />
                    Google Looker Studio Dashboard
                  </CardTitle>
                  <Button variant="outline" onClick={handleReset}>
                    เปลี่ยน Dashboard
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="w-full border rounded-lg overflow-hidden bg-muted/50">
                  <iframe
                    src={embedUrl}
                    className="w-full h-[800px] border-0"
                    title="Google Looker Studio Dashboard"
                    allow="clipboard-read; clipboard-write"
                    sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-top-navigation"
                    loading="lazy"
                  />
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                  <ExternalLink className="h-4 w-4" />
                  <a
                    href={embedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:underline"
                  >
                    เปิดในแท็บใหม่
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>
    </>
  );
}

