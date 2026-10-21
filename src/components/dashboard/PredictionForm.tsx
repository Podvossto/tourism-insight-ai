import { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  MapPin,
  Users,
  Sparkles,
  TrendingUp,
  Search,
} from "lucide-react";
import { isApiConfigured } from "@/lib/predictionService";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { THAI_PROVINCES, MONTHS } from "@/lib/provinces";
import type { PredictionInput } from "@/types/tourism";
import { loadTourismData } from "@/lib/tourismDataLoader";
import type { TourismDataRow } from "@/types/tourism";
import {
  getFestivalsForProvinceAndMonth,
  formatFestivalName,
} from "@/lib/festivalDetector";
import { isHighSeason } from "@/lib/highSeasonLogic";
import {
  COMMON_FESTIVALS,
} from "@/lib/festivalLogic";
import { getEnglishProvinceName } from "@/lib/provinceMapping";

interface PredictionFormProps {
  onPredict: (input: PredictionInput) => void;
  isLoading?: boolean;
  onProvinceSelect?: (province: string) => void;
  selectedProvince?: string;
}

export function PredictionForm({
  onPredict,
  isLoading,
  onProvinceSelect,
  selectedProvince,
}: PredictionFormProps) {
  const [formData, setFormData] = useState<PredictionInput>({
    province: "",
    tourism_type: "Thai",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    high_season: 0,
    festival: null,
  });
  const [selectedMonths, setSelectedMonths] = useState<number[]>([
    new Date().getMonth() + 1,
  ]);
  const [monthRange, setMonthRange] = useState<[number, number]>([1, 12]);

  const [selectedFestivals, setSelectedFestivals] = useState<string[]>([]);
  const [autoDetectHighSeason] = useState(true); // Always auto-detect, cannot be changed
  // Always run both Thai and Foreign by default
  const [selectedTourismTypes] = useState<("Thai" | "Foreign")[]>([
    "Thai",
    "Foreign",
  ]);
  const [availableData, setAvailableData] = useState<TourismDataRow[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [provinceSearchOpen, setProvinceSearchOpen] = useState(false);
  const [provinceSearchQuery, setProvinceSearchQuery] = useState("");

  // Load available data to check what months/years exist
  useEffect(() => {
    loadTourismData()
      .then((data) => {
        setAvailableData(data);
        setLoadingData(false);
      })
      .catch((error) => {
        console.error("Failed to load tourism data:", error);
        setLoadingData(false);
      });
  }, []);

  // Auto-detect high season when month or province changes
  useEffect(() => {
    if (formData.province && selectedMonths.length > 0) {
      // Check if any selected month is high season
      const hasHighSeason = selectedMonths.some((month) =>
        isHighSeason(formData.province, month)
      );
      setFormData((prev) => ({
        ...prev,
        high_season: hasHighSeason ? 1 : 0,
      }));
    }
  }, [selectedMonths, formData.province]);

  // Get available months that don't exist in database for the selected year
  const availableMonths = useMemo(() => {
    if (loadingData || availableData.length === 0) return MONTHS;

    // Get all months that exist in the selected year
    const existingMonths = new Set(
      availableData.filter((d) => d.year === formData.year).map((d) => d.month)
    );

    // Return months that don't exist in the selected year
    return MONTHS.filter((m) => !existingMonths.has(m.value));
  }, [availableData, formData.year, loadingData]);

  // Initialize monthRange based on availableMonths
  // Set to first available month (default: only first month selected)
  useEffect(() => {
    if (availableMonths.length > 0) {
      const firstMonth = availableMonths[0]?.value || 1;
      setMonthRange([firstMonth, firstMonth]); // Start with only first month selected
    }
  }, [availableMonths]);

  // Update selectedMonths when monthRange changes
  useEffect(() => {
    const [start, end] = monthRange;
    const months: number[] = [];
    for (let i = start; i <= end; i++) {
      if (availableMonths.some((m) => m.value === i)) {
        months.push(i);
      }
    }
    if (months.length > 0) {
      setSelectedMonths(months);
    }
  }, [monthRange, availableMonths]);

  // Auto-detect festivals from dataset based on province and selected months
  // Don't filter by year since we want to show all festivals for that month
  useEffect(() => {
    if (
      formData.province &&
      availableData.length > 0 &&
      selectedMonths.length > 0
    ) {
      // Get festivals for all selected months
      const allFestivals = new Set<string>();
      selectedMonths.forEach((month) => {
        const detectedFestivals = getFestivalsForProvinceAndMonth(
          availableData,
          formData.province,
          month
        );
        detectedFestivals.forEach((f) => allFestivals.add(f));
      });
      setSelectedFestivals(Array.from(allFestivals));
    } else {
      setSelectedFestivals([]);
    }
  }, [formData.province, selectedMonths, availableData]);

  // Sync with selected province from map
  useEffect(() => {
    if (selectedProvince) {
      setFormData((prev) => ({
        ...prev,
        province: selectedProvince,
      }));
    }
  }, [selectedProvince]);

  // Update selectedMonths when monthRange changes
  useEffect(() => {
    const [start, end] = monthRange;
    const months: number[] = [];
    for (let i = start; i <= end; i++) {
      if (availableMonths.some((m) => m.value === i)) {
        months.push(i);
      }
    }
    if (months.length > 0) {
      setSelectedMonths(months);
    }
  }, [monthRange, availableMonths]);

  // Get available years: years that either have no data at all, or have some months missing
  const availableYears = useMemo(() => {
    if (loadingData || availableData.length === 0) {
      const currentYear = new Date().getFullYear();
      return Array.from({ length: 5 }, (_, i) => currentYear + i);
    }

    // Get all years that exist in database
    const existingYears = new Set(availableData.map((d) => d.year));

    // Get all possible months (1-12)
    const allMonths = new Set([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);

    const currentYear = new Date().getFullYear();
    const futureYears = Array.from({ length: 5 }, (_, i) => currentYear + i);

    // Filter years that either:
    // 1. Don't exist in database at all, OR
    // 2. Exist but don't have all 12 months
    return futureYears.filter((year) => {
      if (!existingYears.has(year)) {
        // Year doesn't exist at all - available
        return true;
      }

      // Year exists - check if it has all 12 months
      const monthsInYear = new Set(
        availableData.filter((d) => d.year === year).map((d) => d.month)
      );

      // Available if not all 12 months exist
      return monthsInYear.size < 12;
    });
  }, [availableData, loadingData]);

  const handleSubmit = () => {
    if (!formData.province || selectedMonths.length === 0) {
      return;
    }

    // Run prediction for each selected month and tourism type
    selectedTourismTypes.forEach((type) => {
      selectedMonths.forEach((month) => {
        // Get festivals for this specific month
        const monthFestivals =
          formData.province && availableData.length > 0
            ? getFestivalsForProvinceAndMonth(
                availableData,
                formData.province,
                month
              )
            : [];

        // Check if this month is high season
        const isHigh = formData.province
          ? isHighSeason(formData.province, month)
          : false;

        onPredict({
          ...formData,
          month,
          tourism_type: type,
          high_season: isHigh ? 1 : 0,
          festival: monthFestivals.length > 0 ? monthFestivals[0] : null,
        });
      });
    });
  };

  return (
    <Card className="p-6 space-y-6 bg-card border-border shadow-lg">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          Prediction Controls
        </h2>
        <p className="text-sm text-muted-foreground">
          Choose a province, month and visitor type.
        </p>
        <p className="text-xs text-muted-foreground rounded-md border border-border bg-muted/40 p-2">
          {isApiConfigured
            ? "Uses the prediction API when reachable; otherwise shows precomputed model output (Sep-Dec 2025)."
            : "Results are precomputed model output for Sep-Dec 2025, loaded from a CSV. No live model is running."}
        </p>
      </div>

      <div className="space-y-4">
        {/* Month/Year */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            Months / Year
          </Label>
          <div className="space-y-2">
            <Select
              value={formData.year.toString()}
              onValueChange={(value) =>
                setFormData({ ...formData, year: parseInt(value) })
              }
              disabled={loadingData || availableYears.length === 0}
            >
              <SelectTrigger className="bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover">
                {availableYears.length > 0 ? (
                  availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="" disabled>
                    No available years
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <div className="p-4 border rounded-lg bg-background space-y-3">
              <Label className="text-xs text-muted-foreground">
                Select month range:
              </Label>
              {availableMonths.length > 0 ? (
                <>
                  <Slider
                    value={monthRange}
                    onValueChange={(value) =>
                      setMonthRange(value as [number, number])
                    }
                    min={availableMonths[0]?.value || 1}
                    max={12}
                    step={1}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>
                      {MONTHS.find((m) => m.value === monthRange[0])?.label ||
                        monthRange[0]}
                    </span>
                    <span>
                      {MONTHS.find((m) => m.value === monthRange[1])?.label ||
                        monthRange[1]}
                    </span>
                  </div>
                  {selectedMonths.length > 0 && (
                    <div className="pt-2 border-t">
                      <p className="text-xs text-muted-foreground">
                        Selected: {selectedMonths.length} month
                        {selectedMonths.length > 1 ? "s" : ""} (
                        {
                          MONTHS.find((m) => m.value === selectedMonths[0])
                            ?.label
                        }{" "}
                        -{" "}
                        {
                          MONTHS.find(
                            (m) =>
                              m.value ===
                              selectedMonths[selectedMonths.length - 1]
                          )?.label
                        }
                        )
                      </p>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No available months
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Province */}
        <div className="space-y-2">
          <Label className="text-sm font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-primary" />
            Province
          </Label>
          <Popover
            open={provinceSearchOpen}
            onOpenChange={setProvinceSearchOpen}
          >
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                role="combobox"
                aria-expanded={provinceSearchOpen}
                className="w-full justify-between bg-background"
              >
                {formData.province
                  ? getEnglishProvinceName(formData.province) || formData.province
                  : "Select province..."}
                <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-full p-0" align="start">
              <Command>
                <CommandInput
                  placeholder="Search province..."
                  value={provinceSearchQuery}
                  onValueChange={setProvinceSearchQuery}
                />
                <CommandList>
                  <CommandEmpty>No province found.</CommandEmpty>
                  <CommandGroup>
                    <CommandItem
                      value="all"
                      onSelect={() => {
                        setFormData({ ...formData, province: "all" });
                        setProvinceSearchOpen(false);
                        setProvinceSearchQuery("");
                      }}
                    >
                      All provinces
                    </CommandItem>
                    {THAI_PROVINCES.filter((province) => {
                      const englishName = getEnglishProvinceName(province) || "";
                      const searchLower = provinceSearchQuery.toLowerCase();
                      return (
                        province.toLowerCase().includes(searchLower) ||
                        englishName.toLowerCase().includes(searchLower)
                      );
                    }).map((province) => (
                      <CommandItem
                        key={province}
                        value={province}
                        onSelect={() => {
                          setFormData({ ...formData, province });
                          setProvinceSearchOpen(false);
                          setProvinceSearchQuery("");
                          if (onProvinceSelect) {
                            onProvinceSelect(province);
                          }
                        }}
                      >
                        {getEnglishProvinceName(province) || province}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>

        {/* High Season - Auto-detect only */}
        <div className="space-y-3 p-4 bg-accent/50 rounded-lg">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-secondary" />
              High season boost (Auto-detect)
            </Label>
            <Badge variant="outline" className="text-xs">
              AutoDetect
            </Badge>
          </div>
          {formData.province && selectedMonths.length > 0 && (
            <p className="text-xs text-muted-foreground">
              {selectedMonths.some((month) =>
                isHighSeason(formData.province, month)
              )
                ? "✓ High season detected for selected months"
                : "Not a high season period"}
            </p>
          )}
        </div>

        {/* Tourist market - Always run both */}
        <div className="space-y-3 p-4 bg-accent/30 rounded-lg">
          <Label className="text-sm font-medium flex items-center gap-2">
            <Users className="h-4 w-4 text-primary" />
            Tourist market
          </Label>
          <p className="text-xs text-muted-foreground">
            ✓ Both Domestic and International markets will be predicted
          </p>
        </div>

        {/* Festivals - Auto-detect only */}
        <div className="space-y-3 p-4 bg-accent/30 rounded-lg">
          <div className="flex items-center justify-between">
            <Label className="text-sm font-medium">
              Festival boost (auto-detected from dataset)
            </Label>
          </div>
          {formData.province ? (
            <>
              {selectedFestivals.length > 0 ? (
                <>
                  {/* Common Festivals */}
                  {(() => {
                    const commonFestivals = selectedFestivals.filter((f) =>
                      COMMON_FESTIVALS.some((cf) => cf.value === f)
                    );
                    const provinceSpecific = selectedFestivals.filter(
                      (f) => !COMMON_FESTIVALS.some((cf) => cf.value === f)
                    );
                    return (
                      <>
                        {commonFestivals.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-foreground">
                              Common Festivals:
                            </p>
                            <div className="flex flex-wrap gap-2 min-h-[40px] max-h-[150px] overflow-y-auto p-2">
                              {commonFestivals.map((festival) => (
                                <Badge
                                  key={festival}
                                  variant="default"
                                  className="text-xs"
                                >
                                  {formatFestivalName(festival)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {provinceSpecific.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-semibold text-foreground">
                              Province-Specific Festivals:
                            </p>
                            <div className="flex flex-wrap gap-2 min-h-[40px] max-h-[150px] overflow-y-auto p-2">
                              {provinceSpecific.map((festival) => (
                                <Badge
                                  key={festival}
                                  variant="secondary"
                                  className="text-xs"
                                >
                                  {formatFestivalName(festival)}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <p className="text-xs text-muted-foreground">
                    ✓ {selectedFestivals.length} festival
                    {selectedFestivals.length > 1 ? "s" : ""} detected for{" "}
                    {formData.province} in{" "}
                    {MONTHS.find((m) => m.value === formData.month)?.label ||
                      formData.month}
                  </p>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  No festivals detected. Please select a province and month.
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              Please select a province to see available festivals.
            </p>
          )}
        </div>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={
          isLoading || !formData.province || formData.province === "all"
        }
        className="w-full h-12 text-base font-semibold bg-primary hover:bg-primary/90 shadow-md"
      >
        {isLoading ? "Running prediction..." : "Run prediction"}
      </Button>
    </Card>
  );
}
