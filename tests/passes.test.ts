import { describe, it, expect } from "vitest";
import { predictPasses, azToCompass } from "@/lib/astro/passes";
import { FALLBACK_TLES } from "@/lib/fixtures/tle";

const ISS = FALLBACK_TLES.find((t) => t.noradId === 25544)!;
const FROM = new Date("2024-06-18T00:00:00Z").getTime();

describe("azToCompass", () => {
  it("maps cardinal and intercardinal directions", () => {
    expect(azToCompass(0)).toBe("N");
    expect(azToCompass(90)).toBe("E");
    expect(azToCompass(180)).toBe("S");
    expect(azToCompass(270)).toBe("W");
    expect(azToCompass(45)).toBe("NE");
    expect(azToCompass(360)).toBe("N");
  });
});

describe("predictPasses", () => {
  it("finds well-formed ISS passes over a mid-latitude site in 24h", () => {
    const passes = predictPasses(ISS, { lat: 13.08, lon: 80.27 }, FROM, {
      hours: 24,
    });
    expect(passes.length).toBeGreaterThan(0);
    for (const p of passes) {
      expect(p.startUtc).toBeLessThan(p.endUtc);
      expect(p.peakUtc).toBeGreaterThanOrEqual(p.startUtc);
      expect(p.peakUtc).toBeLessThanOrEqual(p.endUtc);
      expect(p.maxElevationDeg).toBeGreaterThanOrEqual(10);
      expect(p.maxElevationDeg).toBeLessThanOrEqual(90);
      expect(p.durationSec).toBeGreaterThan(0);
      expect(p.samples.length).toBeGreaterThan(1);
      expect(["excellent", "good", "fair", "poor"]).toContain(p.visibilityQuality);
    }
  });

  it("respects the maxResults cap and chronological order", () => {
    const passes = predictPasses(ISS, { lat: 13.08, lon: 80.27 }, FROM, {
      hours: 24,
      maxResults: 3,
    });
    expect(passes.length).toBeLessThanOrEqual(3);
    for (let i = 1; i < passes.length; i++) {
      expect(passes[i].startUtc).toBeGreaterThan(passes[i - 1].startUtc);
    }
  });

  it("returns nothing for an unparseable TLE", () => {
    const bad = { ...ISS, line1: "garbage", line2: "garbage" };
    expect(predictPasses(bad, { lat: 0, lon: 0 }, FROM)).toEqual([]);
  });
});
