"use client";

import { useEffect, useState, useMemo } from "react";
import { Database, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { loadTourismData } from "@/utils/tourismDataLoader";
import type { TourismDataRow } from "@/types/tourism";
import { THAI_PROVINCES, MONTHS } from "@/data/provinces";
import { isHighSeason } from "@/utils/highSeasonLogic";
import { formatFestivalName } from "@/utils/festivalDetector";
import { Badge } from "@/components/ui/badge";

export default function DatasetPage() {
  const [rawData, setRawData] = useState<TourismDataRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string>("all");
  const [selectedYear, setSelectedYear] = useState<number | undefined>(
    undefined
  );
  const [selectedMonth, setSelectedMonth] = useState<number | undefined>(
    undefined
  );
  const [selectedTourismType, setSelectedTourismType] = useState<
    "Thai" | "Foreign" | "All"
  >("All");
  const [selectedHighSeason, setSelectedHighSeason] = useState<
    "all" | "yes" | "no"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

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

  const filteredData = useMemo(() => {
    let filtered = rawData;

    // Filter by province
    if (selectedProvince !== "all") {
      filtered = filtered.filter((d) => d.province === selectedProvince);
    }

    // Filter by year
    if (selectedYear) {
      filtered = filtered.filter((d) => d.year === selectedYear);
    }

    // Filter by month
    if (selectedMonth) {
      filtered = filtered.filter((d) => d.month === selectedMonth);
    }

    // Filter by tourism type
    if (selectedTourismType !== "All") {
      filtered = filtered.filter((d) => d.tourismType === selectedTourismType);
    }

    // Filter by high season
    if (selectedHighSeason !== "all") {
      filtered = filtered.filter((d) => {
        const isHigh = isHighSeason(d.province, d.month);
        return selectedHighSeason === "yes" ? isHigh : !isHigh;
      });
    }

    // Filter by search query (province name)
    if (searchQuery) {
      filtered = filtered.filter((d) =>
        d.province.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [
    rawData,
    selectedProvince,
    selectedYear,
    selectedMonth,
    selectedTourismType,
    selectedHighSeason,
    searchQuery,
  ]);

  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredData.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  if (loading) {
    return (
      <>
        <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
          <div className="flex h-16 items-center gap-4 px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-3 flex-1">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Database className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground">
                Tourism Insight AI — Dataset
              </h1>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="pt-6">
              <p className="text-center text-muted-foreground">
                Loading dataset...
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
              <Database className="h-5 w-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold text-foreground">
              Tourism Insight AI — Dataset
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

      <main className="container mx-auto px-4 py-8 space-y-6">
        {/* Filters */}
        <Card className="p-4 bg-card border-border">
          <div className="flex flex-row gap-4 items-center overflow-x-auto">
            <div className="flex items-center gap-2 flex-shrink-0">
              <Label className="font-semibold">Filters:</Label>
            </div>

            <div className="flex flex-row gap-4 items-center flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-shrink-0">
                <Label htmlFor="search" className="text-sm whitespace-nowrap">
                  Search:
                </Label>
                <Input
                  id="search"
                  placeholder="Search province..."
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="w-40"
                />
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Label htmlFor="province" className="text-sm whitespace-nowrap">
                  Province:
                </Label>
                <Select
                  value={selectedProvince}
                  onValueChange={(value) => {
                    setSelectedProvince(value);
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger id="province" className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Provinces</SelectItem>
                    {THAI_PROVINCES.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Label htmlFor="year" className="text-sm whitespace-nowrap">
                  Year:
                </Label>
                <Select
                  value={selectedYear?.toString() ?? "all"}
                  onValueChange={(value) => {
                    setSelectedYear(
                      value === "all" ? undefined : parseInt(value, 10)
                    );
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger id="year" className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    <SelectItem value="2023">2023</SelectItem>
                    <SelectItem value="2024">2024</SelectItem>
                    <SelectItem value="2025">2025</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Label htmlFor="month" className="text-sm whitespace-nowrap">
                  Month:
                </Label>
                <Select
                  value={selectedMonth?.toString() ?? "all"}
                  onValueChange={(value) => {
                    setSelectedMonth(
                      value === "all" ? undefined : parseInt(value, 10)
                    );
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger id="month" className="w-28">
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

              <div className="flex items-center gap-2 flex-shrink-0">
                <Label
                  htmlFor="tourismType"
                  className="text-sm whitespace-nowrap"
                >
                  Type:
                </Label>
                <Select
                  value={selectedTourismType}
                  onValueChange={(value) => {
                    setSelectedTourismType(value as "Thai" | "Foreign" | "All");
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger id="tourismType" className="w-28">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All</SelectItem>
                    <SelectItem value="Thai">Thai</SelectItem>
                    <SelectItem value="Foreign">Foreign</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <Label
                  htmlFor="highSeason"
                  className="text-sm whitespace-nowrap"
                >
                  High Season:
                </Label>
                <Select
                  value={selectedHighSeason}
                  onValueChange={(value) => {
                    setSelectedHighSeason(value as "all" | "yes" | "no");
                    setCurrentPage(1);
                  }}
                >
                  <SelectTrigger id="highSeason" className="w-28">
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

        {/* Data Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>
                Dataset ({filteredData.length.toLocaleString()} records)
              </CardTitle>
              <div className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Province</TableHead>
                    <TableHead>Year</TableHead>
                    <TableHead>Month</TableHead>
                    <TableHead>Tourism Type</TableHead>
                    <TableHead>High Season</TableHead>
                    <TableHead className="text-right">
                      Income (M Baht)
                    </TableHead>
                    <TableHead className="text-right">Tourism Amount</TableHead>
                    <TableHead>Festivals</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        className="text-center text-muted-foreground"
                      >
                        No data found
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((row, index) => {
                      const isHigh = isHighSeason(row.province, row.month);
                      return (
                        <TableRow
                          key={`${row.province}-${row.year}-${row.month}-${row.tourismType}-${index}`}
                        >
                          <TableCell className="font-medium">
                            {row.province}
                          </TableCell>
                          <TableCell>{row.year}</TableCell>
                          <TableCell>
                            {MONTHS.find((m) => m.value === row.month)?.label ||
                              row.month}
                          </TableCell>
                          <TableCell>{row.tourismType}</TableCell>
                          <TableCell>
                            <Badge
                              variant={isHigh ? "default" : "outline"}
                              className={isHigh ? "bg-primary" : ""}
                            >
                              {isHigh ? "Yes" : "No"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {row.income.toLocaleString("en-US", {
                              maximumFractionDigits: 2,
                            })}
                          </TableCell>
                          <TableCell className="text-right">
                            {row.tourismAmount.toLocaleString("en-US", {
                              maximumFractionDigits: 0,
                            })}
                          </TableCell>
                          <TableCell>
                            {row.festivals.length > 0 ? (
                              <div className="space-y-1 max-w-xs">
                                {row.festivals.slice(0, 3).map((festival) => (
                                  <div key={festival} className="text-xs">
                                    • {formatFestivalName(festival)}
                                  </div>
                                ))}
                                {row.festivals.length > 3 && (
                                  <div className="text-xs text-muted-foreground">
                                    +{row.festivals.length - 3} more
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
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </>
  );
}
