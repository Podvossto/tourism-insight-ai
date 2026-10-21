import { describe, expect, it } from "vitest";

import {
  COMMON_FESTIVALS,
  getAvailableFestivals,
  getProvinceSpecificFestivals,
} from "./festivalLogic";

describe("getAvailableFestivals", () => {
  it("returns only common festivals without a province", () => {
    expect(getAvailableFestivals()).toEqual(COMMON_FESTIVALS);
  });

  it("appends province-specific festivals after the common ones", () => {
    const list = getAvailableFestivals("เชียงใหม่");
    expect(list.length).toBeGreaterThan(COMMON_FESTIVALS.length);
    expect(list.map((f) => f.value)).toContain(
      "Festival_Yi_Peng_Lantern_Festival_Chiang_Mai"
    );
  });

  it("does not add anything for unknown provinces", () => {
    expect(getAvailableFestivals("unknown")).toEqual(COMMON_FESTIVALS);
  });
});

describe("getProvinceSpecificFestivals", () => {
  it("returns an empty list for provinces without festivals", () => {
    expect(getProvinceSpecificFestivals("unknown")).toEqual([]);
  });
});
