import { describe, expect, it } from "vitest";

import { parseHistoricalData, parseQuarterPredictions } from "./csvLoader";

const HEADER =
  "Income(Million Baht),Tourism_Amount,Year_2024,Year_2025,Month_1,Month_2,Province_Phuket,Province_Krabi,Tourism_Type_Foreign,Tourism_Type_Thai";

describe("parseHistoricalData", () => {
  const csv = [
    HEADER,
    "100,1000,1,0,1,0,1,0,0,1",
    "300,3000,0,1,0,1,1,0,0,1",
    "50,500,0,1,1,0,0,1,1,0",
  ].join("\n");

  it("groups rows by province", () => {
    const data = parseHistoricalData(csv);
    expect(Object.keys(data).sort()).toEqual(["Krabi", "Phuket"]);
  });

  it("uses the latest year and month as the headline value", () => {
    const phuket = parseHistoricalData(csv)["Phuket"];
    expect(phuket.year).toBe(2025);
    expect(phuket.predicted_income_million_baht).toBe(300);
    expect(phuket.predicted_tourism_amount_people).toBe(3000);
  });

  it("builds a sorted monthly history and yearly trend", () => {
    const phuket = parseHistoricalData(csv)["Phuket"];
    expect(phuket.monthlyHistory?.map((d) => [d.year, d.month])).toEqual([
      [2024, 1],
      [2025, 2],
    ]);
    expect(phuket.trends?.map((t) => t.year)).toEqual([2024, 2025]);
  });

  it("skips rows without a province flag", () => {
    const data = parseHistoricalData(
      [HEADER, "10,10,1,0,1,0,0,0,0,1"].join("\n")
    );
    expect(data).toEqual({});
  });
});

describe("parseQuarterPredictions", () => {
  const csv = [
    HEADER,
    "10,100,0,1,1,0,1,0,0,1",
    "90,900,0,1,0,1,0,1,1,0",
  ].join("\n");

  it("parses type, month and values", () => {
    const rows = parseQuarterPredictions(csv);
    expect(rows).toHaveLength(2);
    const krabi = rows.find((r) => r.province === "Krabi");
    expect(krabi).toMatchObject({
      tourism_type: "Foreign",
      month: 2,
      year: 2025,
      predicted_income_million_baht: 90,
      predicted_tourism_amount_people: 900,
    });
  });

  it("sorts by predicted income, highest first", () => {
    const rows = parseQuarterPredictions(csv);
    expect(rows.map((r) => r.province)).toEqual(["Krabi", "Phuket"]);
  });
});
