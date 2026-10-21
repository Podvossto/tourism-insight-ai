// High Season Logic based on geographic zones

// Province to zone mapping
const PROVINCE_ZONES: Record<string, string> = {
  // Northern & Northeast
  "เชียงใหม่": "northern",
  "เชียงราย": "northern",
  "น่าน": "northern",
  "แม่ฮ่องสอน": "northern",
  "เลย": "northeast",
  "นครราชสีมา": "northeast", // เขาใหญ่
  
  // Andaman Sea
  "ภูเก็ต": "andaman",
  "กระบี่": "andaman",
  "พังงา": "andaman",
  "ตรัง": "andaman",
  "สตูล": "andaman",
  
  // Gulf of Thailand
  "สุราษฎร์ธานี": "gulf",
  "ชุมพร": "gulf",
  
  // Eastern
  "ชลบุรี": "eastern",
  "ระยอง": "eastern",
  "ตราด": "eastern",
};

// Zone-based high season months
const ZONE_HIGH_SEASONS: Record<string, number[]> = {
  northern: [11, 12, 1, 2], // Nov, Dec, Jan, Feb
  northeast: [11, 12, 1, 2], // Nov, Dec, Jan, Feb
  andaman: [11, 12, 1, 2, 3, 4], // Nov, Dec, Jan, Feb, Mar, Apr
  gulf: [1, 2, 3, 4, 7, 8], // Jan, Feb, Mar, Apr, Jul, Aug
  eastern: [3, 4, 5, 11, 12], // Mar, Apr, May, Nov, Dec
};

// Universal high season months (always high season regardless of province)
const UNIVERSAL_HIGH_SEASONS = [4, 12]; // April (Songkran), December (New Year)

/**
 * Check if a month is high season for a given province
 */
export function isHighSeason(province: string, month: number): boolean {
  // Universal rules: April and December are always high season
  if (UNIVERSAL_HIGH_SEASONS.includes(month)) {
    return true;
  }
  
  // Check zone-based rules
  const zone = PROVINCE_ZONES[province];
  if (zone) {
    const zoneMonths = ZONE_HIGH_SEASONS[zone];
    return zoneMonths.includes(month);
  }
  
  return false;
}

/**
 * Get high season months for a given province
 */
export function getHighSeasonMonths(province: string): number[] {
  const zone = PROVINCE_ZONES[province];
  const zoneMonths = zone ? ZONE_HIGH_SEASONS[zone] : [];
  
  // Combine zone months with universal months and remove duplicates
  const allMonths = [...new Set([...zoneMonths, ...UNIVERSAL_HIGH_SEASONS])];
  return allMonths.sort((a, b) => a - b);
}

/**
 * Get zone name for a province
 */
export function getProvinceZone(province: string): string | null {
  return PROVINCE_ZONES[province] || null;
}

