import Papa from 'papaparse';
import type { ProvinceData } from '@/types/tourism';

interface CSVRow {
  'Income(Million Baht)': string;
  'Tourism_Amount': string;
  'Year_2023'?: string;
  'Year_2024'?: string;
  'Year_2025'?: string;
  [key: string]: string | undefined;
}

export async function loadHistoricalData(): Promise<Record<string, ProvinceData>> {
  try {
    const response = await fetch('/data/tourism-historical.csv');
    const csvText = await response.text();
    
    const parsed = Papa.parse<CSVRow>(csvText, {
      header: true,
      skipEmptyLines: true,
    });

    const provinceData: Record<string, ProvinceData> = {};
    
    // Group data by province
    const provinceMap: Record<string, Array<{ year: number; income: number; tourists: number }>> = {};
    
    parsed.data.forEach((row) => {
      // Find which province this row belongs to
      const provinceKey = Object.keys(row).find(key => key.startsWith('Province_') && row[key] === '1');
      if (!provinceKey) return;
      
      const provinceName = provinceKey.replace('Province_', '');
      
      // Find year
      let year = 2024; // default
      if (row['Year_2023'] === '1') year = 2023;
      if (row['Year_2024'] === '1') year = 2024;
      if (row['Year_2025'] === '1') year = 2025;
      
      const income = parseFloat(row['Income(Million Baht)']) || 0;
      const tourists = parseFloat(row['Tourism_Amount']) || 0;
      
      if (!provinceMap[provinceName]) {
        provinceMap[provinceName] = [];
      }
      
      provinceMap[provinceName].push({ year, income, tourists });
    });
    
    // Convert to ProvinceData format
    Object.entries(provinceMap).forEach(([provinceName, data]) => {
      // Calculate average for the province
      const avgIncome = data.reduce((sum, d) => sum + d.income, 0) / data.length;
      const avgTourists = data.reduce((sum, d) => sum + d.tourists, 0) / data.length;
      
      // Get trend data by year
      const yearMap: Record<number, { income: number[]; tourists: number[] }> = {};
      data.forEach(({ year, income, tourists }) => {
        if (!yearMap[year]) {
          yearMap[year] = { income: [], tourists: [] };
        }
        yearMap[year].income.push(income);
        yearMap[year].tourists.push(tourists);
      });
      
      const trends = Object.entries(yearMap)
        .map(([year, values]) => ({
          year: parseInt(year),
          revenue: values.income.reduce((sum, v) => sum + v, 0) / values.income.length * 1000, // Convert to thousands
          tourists: values.tourists.reduce((sum, v) => sum + v, 0) / values.tourists.length / 1000000, // Convert to millions
        }))
        .sort((a, b) => a.year - b.year);
      
      provinceData[provinceName] = {
        province: provinceName,
        provinceThai: provinceName,
        year: 2024,
        predicted_income_million_baht: avgIncome,
        predicted_tourism_amount_people: avgTourists,
        trends,
        festivalImpact: [
          { festival: "ปกติ", impact: 1, revenue: avgIncome * 0.7 },
          { festival: "สงกรานต์", impact: 1.5, revenue: avgIncome * 1.1 },
          { festival: "ลอยกระทง", impact: 1.2, revenue: avgIncome * 0.85 },
        ],
      };
    });
    
    return provinceData;
  } catch (error) {
    console.error('Error loading CSV data:', error);
    return {};
  }
}
