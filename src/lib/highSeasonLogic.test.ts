import { describe, expect, it } from "vitest";

import {
  getHighSeasonMonths,
  getProvinceZone,
  isHighSeason,
} from "./highSeasonLogic";

describe("isHighSeason", () => {
  it("treats April and December as high season everywhere", () => {
    expect(isHighSeason("ขอนแก่น", 4)).toBe(true);
    expect(isHighSeason("ขอนแก่น", 12)).toBe(true);
  });

  it("uses the zone calendar for mapped provinces", () => {
    expect(isHighSeason("เชียงใหม่", 1)).toBe(true);
    expect(isHighSeason("เชียงใหม่", 6)).toBe(false);
    expect(isHighSeason("ภูเก็ต", 3)).toBe(true);
  });

  it("returns false for unmapped provinces outside universal months", () => {
    expect(isHighSeason("ขอนแก่น", 6)).toBe(false);
  });
});

describe("getHighSeasonMonths", () => {
  it("merges zone and universal months, sorted and unique", () => {
    expect(getHighSeasonMonths("เชียงใหม่")).toEqual([1, 2, 4, 11, 12]);
  });

  it("falls back to universal months for unmapped provinces", () => {
    expect(getHighSeasonMonths("ขอนแก่น")).toEqual([4, 12]);
  });
});

describe("getProvinceZone", () => {
  it("returns the zone or null", () => {
    expect(getProvinceZone("ภูเก็ต")).toBe("andaman");
    expect(getProvinceZone("ขอนแก่น")).toBeNull();
  });
});
