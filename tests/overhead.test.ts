import { describe, it, expect } from "vitest";
import {
  computeOverhead,
  classifyElevation,
  overheadRank,
} from "@/lib/astro/observer";
import { propagateSubpoint, toSatrec } from "@/lib/astro/propagate";
import { FALLBACK_TLES } from "@/lib/fixtures/tle";
import type { SatState } from "@/lib/types";

const ISS = FALLBACK_TLES.find((t) => t.noradId === 25544)!;
const DATE = new Date("2024-06-18T12:00:00Z");

describe("classifyElevation", () => {
  it("maps thresholds correctly", () => {
    expect(classifyElevation(-5)).toBe("below");
    expect(classifyElevation(10)).toBe("visible");
    expect(classifyElevation(78)).toBe("near-zenith");
    expect(classifyElevation(88)).toBe("zenith");
  });
});

describe("computeOverhead", () => {
  it("includes the ISS when the observer is beneath it, ranked first", () => {
    const sp = propagateSubpoint(toSatrec(ISS)!, DATE)!;
    const observer = { lat: sp.lat, lon: sp.lon };
    const result = computeOverhead(FALLBACK_TLES, observer, DATE.getTime());
    expect(result.length).toBeGreaterThan(0);
    expect(result[0].noradId).toBe(25544);
    expect(result[0].elevationDeg!).toBeGreaterThan(80);
  });

  it("filters out objects below the horizon", () => {
    const sp = propagateSubpoint(toSatrec(ISS)!, DATE)!;
    const observer = { lat: sp.lat, lon: sp.lon };
    const result = computeOverhead(FALLBACK_TLES, observer, DATE.getTime());
    for (const s of result) {
      expect(s.elevationDeg!).toBeGreaterThanOrEqual(0);
    }
  });

  it("respects a custom minimum elevation", () => {
    const sp = propagateSubpoint(toSatrec(ISS)!, DATE)!;
    const observer = { lat: sp.lat, lon: sp.lon };
    const result = computeOverhead(FALLBACK_TLES, observer, DATE.getTime(), {
      minElevationDeg: 75,
    });
    for (const s of result) {
      expect(s.elevationDeg!).toBeGreaterThanOrEqual(75);
    }
  });

  it("results are sorted by descending rank", () => {
    const observer = { lat: 0, lon: 0 };
    const result = computeOverhead(FALLBACK_TLES, observer, DATE.getTime());
    for (let i = 1; i < result.length; i++) {
      expect(overheadRank(result[i - 1])).toBeGreaterThanOrEqual(
        overheadRank(result[i]),
      );
    }
  });
});

describe("overheadRank", () => {
  it("breaks elevation ties in favor of stations", () => {
    const base = (cat: SatState["category"]): SatState => ({
      noradId: 1,
      name: "x",
      category: cat,
      lat: 0,
      lon: 0,
      altKm: 400,
      velocityKmS: 7.6,
      elevationDeg: 50,
      azimuthDeg: 100,
      rangeKm: 800,
      timestamp: 0,
    });
    expect(overheadRank(base("stations"))).toBeGreaterThan(
      overheadRank(base("debris")),
    );
  });
});
