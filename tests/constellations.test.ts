import { describe, it, expect } from "vitest";
import {
  skyStars,
  equatorialToHorizontal,
  constellationSegments,
} from "@/lib/astro/sky";
import { STARS, CONSTELLATIONS, STAR_BY_NAME } from "@/lib/astro/constellations";

const DATE = new Date("2024-12-21T22:00:00Z");

describe("constellation data integrity", () => {
  it("stars have valid coordinates and unique names", () => {
    const names = new Set<string>();
    for (const s of STARS) {
      expect(s.ra).toBeGreaterThanOrEqual(0);
      expect(s.ra).toBeLessThan(24);
      expect(Math.abs(s.dec)).toBeLessThanOrEqual(90);
      expect(names.has(s.name)).toBe(false);
      names.add(s.name);
    }
  });

  it("every constellation line references known stars", () => {
    for (const c of CONSTELLATIONS) {
      for (const [a, b] of c.lines) {
        expect(STAR_BY_NAME[a], `${c.name}: ${a}`).toBeDefined();
        expect(STAR_BY_NAME[b], `${c.name}: ${b}`).toBeDefined();
      }
    }
  });
});

describe("equatorialToHorizontal", () => {
  it("at the North Pole, a star's altitude equals its declination", () => {
    const pole = { lat: 90, lon: 0 };
    for (const name of ["Dubhe", "Vega", "Acrux"]) {
      const s = STAR_BY_NAME[name];
      const h = equatorialToHorizontal(s.ra, s.dec, pole, DATE);
      expect(Math.abs(h.elevationDeg - s.dec)).toBeLessThan(1.5);
    }
  });
});

describe("skyStars", () => {
  it("returns bounded az/alt and consistent above-horizon flags", () => {
    const stars = skyStars({ lat: 13.08, lon: 80.27 }, DATE);
    expect(stars.length).toBe(STARS.length);
    for (const s of stars) {
      expect(s.azimuthDeg).toBeGreaterThanOrEqual(0);
      expect(s.azimuthDeg).toBeLessThanOrEqual(360);
      expect(s.elevationDeg).toBeGreaterThanOrEqual(-90);
      expect(s.elevationDeg).toBeLessThanOrEqual(90);
      expect(s.aboveHorizon).toBe(s.elevationDeg > 0);
    }
  });
});

describe("constellationSegments", () => {
  it("only returns segments with both endpoints above the horizon", () => {
    const segs = constellationSegments({ lat: 13.08, lon: 80.27 }, DATE);
    for (const seg of segs) {
      expect(seg.a.elevationDeg).toBeGreaterThan(0);
      expect(seg.b.elevationDeg).toBeGreaterThan(0);
    }
  });
});
