import { describe, it, expect } from "vitest";
import {
  toSatrec,
  propagateSubpoint,
  lookAnglesFor,
  computeSatState,
} from "@/lib/astro/propagate";
import { FALLBACK_TLES } from "@/lib/fixtures/tle";

const ISS = FALLBACK_TLES.find((t) => t.noradId === 25544)!;
// A date close to the fixture epoch (2024 day ~170) keeps SGP4 well-conditioned.
const DATE = new Date("2024-06-18T12:00:00Z");

describe("toSatrec (TLE parsing)", () => {
  it("parses a valid ISS TLE", () => {
    const satrec = toSatrec(ISS);
    expect(satrec).not.toBeNull();
    expect(satrec!.satnum).toBe("25544");
  });

  it("returns null for garbage element lines", () => {
    const bad = toSatrec({ line1: "not a tle", line2: "also not a tle" });
    expect(bad).toBeNull();
  });
});

describe("propagateSubpoint", () => {
  it("yields a plausible ISS subpoint and speed", () => {
    const satrec = toSatrec(ISS)!;
    const sp = propagateSubpoint(satrec, DATE);
    expect(sp).not.toBeNull();
    // ISS orbits ~400-420 km; allow generous bounds for epoch drift.
    expect(sp!.altKm).toBeGreaterThan(370);
    expect(sp!.altKm).toBeLessThan(470);
    // Orbital speed ~7.66 km/s
    expect(sp!.velocityKmS).toBeGreaterThan(7.4);
    expect(sp!.velocityKmS).toBeLessThan(7.9);
    // Latitude bounded by inclination 51.6°
    expect(Math.abs(sp!.lat)).toBeLessThanOrEqual(52.5);
    expect(sp!.lon).toBeGreaterThanOrEqual(-180);
    expect(sp!.lon).toBeLessThanOrEqual(180);
  });
});

describe("lookAnglesFor (observer az/el)", () => {
  it("produces azimuth 0..360 and elevation -90..90", () => {
    const satrec = toSatrec(ISS)!;
    const la = lookAnglesFor(satrec, { lat: 13.08, lon: 80.27 }, DATE);
    expect(la).not.toBeNull();
    expect(la!.azimuthDeg).toBeGreaterThanOrEqual(0);
    expect(la!.azimuthDeg).toBeLessThanOrEqual(360);
    expect(la!.elevationDeg).toBeGreaterThanOrEqual(-90);
    expect(la!.elevationDeg).toBeLessThanOrEqual(90);
    expect(la!.rangeKm).toBeGreaterThan(0);
  });

  it("sees the satellite near zenith from directly beneath it", () => {
    const satrec = toSatrec(ISS)!;
    const sp = propagateSubpoint(satrec, DATE)!;
    const la = lookAnglesFor(satrec, { lat: sp.lat, lon: sp.lon }, DATE)!;
    // Observer at the subpoint should see it very high in the sky.
    expect(la.elevationDeg).toBeGreaterThan(80);
  });
});

describe("computeSatState", () => {
  it("returns a fully-populated state", () => {
    const st = computeSatState(ISS, { lat: 13.08, lon: 80.27 }, DATE);
    expect(st).not.toBeNull();
    expect(st!.noradId).toBe(25544);
    expect(st!.elevationDeg).toBeTypeOf("number");
    expect(st!.azimuthDeg).toBeTypeOf("number");
    expect(st!.timestamp).toBe(DATE.getTime());
  });
});
