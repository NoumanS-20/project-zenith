import { describe, it, expect } from "vitest";
import { computeObservationScore } from "@/lib/astro/score";

describe("computeObservationScore", () => {
  it("scores ideal conditions near 100 / Excellent", () => {
    const r = computeObservationScore({
      cloudCoverPct: 0,
      isNight: true,
      moonIllumination: 0,
      bestElevationDeg: 90,
      visibilityKm: 10,
    });
    expect(r.score).toBeGreaterThanOrEqual(95);
    expect(r.grade).toBe("Excellent");
  });

  it("scores terrible conditions low / Poor", () => {
    const r = computeObservationScore({
      cloudCoverPct: 100,
      isNight: false,
      moonIllumination: 1,
      bestElevationDeg: 0,
      visibilityKm: 0,
    });
    expect(r.score).toBeLessThan(20);
    expect(r.grade).toBe("Poor");
  });

  it("stays within 0..100", () => {
    const r = computeObservationScore({
      isNight: true,
      moonIllumination: 0.5,
      bestElevationDeg: 45,
    });
    expect(r.score).toBeGreaterThanOrEqual(0);
    expect(r.score).toBeLessThanOrEqual(100);
  });

  it("penalizes daylight relative to night", () => {
    const common = {
      cloudCoverPct: 10,
      moonIllumination: 0.2,
      bestElevationDeg: 60,
      visibilityKm: 10,
    };
    const night = computeObservationScore({ ...common, isNight: true });
    const day = computeObservationScore({ ...common, isNight: false });
    expect(night.score).toBeGreaterThan(day.score);
  });

  it("produces a human-readable summary", () => {
    const r = computeObservationScore({
      cloudCoverPct: 5,
      isNight: true,
      moonIllumination: 0.1,
      bestElevationDeg: 80,
    });
    expect(r.summary).toMatch(/Dark skies/);
    expect(r.summary.endsWith(".")).toBe(true);
  });
});
