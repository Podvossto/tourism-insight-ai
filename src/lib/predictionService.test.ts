import { describe, expect, it } from "vitest";

import { findPrecomputedPrediction } from "./predictionService";
import type { QuarterPrediction } from "@/types/tourism";

const rows: QuarterPrediction[] = [
  {
    province: "ภูเก็ต",
    year: 2025,
    month: 10,
    tourism_type: "Foreign",
    predicted_income_million_baht: 500,
    predicted_tourism_amount_people: 90000,
  },
];

describe("findPrecomputedPrediction", () => {
  it("matches province, type, month and year", () => {
    const hit = findPrecomputedPrediction(rows, {
      province: "ภูเก็ต",
      tourism_type: "Foreign",
      month: 10,
      year: 2025,
    });
    expect(hit?.predicted_income_million_baht).toBe(500);
  });

  it("returns undefined outside the precomputed range", () => {
    expect(
      findPrecomputedPrediction(rows, {
        province: "ภูเก็ต",
        tourism_type: "Foreign",
        month: 3,
        year: 2026,
      })
    ).toBeUndefined();
  });
});
