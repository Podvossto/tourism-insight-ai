"use client";

import { useEffect, useState, useMemo } from "react";
import { Calendar, Sparkles, MapPin, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { loadTourismData } from "@/utils/tourismDataLoader";
import {
  getFestivalsForProvinceAndMonth,
  formatFestivalName,
} from "@/utils/festivalDetector";
import { THAI_PROVINCES, MONTHS } from "@/data/provinces";
import type { TourismDataRow } from "@/types/tourism";
import { isHighSeason, getHighSeasonMonths } from "@/utils/highSeasonLogic";
import {
  COMMON_FESTIVALS,
  getProvinceSpecificFestivals,
} from "@/utils/festivalLogic";
import { getEnglishProvinceName } from "@/utils/provinceMapping";

export default function ConditionsPage() {
  const [rawData, setRawData] = useState<TourismDataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(
    undefined
  );
  const [selectedHighSeason, setSelectedHighSeason] = useState<
    "all" | "yes" | "no"
  >("all");

  useEffect(() => {
    loadTourismData()
      .then((data) => {
        setRawData(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error("Failed to load tourism data:", error);
        setLoading(false);
      });
  }, []);

  // Generate table data for all provinces and months
  const tableData = useMemo(() => {
    const data: Array<{
      province: string;
      month: number;
      monthLabel: string;
      isHighSeason: boolean;
      highSeasonMonths: number[];
      commonFestivals: Array<{ label: string; value: string }>;
      provinceSpecificFestivals: Array<{ label: string; value: string }>;
      detectedFestivals: string[];
    }> = [];

    for (const province of THAI_PROVINCES) {
      for (const month of MONTHS) {
        const isHigh = isHighSeason(province, month.value);
        const highSeasonMonths = getHighSeasonMonths(province);
        const commonFestivals = COMMON_FESTIVALS;
        const provinceSpecificFestivals =
          getProvinceSpecificFestivals(province);

        // Get detected festivals from data
        const detectedFestivals = getFestivalsForProvinceAndMonth(
          rawData,
          province,
          month.value
        );

        data.push({
          province,
          month: month.value,
          monthLabel: month.label,
          isHighSeason: isHigh,
          highSeasonMonths,
          commonFestivals,
          provinceSpecificFestivals,
          detectedFestivals,
        });
      }
    }

    return data;
  }, [rawData]);

  // Filter table data
  const filteredTableData = useMemo(() => {
    let filtered = tableData;

    // Filter by search query (province name - support both Thai and English)
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      filtered = filtered.filter((d) => {
        const englishName = getEnglishProvinceName(d.province) || "";
        return (
          d.province.toLowerCase().includes(searchLower) ||
          englishName.toLowerCase().includes(searchLower)
        );
      });
    }

    // Filter by province
    if (selectedProvince !== "all") {
      filtered = filtered.filter((d) => d.province === selectedProvince);
    }

    // Filter by month
    if (selectedMonth) {
      filtered = filtered.filter((d) => d.month === selectedMonth);
    }

    // Filter by high season
    if (selectedHighSeason !== "all") {
      filtered = filtered.filter((d) => {
        return selectedHighSeason === "yes" ? d.isHighSeason : !d.isHighSeason;
      });
    }

    return filtered;
  }, [
    tableData,
    searchQuery,
    selectedProvince,
    selectedMonth,
    selectedHighSeason,
  ]);

  if (loading) {
    return (
      <>
        <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
          <div className="flex h-16 items-center gap-4 px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Calendar className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground">
                Tourism Insight AI — Conditions
              </h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Loading conditions...
              </p>
            </CardContent>
          </Card>
        </main>
      </>
    );
  }

  return (
    <>
      <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
        <div className="flex h-16 items-center gap-4 px-4">
          <SidebarTrigger />
          <div className="flex items-center gap-3 flex-1">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Tourism Insight AI — Conditions
            </h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                High Season Logic
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="p-3 bg-accent/30 rounded-lg">
                  <p className="text-sm font-semibold mb-2">
                    Northern & Northeast
                  </p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Provinces: {["เชียงใหม่", "เชียงราย", "น่าน", "แม่ฮ่องสอน", "เลย", "นครราชสีมา"].map(p => getEnglishProvinceName(p) || p).join(", ")}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[11, 12, 1, 2].map((m) => (
                      <Badge key={m} variant="default" className="text-xs">
                        {MONTHS.find((mm) => mm.value === m)?.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-accent/30 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Andaman Sea</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Provinces: {["ภูเก็ต", "กระบี่", "พังงา", "ตรัง", "สตูล"].map(p => getEnglishProvinceName(p) || p).join(", ")}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[11, 12, 1, 2, 3, 4].map((m) => (
                      <Badge key={m} variant="default" className="text-xs">
                        {MONTHS.find((mm) => mm.value === m)?.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-accent/30 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Gulf of Thailand</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Provinces: {["สุราษฎร์ธานี", "ชุมพร"].map(p => getEnglishProvinceName(p) || p).join(", ")}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[1, 2, 3, 4, 7, 8].map((m) => (
                      <Badge key={m} variant="default" className="text-xs">
                        {MONTHS.find((mm) => mm.value === m)?.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-accent/30 rounded-lg">
                  <p className="text-sm font-semibold mb-2">Eastern</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    Provinces: {["ชลบุรี", "ระยอง", "ตราด"].map(p => getEnglishProvinceName(p) || p).join(", ")}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[3, 4, 5, 11, 12].map((m) => (
                      <Badge key={m} variant="default" className="text-xs">
                        {MONTHS.find((mm) => mm.value === m)?.label}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="p-3 bg-accent/30 rounded-lg border-2 border-primary/30">
                  <p className="text-sm font-semibold mb-2">Universal Rules</p>
                  <p className="text-xs text-muted-foreground mb-2">
                    All provinces: April (Songkran), December (New Year)
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {[4, 12].map((m) => (
                      <Badge
                        key={m}
                        variant="default"
                        className="text-xs bg-primary"
                      >
                        {MONTHS.find((mm) => mm.value === m)?.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-secondary" />
                Festival Logic
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 bg-accent/30 rounded-lg">
                <p className="text-sm font-semibold mb-3">Common Festivals</p>
                <p className="text-xs text-muted-foreground mb-3">
                  Available for all provinces ({COMMON_FESTIVALS.length}{" "}
                  festivals)
                </p>
                <div className="flex flex-wrap gap-1 max-h-48 overflow-y-auto">
                  {COMMON_FESTIVALS.slice(0, 10).map((festival) => (
                    <Badge
                      key={festival.value}
                      variant="default"
                      className="text-xs"
                    >
                      {festival.label}
                    </Badge>
                  ))}
                  {COMMON_FESTIVALS.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{COMMON_FESTIVALS.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
              <div className="p-4 bg-accent/30 rounded-lg">
                <p className="text-sm font-semibold mb-3">
                  Province-Specific Festivals
                </p>
                <p className="text-xs text-muted-foreground">
                  Shown only when the corresponding province is selected
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
        {/* Filters */}
        <Card className="p-4 bg-card border-border">
          <div className="flex flex-col lg:flex-row gap-4 items-start lg:items-center">
            <div className="flex items-center gap-2">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Label className="font-semibold">Filters:</Label>
            </div>

            <div className="flex flex-wrap gap-4 items-center flex-1">
              <div className="flex items-center gap-2">
                <Label htmlFor="search" className="text-sm">
                  Search:
                </Label>
                <Input
                  id="search"
                  placeholder="Search province..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-48"
                />
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="province" className="text-sm">
                  Province:
                </Label>
                <Select
                  value={selectedProvince}
                  onValueChange={setSelectedProvince}
                >
                  <SelectTrigger id="province" className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Provinces</SelectItem>
                    {THAI_PROVINCES.map((province) => (
                      <SelectItem key={province} value={province}>
                        {getEnglishProvinceName(province) || province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="month" className="text-sm">
                  Month:
                </Label>
                <Select
                  value={selectedMonth?.toString() ?? "all"}
                  onValueChange={(value) =>
                    setSelectedMonth(
                      value === "all" ? undefined : parseInt(value, 10)
                    )
                  }
                >
                  <SelectTrigger id="month" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Months</SelectItem>
                    {MONTHS.map((month) => (
                      <SelectItem
                        key={month.value}
                        value={month.value.toString()}
                      >
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label htmlFor="highSeason" className="text-sm">
                  High Season:
                </Label>
                <Select
                  value={selectedHighSeason}
                  onValueChange={(value) =>
                    setSelectedHighSeason(value as "all" | "yes" | "no")
                  }
                >
                  <SelectTrigger id="highSeason" className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="yes">Yes</SelectItem>
                    <SelectItem value="no">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </Card>
        {/* Conditions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Conditions by Province and Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border max-h-[600px] overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-background z-10">
                  <TableRow>
                    <TableHead>Province</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>High Season</TableHead>
                    <TableHead>High Season Months</TableHead>
                    <TableHead>Common Festivals</TableHead>
                    <TableHead>Province-Specific Festivals</TableHead>
                    <TableHead>Detected Festivals</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTableData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center text-muted-foreground"
                      >
                        No data found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTableData.map((row, index) => (
                      <TableRow key={`${row.province}-${row.month}-${index}`}>
                        <TableCell className="font-medium">
                          {getEnglishProvinceName(row.province) || row.province}
                        </TableCell>
                        <TableCell>{row.monthLabel}</TableCell>
                        <TableCell>
                          <Badge
                            variant={row.isHighSeason ? "default" : "outline"}
                            className={row.isHighSeason ? "bg-primary" : ""}
                          >
                            {row.isHighSeason ? "Yes" : "No"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {row.highSeasonMonths.slice(0, 3).map((m) => (
                              <Badge
                                key={m}
                                variant="outline"
                                className="text-xs"
                              >
                                {MONTHS.find((mm) => mm.value === m)?.label}
                              </Badge>
                            ))}
                            {row.highSeasonMonths.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{row.highSeasonMonths.length - 3}
                              </Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-muted-foreground">
                            {row.commonFestivals.length} available
                          </div>
                        </TableCell>
                        <TableCell>
                          {row.provinceSpecificFestivals.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {row.provinceSpecificFestivals
                                .slice(0, 2)
                                .map((f) => (
                                  <Badge
                                    key={f.value}
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    {f.label}
                                  </Badge>
                                ))}
                              {row.provinceSpecificFestivals.length > 2 && (
                                <Badge variant="outline" className="text-xs">
                                  +{row.provinceSpecificFestivals.length - 2}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              None
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.detectedFestivals.length > 0 ? (
                            <div className="space-y-1 max-w-xs">
                              {row.detectedFestivals.slice(0, 2).map((f) => (
                                <div key={f} className="text-xs">
                                  • {formatFestivalName(f)}
                                </div>
                              ))}
                              {row.detectedFestivals.length > 2 && (
                                <div className="text-xs text-muted-foreground">
                                  +{row.detectedFestivals.length - 2} more
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              None
                            </span>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </main>
    </>
  );
}
