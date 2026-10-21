import Papa from "papaparse";

import { MONTHS } from "@/lib/provinces";
import type {
  MonthlyDataPoint,
  ProvinceData,
  QuarterPrediction,
} from "@/types/tourism";

interface CSVRow {
  [key: string]: string | undefined;
}

const HISTORICAL_PATH = "/data/tourism-full.csv";
const QUARTER_PREDICTION_PATH = "/data/predictions-2025-q4.csv";
const YEAR_COLUMNS = ["Year_2023", "Year_2024", "Year_2025"];
const MONTH_COLUMNS = Array.from(
  { length: 12 },
  (_, idx) => `Month_${idx + 1}`,
);
const PROVINCE_PREFIX = "Province_";

const MONTH_NAME_MAP = new Map(
  MONTHS.map((month) => [month.value, month.label]),
);

const parseNumber = (value?: string) => {
  const parsed = parseFloat(value ?? "0");
  return Number.isFinite(parsed) ? parsed : 0;
};

const findFlaggedColumn = (row: CSVRow, prefix: string) => {
  const key = Object.keys(row).find(
    (column) => column.startsWith(prefix) && row[column] === "1",
  );
  return key ? key.replace(prefix, "") : undefined;
};

const resolveYear = (row: CSVRow) => {
  const yearKey = YEAR_COLUMNS.find((column) => row[column] === "1");
  return yearKey
    ? parseInt(yearKey.replace("Year_", ""), 10)
    : new Date().getFullYear();
};

const resolveMonth = (row: CSVRow) => {
  const monthKey = MONTH_COLUMNS.find((column) => row[column] === "1");
  return monthKey ? parseInt(monthKey.replace("Month_", ""), 10) : 1;
};

const buildFestivalImpact = (
  monthAverages: Record<number, { income: number; count: number }>,
  avgIncome: number,
) => {
  const base = Math.max(avgIncome, 1);
  return Object.entries(monthAverages)
    .filter(([, stats]) => stats.count > 0)
    .map(([month, stats]) => {
      const averageIncome = stats.income / stats.count;
      return {
        festival: `Month ${MONTH_NAME_MAP.get(Number(month)) ?? month}`,
        impact: Number((averageIncome / base).toFixed(2)),
        revenue: averageIncome,
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 3);
};

export function parseHistoricalData(
  csvText: string,
): Record<string, ProvinceData> {
  const parsed = Papa.parse<CSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const provinceBuckets: Record<
    string,
    Array<{ year: number; month: number; income: number; tourists: number }>
  > = {};

  parsed.data.forEach((row) => {
    const provinceName = findFlaggedColumn(row, PROVINCE_PREFIX);
    if (!provinceName) return;

    const income = parseNumber(row["Income(Million Baht)"]);
    const tourists = parseNumber(row["Tourism_Amount"]);
    const year = resolveYear(row);
    const month = resolveMonth(row);

    if (!provinceBuckets[provinceName]) {
      provinceBuckets[provinceName] = [];
    }

    provinceBuckets[provinceName].push({ year, month, income, tourists });
  });

  const provinceData: Record<string, ProvinceData> = {};

  Object.entries(provinceBuckets).forEach(([provinceName, entries]) => {
    const avgIncome =
      entries.reduce((sum, entry) => sum + entry.income, 0) / entries.length;
    const avgTourists =
      entries.reduce((sum, entry) => sum + entry.tourists, 0) / entries.length;

    const yearlyAggregation: Record<
      number,
      { income: number; tourists: number; count: number }
    > = {};
    const monthAggregation: Record<number, { income: number; count: number }> =
      {};

    entries.forEach((entry) => {
      if (!yearlyAggregation[entry.year]) {
        yearlyAggregation[entry.year] = { income: 0, tourists: 0, count: 0 };
      }
      yearlyAggregation[entry.year].income += entry.income;
      yearlyAggregation[entry.year].tourists += entry.tourists;
      yearlyAggregation[entry.year].count += 1;

      if (!monthAggregation[entry.month]) {
        monthAggregation[entry.month] = { income: 0, count: 0 };
      }
      monthAggregation[entry.month].income += entry.income;
      monthAggregation[entry.month].count += 1;
    });

    const trends = Object.entries(yearlyAggregation)
      .map(([year, stats]) => ({
        year: Number(year),
        revenue: stats.income / stats.count,
        tourists: stats.tourists / stats.count,
      }))
      .sort((a, b) => a.year - b.year);

    const latestEntry = entries.reduce((latest, current) => {
      if (!latest) return current;
      if (current.year > latest.year) return current;
      if (current.year === latest.year && current.month > latest.month)
        return current;
      return latest;
    }, entries[0]);

    const monthlyHistory: MonthlyDataPoint[] = entries
      .map((entry) => ({
        year: entry.year,
        month: entry.month,
        revenue: entry.income,
        tourists: entry.tourists,
      }))
      .sort((a, b) =>
        a.year === b.year ? a.month - b.month : a.year - b.year,
      );

    provinceData[provinceName] = {
      province: provinceName,
      provinceThai: provinceName,
      year: latestEntry?.year ?? new Date().getFullYear(),
      predicted_income_million_baht: latestEntry?.income ?? avgIncome,
      predicted_tourism_amount_people: latestEntry?.tourists ?? avgTourists,
      trends,
      festivalImpact: buildFestivalImpact(monthAggregation, avgIncome),
      monthlyHistory,
    };
  });

  return provinceData;
}

export async function loadHistoricalData(): Promise<
  Record<string, ProvinceData>
> {
  try {
    const response = await fetch(HISTORICAL_PATH);
    return parseHistoricalData(await response.text());
  } catch (error) {
    console.error("Error loading historical CSV data:", error);
    return {};
  }
}

export function parseQuarterPredictions(csvText: string): QuarterPrediction[] {
  const parsed = Papa.parse<CSVRow>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  return parsed.data
    .map((row) => {
      const provinceName = findFlaggedColumn(row, PROVINCE_PREFIX);
      if (!provinceName) return undefined;

      const tourismType =
        row["Tourism_Type_Foreign"] === "1" ? "Foreign" : "Thai";

      return {
        province: provinceName,
        year: resolveYear(row),
        month: resolveMonth(row),
        tourism_type: tourismType,
        predicted_income_million_baht: parseNumber(row["Income(Million Baht)"]),
        predicted_tourism_amount_people: parseNumber(row["Tourism_Amount"]),
      } as QuarterPrediction;
    })
    .filter((entry): entry is QuarterPrediction => Boolean(entry))
    .sort(
      (a, b) =>
        b.predicted_income_million_baht - a.predicted_income_million_baht,
    );
}

export async function loadQuarterPredictions(): Promise<QuarterPrediction[]> {
  try {
    const response = await fetch(QUARTER_PREDICTION_PATH);
    return parseQuarterPredictions(await response.text());
  } catch (error) {
    console.error("Error loading prediction CSV data:", error);
    return [];
  }
}
