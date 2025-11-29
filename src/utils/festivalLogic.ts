// Festival Logic: Common vs Province-Specific

// Common festivals (available for all provinces)
export const COMMON_FESTIVALS = [
  { label: "New Year Festival", value: "Festival_New_Year_Festival" },
  { label: "Chinese New Year", value: "Festival_Chinese_New_Year" },
  { label: "Makha Bucha Day", value: "Festival_Makha_Bucha_Day" },
  { label: "Songkran Festival (General)", value: "Festival_Songkran_Festival" },
  { label: "Chakri Memorial Day", value: "Festival_Chakri_Memorial_Day" },
  { label: "Labour Day", value: "Festival_National_Labour_Day" },
  { label: "Coronation Day", value: "Festival_Coronation_Day" },
  { label: "Visakha Bucha Day", value: "Festival_Visakha_Bucha_Day" },
  { label: "Queen Suthida's Birthday", value: "Festival_Queen_Suthida's_Birthday" },
  { label: "Asalha Bucha Day", value: "Festival_Asalha_Bucha_Day" },
  { label: "Buddhist Lent (Khao Phansa)", value: "Festival_Buddhist_Lent_Khao_Phansa" },
  { label: "King Rama X Birthday", value: "Festival_King_Maha_Vajiralongkorn's_Birthday" },
  { label: "Mother's Day", value: "Festival_Queen_Sirikit's_Birthday_/_Mother's_Day" },
  { label: "End of Buddhist Lent (Ok Phansa)", value: "Festival_End_of_Buddhist_Lent_Ok_Phansa" },
  { label: "Loy Krathong (General)", value: "Festival_Loy_Krathong" },
  { label: "Father's Day", value: "Festival_King_Bhumibol's_Birthday_/_Father's_Day" },
  { label: "Constitution Day", value: "Festival_Constitution_Day" },
  { label: "Children's Day", value: "Festival_Children's_Day" },
  { label: "Teachers' Day", value: "Festival_National_Teachers'_Day" },
];

// Province-specific festivals
const PROVINCE_FESTIVALS: Record<string, Array<{ label: string; value: string }>> = {
  // Northern
  "เชียงใหม่": [
    { label: "Yi Peng Lantern Festival", value: "Festival_Yi_Peng_Lantern_Festival_Chiang_Mai" },
    { label: "Chiang Mai Flower Festival", value: "Festival_Chiang_Mai_Flower_Festival" },
    { label: "Bo Sang Umbrella Festival", value: "Festival_Bo_Sang_Umbrella_Festival_Chiang_Mai" },
  ],
  "เชียงราย": [
    { label: "Hmong New Year", value: "Festival_Hmong_New_Year_Chiang_Rai" },
    { label: "Chiang Rai Flower Festival", value: "Festival_Chiang_Rai_Flower_Festival" },
  ],
  "แพร่": [
    { label: "Phra That Cho Hae Festival", value: "Festival_Phra_That_Cho_Hae_Festival_Phrae" },
  ],
  "แม่ฮ่องสอน": [
    { label: "Poi Sang Long Festival", value: "Festival_Poi_Sang_Long_Festival_Mae_Hong_Son" },
  ],
  "ลำพูน": [
    { label: "Longan Fair", value: "Festival_Longan_Fair_Lamphun" },
  ],
  "สุโขทัย": [
    { label: "Loy Krathong & Candle Festival", value: "Festival_Sukhothai_Loy_Krathong_and_Candle_Festival" },
  ],
  
  // Northeast
  "เลย": [
    { label: "Phi Ta Khon (Ghost Festival)", value: "Festival_Ghost_Festival_Phi_Ta_Khon,_Loei" },
  ],
  "อุบลราชธานี": [
    { label: "Candle Festival", value: "Festival_Candle_Festival_Ubon_Ratchathani" },
  ],
  "ร้อยเอ็ด": [
    { label: "Bun Phawet Festival", value: "Festival_Bun_Phawet_Festival_Roi_Et" },
  ],
  "ขอนแก่น": [
    { label: "Silk Festival", value: "Festival_Silk_Festival_Khon_Kaen" },
  ],
  "หนองคาย": [
    { label: "Naga Fireball Festival", value: "Festival_Naga_Fireball_Festival_Nong_Khai" },
  ],
  "สุรินทร์": [
    { label: "Elephant Festival", value: "Festival_Elephant_Festival_Surin" },
  ],
  "ยโสธร": [
    { label: "Bun Bang Fai (Rocket Festival)", value: "Festival_Rocket_Festival_Bun_Bang_Fai" },
    { label: "Phaya Thaen Festival", value: "Festival_Phaya_Thaen_Festival_Yasothon" },
  ],
  "นครราชสีมา": [
    { label: "Phimai Historical Park Festival", value: "Festival_Phimai_Historical_Park_Festival_Nakhon_Ratchasima" },
  ],
  
  // Central
  "พระนครศรีอยุธยา": [
    { label: "World Heritage Fair", value: "Festival_Ayutthaya_World_Heritage_Fair" },
  ],
  "กรุงเทพมหานคร": [
    { label: "Intl. Dance & Music Festival", value: "Festival_Bangkok_International_Festival_of_Dance_&_Music" },
    { label: "Songkran on Khao San Road", value: "Festival_Bangkok_Songkran_on_Khao_San_Road" },
    { label: "Bangkok Design Week", value: "Festival_Bangkok_Design_Week" },
    { label: "Intl. Motor Show", value: "Festival_Bangkok_International_Motor_Show" },
  ],
  "สมุทรสงคราม": [
    { label: "Mae Klong Mackerel Festival", value: "Festival_Samut_Songkhram_Mae_Klong_Mackerel_Festival" },
  ],
  "สุพรรณบุรี": [
    { label: "Dragon Descendants Parade", value: "Festival_Suphan_Buri_Dragon_Descendants_Parade" },
  ],
  "นครปฐม": [
    { label: "Food Festival", value: "Festival_Nakhon_Pathom_Food_Festival" },
  ],
  "ประจวบคีรีขันธ์": [
    { label: "Hua Hin Jazz Festival", value: "Festival_Hua_Hin_Jazz_Festival" },
  ],
  
  // Eastern
  "ชลบุรี": [
    { label: "Pattaya Music Festival", value: "Festival_Pattaya_Music_Festival" },
    { label: "Intl. Fireworks Festival", value: "Festival_Pattaya_International_Fireworks_Festival" },
    { label: "Buffalo Racing Festival", value: "Festival_Chonburi_Buffalo_Racing_Festival" },
  ],
  "จันทบุรี": [
    { label: "Fruit Festival", value: "Festival_Chanthaburi_Fruit_Festival" },
    { label: "Laem Sing Beach Festival", value: "Festival_Laem_Sing_Beach_Festival_Chanthaburi" },
  ],
  "ตราด": [
    { label: "Marine Festival", value: "Festival_Trat_Marine_Festival" },
    { label: "Koh Chang Regatta", value: "Festival_Koh_Chang_Regatta" },
  ],
  "ระยอง": [
    { label: "Fruit Festival", value: "Festival_Rayong_Fruit_Festival" },
  ],
  
  // Southern
  "ภูเก็ต": [
    { label: "Vegetarian Festival", value: "Festival_Phuket_Vegetarian_Festival" },
    { label: "King's Cup Regatta", value: "Festival_Phuket_King's_Cup_Regatta" },
    { label: "Old Town Festival", value: "Festival_Phuket_Old_Town_Festival" },
  ],
  "ตรัง": [
    { label: "Underwater Wedding Ceremony", value: "Festival_Trang_Underwater_Wedding_Ceremony" },
  ],
  "ชุมพร": [
    { label: "Marine Festival", value: "Festival_Chumphon_Marine_Festival" },
  ],
  "สงขลา": [
    { label: "Seafood Festival", value: "Festival_Songkhla_Seafood_Festival" },
  ],
  "นครศรีธรรมราช": [
    { label: "Shadow Puppet Festival", value: "Festival_Nakhon_Si_Thammarat_Shadow_Puppet_Festival_Nang_Talung" },
  ],
  "สุราษฎร์ธานี": [
    { label: "Chak Phra Festival", value: "Festival_Surat_Thani_Chak_Phra_Festival" },
  ],
  "กระบี่": [
    { label: "Naga Fest (Ao Nang)", value: "Festival_Krabi_Naga_Fest_Ao_Nang_Beach" },
  ],
};

/**
 * Get all available festivals for a province (common + province-specific)
 */
export function getAvailableFestivals(province?: string): Array<{ label: string; value: string }> {
  const common = COMMON_FESTIVALS;
  const specific = province ? PROVINCE_FESTIVALS[province] || [] : [];
  return [...common, ...specific];
}

/**
 * Get only province-specific festivals
 */
export function getProvinceSpecificFestivals(province: string): Array<{ label: string; value: string }> {
  return PROVINCE_FESTIVALS[province] || [];
}

