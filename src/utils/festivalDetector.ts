import type { TourismDataRow } from "@/types/tourism";

/**
 * Get all unique festivals from the dataset
 */
export function getAllFestivalsFromData(data: TourismDataRow[]): string[] {
  const festivalSet = new Set<string>();
  data.forEach((row) => {
    row.festivals.forEach((festival) => festivalSet.add(festival));
  });
  return Array.from(festivalSet).sort();
}

/**
 * Get festivals for a specific province and month from the dataset
 */
export function getFestivalsForProvinceAndMonth(
  data: TourismDataRow[],
  province: string,
  month: number,
  year?: number
): string[] {
  // Normalize province name for matching (handle misspellings)
  const normalizeProvince = (name: string) => {
    if (name === "ศรีษะเกษ") return "ศรีสะเกษ";
    return name;
  };
  
  const normalizedProvince = normalizeProvince(province);
  let filtered = data.filter((d) => {
    const normalized = normalizeProvince(d.province);
    return (normalized === normalizedProvince || d.province === province) && d.month === month;
  });
  
  if (year !== undefined) {
    filtered = filtered.filter((d) => d.year === year);
  }

  const festivalSet = new Set<string>();
  filtered.forEach((row) => {
    row.festivals.forEach((festival) => festivalSet.add(festival));
  });

  return Array.from(festivalSet).sort();
}

/**
 * Format festival name for display (remove Festival_ prefix and replace underscores)
 */
export function formatFestivalName(festival: string): string {
  // Remove Festival_ prefix if present
  let formatted = festival.replace(/^Festival_/i, "");
  // Replace underscores with spaces
  formatted = formatted.replace(/_/g, " ");
  // Capitalize first letter of each word
  formatted = formatted.replace(/\b\w/g, (l) => l.toUpperCase());
  return formatted;
}

