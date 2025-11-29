// Mapping between Thai province names (from CSV) and map province names
// The map uses English names or specific Thai name formats
export const PROVINCE_NAME_MAP: Record<string, string> = {
  "กระบี่": "Krabi",
  "กรุงเทพมหานคร": "Bangkok",
  "กาญจนบุรี": "Kanchanaburi",
  "กาฬสินธุ์": "Kalasin",
  "กำแพงเพชร": "Kamphaeng Phet",
  "ขอนแก่น": "Khon Kaen",
  "จันทบุรี": "Chanthaburi",
  "ฉะเชิงเทรา": "Chachoengsao",
  "ชลบุรี": "Chon Buri",
  "ชัยนาท": "Chai Nat",
  "ชัยภูมิ": "Chaiyaphum",
  "ชุมพร": "Chumphon",
  "เชียงราย": "Chiang Rai",
  "เชียงใหม่": "Chiang Mai",
  "ตรัง": "Trang",
  "ตราด": "Trat",
  "ตาก": "Tak",
  "นครนายก": "Nakhon Nayok",
  "นครปฐม": "Nakhon Pathom",
  "นครพนม": "Nakhon Phanom",
  "นครราชสีมา": "Nakhon Ratchasima",
  "นครศรีธรรมราช": "Nakhon Si Thammarat",
  "นครสวรรค์": "Nakhon Sawan",
  "นนทบุรี": "Nonthaburi",
  "นราธิวาส": "Narathiwat",
  "น่าน": "Nan",
  "บึงกาฬ": "Bueng Kan",
  "บุรีรัมย์": "Buri Ram",
  "ปทุมธานี": "Pathum Thani",
  "ประจวบคีรีขันธ์": "Prachuap Khiri Khan",
  "ปราจีนบุรี": "Prachin Buri",
  "ปัตตานี": "Pattani",
  "พระนครศรีอยุธยา": "Phra Nakhon Si Ayutthaya",
  "พะเยา": "Phayao",
  "พังงา": "Phangnga",
  "พัทลุง": "Phatthalung",
  "พิจิตร": "Phichit",
  "พิษณุโลก": "Phitsanulok",
  "เพชรบุรี": "Phetchaburi",
  "เพชรบูรณ์": "Phetchabun",
  "แพร่": "Phrae",
  "ภูเก็ต": "Phuket",
  "มหาสารคาม": "Maha Sarakham",
  "มุกดาหาร": "Mukdahan",
  "แม่ฮ่องสอน": "Mae Hong Son",
  "ยโสธร": "Yasothon",
  "ยะลา": "Yala",
  "ร้อยเอ็ด": "Roi Et",
  "ระนอง": "Ranong",
  "ระยอง": "Rayong",
  "ราชบุรี": "Ratchaburi",
  "ลพบุรี": "Lop Buri",
  "ลำปาง": "Lampang",
  "ลำพูน": "Lamphun",
  "เลย": "Loei",
  "ศรีสะเกษ": "Si Sa Ket",
  "สกลนคร": "Sakon Nakhon",
  "สงขลา": "Songkhla",
  "สตูล": "Satun",
  "สมุทรปราการ": "Samut Prakan",
  "สมุทรสงคราม": "Samut Songkhram",
  "สมุทรสาคร": "Samut Sakhon",
  "สระแก้ว": "Sa Kaeo",
  "สระบุรี": "Saraburi",
  "สิงห์บุรี": "Sing Buri",
  "สุโขทัย": "Sukhothai",
  "สุพรรณบุรี": "Suphan Buri",
  "สุราษฎร์ธานี": "Surat Thani",
  "สุรินทร์": "Surin",
  "หนองคาย": "Nong Khai",
  "หนองบัวลำภู": "Nong Bua Lamphu",
  "อ่างทอง": "Ang Thong",
  "อำนาจเจริญ": "Amnat Charoen",
  "อุดรธานี": "Udon Thani",
  "อุตรดิตถ์": "Uttaradit",
  "อุทัยธานี": "Uthai Thani",
  "อุบลราชธานี": "Ubon Ratchathani",
};

// Reverse mapping: English name -> Thai name
export const REVERSE_PROVINCE_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(PROVINCE_NAME_MAP).map(([thai, english]) => [english, thai])
);

// Additional mappings for common variations and misspellings
const PROVINCE_NAME_VARIATIONS: Record<string, string> = {
  "ศรีษะเกษ": "ศรีสะเกษ", // Fix misspelling
  "กรุงเทพ": "กรุงเทพมหานคร", // Short form
  "Bangkok Metropolis": "Bangkok", // Map variation
  "Bangkok": "Bangkok", // Keep as is
  "Nong Bua Lam Phu": "Nong Bua Lamphu", // Map variation (with space)
  "Nong Bua Lamphu": "Nong Bua Lamphu", // Standard form
};

export function getMapProvinceName(thaiName: string): string {
  // First check for variations/misspellings
  const correctedName = PROVINCE_NAME_VARIATIONS[thaiName] || thaiName;
  // Then map to English name
  return PROVINCE_NAME_MAP[correctedName] || correctedName;
}

export function getThaiProvinceName(mapName: string): string {
  // First try reverse mapping
  let thaiName = REVERSE_PROVINCE_MAP[mapName];
  
  // If not found, try variations
  if (!thaiName) {
    // Check if mapName is a variation
    for (const [variation, standard] of Object.entries(PROVINCE_NAME_VARIATIONS)) {
      if (variation === mapName || standard === mapName) {
        thaiName = REVERSE_PROVINCE_MAP[standard] || standard;
        break;
      }
    }
  }
  
  return thaiName || mapName;
}

/**
 * Get English province name from Thai name or English name
 * Always returns English name for display
 */
export function getEnglishProvinceName(provinceName: string): string {
  // If already English (exists in REVERSE_PROVINCE_MAP values), return as is
  if (REVERSE_PROVINCE_MAP[provinceName]) {
    return provinceName;
  }
  
  // If Thai name, convert to English
  const englishName = getMapProvinceName(provinceName);
  
  // If conversion failed, check if it's already English
  if (englishName === provinceName) {
    // Check if it's a variation
    for (const [variation, standard] of Object.entries(PROVINCE_NAME_VARIATIONS)) {
      if (variation === provinceName || standard === provinceName) {
        return standard;
      }
    }
    return provinceName; // Return as is if no mapping found
  }
  
  return englishName;
}

