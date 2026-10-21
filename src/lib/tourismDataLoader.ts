import Papa from "papaparse";
import type { TourismDataRow, HeatmapDataPoint, MonthlyDataPoint } from "@/types/tourism";
import { getMapProvinceName } from "@/lib/provinceMapping";

const TOURISM_DATA_PATH = "/data/TourismData_ForMultiTarget.csv";

// Simple in-memory cache for loaded data
let cachedData: TourismDataRow[] | null = null;
let cachePromise: Promise<TourismDataRow[]> | null = null;

interface CSVRow {
  [key: string]: string | undefined;
}

const parseNumber = (value?: string): number => {
  const parsed = parseFloat(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
};

// Province name corrections for common misspellings in CSV
const PROVINCE_NAME_CORRECTIONS: Record<string, string> = {
  "ศรีษะเกษ": "ศรีสะเกษ", // Fix misspelling
  "กรุงเทพมหานคร": "กรุงเทพมหานคร", // Keep as is
  "หนองบัวลำภู": "หนองบัวลำภู", // Keep as is
};

const getProvinceFromRow = (row: CSVRow): string | null => {
  const provinceKeys = Object.keys(row).filter((key) =>
    key.startsWith("Province_")
  );
  const activeProvince = provinceKeys.find((key) => row[key] === "1");
  if (activeProvince) {
    let provinceName = activeProvince.replace("Province_", "");
    // Apply corrections for misspellings
    provinceName = PROVINCE_NAME_CORRECTIONS[provinceName] || provinceName;
    return provinceName;
  }
  return null;
};

const getYearFromRow = (row: CSVRow): number | null => {
  if (row["Year_2023"] === "1") return 2023;
  if (row["Year_2024"] === "1") return 2024;
  if (row["Year_2025"] === "1") return 2025;
  return null;
};

const getMonthFromRow = (row: CSVRow): number | null => {
  for (let i = 1; i <= 12; i++) {
    if (row[`Month_${i}`] === "1") {
      return i;
    }
  }
  return null;
};

const getTourismTypeFromRow = (row: CSVRow): "Thai" | "Foreign" | "All" => {
  if (row["Tourism_Type_Thai"] === "1") return "Thai";
  if (row["Tourism_Type_Foreign"] === "1") return "Foreign";
  return "All";
};

const getFestivalsFromRow = (row: CSVRow): string[] => {
  const festivals: string[] = [];
  Object.keys(row).forEach((key) => {
    // Check if key starts with "Festival_" and value is "1" (One-hot encoding)
    if (key.startsWith("Festival_") && (row[key] === "1" || row[key] === 1 || row[key] === "1.0")) {
      // Keep the full key name (with Festival_ prefix) for consistency
      festivals.push(key);
    }
  });
  return festivals;
};

export async function loadTourismData(): Promise<TourismDataRow[]> {
  // Return cached data if available
  if (cachedData !== null) {
    return Promise.resolve(cachedData);
  }

  // If a load is already in progress, return that promise
  if (cachePromise !== null) {
    return cachePromise;
  }

  // Start loading and cache the promise
  cachePromise = new Promise((resolve, reject) => {
    Papa.parse<TourismDataRow>(TOURISM_DATA_PATH, {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (header) => header.trim(),
      complete: (results) => {
        try {
          const data: TourismDataRow[] = [];
          const rows = results.data as unknown as CSVRow[];

          for (const row of rows) {
            const province = getProvinceFromRow(row);
            const year = getYearFromRow(row);
            const month = getMonthFromRow(row);
            const tourismType = getTourismTypeFromRow(row);

            if (!province || !year || !month) {
              continue;
            }

            data.push({
              income: parseNumber(row["Income(Million Baht)"]),
              tourismAmount: parseNumber(row["Tourism_Amount"]),
              province,
              year,
              month,
              tourismType,
              festivals: getFestivalsFromRow(row),
            });
          }

          // Cache the data
          cachedData = data;
          resolve(data);
        } catch (error) {
          cachePromise = null; // Reset on error
          reject(error);
        }
      },
      error: (error) => {
        cachePromise = null; // Reset on error
        reject(error);
      },
    });
  });

  return cachePromise;
}

export function aggregateHeatmapData(
  data: TourismDataRow[],
  options: {
    year?: number;
    month?: number;
    metric: "income" | "tourismAmount";
    tourismType?: "Thai" | "Foreign" | "All";
  }
): HeatmapDataPoint[] {
  const { year, month, metric, tourismType } = options;

  // Filter data
  let filtered = data;
  if (year !== undefined) {
    filtered = filtered.filter((d) => d.year === year);
  }
  if (month !== undefined) {
    filtered = filtered.filter((d) => d.month === month);
  }
  if (tourismType !== undefined && tourismType !== "All") {
    filtered = filtered.filter((d) => d.tourismType === tourismType);
  }

  // Aggregate by province - sum values for same province
  const provinceMap = new Map<
    string,
    {
      province: string;
      income: number;
      tourismAmount: number;
      year: number;
      month: number;
      tourismType: "Thai" | "Foreign" | "All";
    }
  >();

  for (const row of filtered) {
    // Normalize province name (handle misspellings)
    let provinceName = row.province;
    if (provinceName === "ศรีษะเกษ") {
      provinceName = "ศรีสะเกษ";
    }
    
    const key = provinceName;
    const existing = provinceMap.get(key);

    if (existing) {
      existing.income += row.income;
      existing.tourismAmount += row.tourismAmount;
    } else {
      provinceMap.set(key, {
        province: provinceName,
        income: row.income,
        tourismAmount: row.tourismAmount,
        year: row.year,
        month: row.month,
        tourismType: row.tourismType,
      });
    }
  }

  // Convert to HeatmapDataPoint format
  // Use English name for map matching, but keep Thai name as provinceThai
  return Array.from(provinceMap.values()).map((item) => {
    const mapName = getMapProvinceName(item.province);
    return {
      province: mapName, // Use English name for map matching
      provinceThai: item.province, // Keep Thai name
      value: metric === "income" ? item.income : item.tourismAmount,
      year: item.year,
      month: item.month,
      tourismType: item.tourismType,
      // Store both values for tooltip
      income: item.income,
      tourismAmount: item.tourismAmount,
    };
  });
}

export function getMonthlyDataForProvince(
  data: TourismDataRow[],
  province: string,
  options?: {
    year?: number;
    tourismType?: "Thai" | "Foreign" | "All";
  }
): MonthlyDataPoint[] {
  // Normalize province name for matching (handle misspellings)
  const normalizeProvince = (name: string) => {
    if (name === "ศรีษะเกษ") return "ศรีสะเกษ";
    return name;
  };
  
  const normalizedProvince = normalizeProvince(province);
  let filtered = data.filter((d) => {
    const normalized = normalizeProvince(d.province);
    return normalized === normalizedProvince || d.province === province;
  });
  
  if (options?.year !== undefined) {
    filtered = filtered.filter((d) => d.year === options.year);
  }
  
  if (options?.tourismType !== undefined && options.tourismType !== "All") {
    filtered = filtered.filter((d) => d.tourismType === options.tourismType);
  }

  // Group by year and month, aggregate values
  const monthMap = new Map<string, { revenue: number; tourists: number; year: number; month: number }>();
  
  for (const row of filtered) {
    const key = `${row.year}-${row.month}`;
    const existing = monthMap.get(key);
    
    if (existing) {
      existing.revenue += row.income;
      existing.tourists += row.tourismAmount;
    } else {
      monthMap.set(key, {
        revenue: row.income,
        tourists: row.tourismAmount,
        year: row.year,
        month: row.month,
      });
    }
  }

  return Array.from(monthMap.values())
    .sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    })
    .map((item) => ({
      year: item.year,
      month: item.month,
      revenue: item.revenue,
      tourists: item.tourists,
    }));
}
