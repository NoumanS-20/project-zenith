import {
  Observer,
  Equator,
  Horizon,
  Illumination,
  Body,
} from "astronomy-engine";
import type { GeoCoord, SkyBody } from "@/lib/types";
import { STARS, CONSTELLATIONS, STAR_BY_NAME } from "./constellations";

function observerOf(loc: GeoCoord): Observer {
  return new Observer(loc.lat, loc.lon, loc.alt ?? 0);
}

/** Convert equatorial coords (RA hours, Dec deg) → horizontal (az/alt deg). */
export function equatorialToHorizontal(
  raHours: number,
  decDeg: number,
  loc: GeoCoord,
  date: Date,
): { azimuthDeg: number; elevationDeg: number } {
  const hor = Horizon(date, observerOf(loc), raHours, decDeg, "normal");
  return { azimuthDeg: hor.azimuth, elevationDeg: hor.altitude };
}

/** Horizontal coordinates (az/alt, degrees) of a body for an observer + time. */
export function bodyHorizontal(
  body: Body,
  loc: GeoCoord,
  date: Date,
): { azimuthDeg: number; elevationDeg: number } {
  const obs = observerOf(loc);
  const eq = Equator(body, date, obs, true, true);
  const hor = Horizon(date, obs, eq.ra, eq.dec, "normal");
  return { azimuthDeg: hor.azimuth, elevationDeg: hor.altitude };
}

/** Sun altitude in degrees (negative = below horizon). */
export function sunAltitude(loc: GeoCoord, date: Date): number {
  return bodyHorizontal(Body.Sun, loc, date).elevationDeg;
}

export type TwilightPhase = "day" | "civil" | "nautical" | "astronomical" | "night";

/** Classify darkness from the Sun's altitude. */
export function twilightPhase(sunAltDeg: number): TwilightPhase {
  if (sunAltDeg > 0) return "day";
  if (sunAltDeg > -6) return "civil";
  if (sunAltDeg > -12) return "nautical";
  if (sunAltDeg > -18) return "astronomical";
  return "night";
}

/** Dark enough for satellite/star observing (past civil twilight). */
export function isNight(loc: GeoCoord, date: Date): boolean {
  return sunAltitude(loc, date) < -6;
}

export type MoonInfo = {
  illumination: number; // 0..1 lit fraction
  azimuthDeg: number;
  elevationDeg: number;
  aboveHorizon: boolean;
  phaseName: string;
};

function moonPhaseName(fraction: number, date: Date): string {
  // Use illumination fraction + a coarse waxing/waning split via 1-day delta.
  const next = Illumination(Body.Moon, new Date(date.getTime() + 86_400_000))
    .phase_fraction;
  const waxing = next >= fraction;
  if (fraction < 0.03) return "New Moon";
  if (fraction > 0.97) return "Full Moon";
  if (Math.abs(fraction - 0.5) < 0.06) return waxing ? "First Quarter" : "Last Quarter";
  if (fraction < 0.5) return waxing ? "Waxing Crescent" : "Waning Crescent";
  return waxing ? "Waxing Gibbous" : "Waning Gibbous";
}

export function moonInfo(loc: GeoCoord, date: Date): MoonInfo {
  const illum = Illumination(Body.Moon, date);
  const hor = bodyHorizontal(Body.Moon, loc, date);
  return {
    illumination: illum.phase_fraction,
    azimuthDeg: hor.azimuthDeg,
    elevationDeg: hor.elevationDeg,
    aboveHorizon: hor.elevationDeg > 0,
    phaseName: moonPhaseName(illum.phase_fraction, date),
  };
}

const SKY_PLANETS: { body: Body; name: string }[] = [
  { body: Body.Mercury, name: "Mercury" },
  { body: Body.Venus, name: "Venus" },
  { body: Body.Mars, name: "Mars" },
  { body: Body.Jupiter, name: "Jupiter" },
  { body: Body.Saturn, name: "Saturn" },
];

/** Sun, Moon, and naked-eye planets as SkyBody[] for the sky map. */
export function skyBodies(loc: GeoCoord, date: Date): SkyBody[] {
  const out: SkyBody[] = [];

  const sun = bodyHorizontal(Body.Sun, loc, date);
  out.push({
    name: "Sun",
    kind: "sun",
    azimuthDeg: sun.azimuthDeg,
    elevationDeg: sun.elevationDeg,
    aboveHorizon: sun.elevationDeg > 0,
  });

  const m = moonInfo(loc, date);
  out.push({
    name: "Moon",
    kind: "moon",
    azimuthDeg: m.azimuthDeg,
    elevationDeg: m.elevationDeg,
    illumination: m.illumination,
    aboveHorizon: m.aboveHorizon,
  });

  for (const p of SKY_PLANETS) {
    const hor = bodyHorizontal(p.body, loc, date);
    let magnitude: number | undefined;
    try {
      magnitude = Illumination(p.body, date).mag;
    } catch {
      magnitude = undefined;
    }
    out.push({
      name: p.name,
      kind: "planet",
      azimuthDeg: hor.azimuthDeg,
      elevationDeg: hor.elevationDeg,
      magnitude,
      aboveHorizon: hor.elevationDeg > 0,
    });
  }

  return out;
}

export type SkyStar = {
  name: string;
  azimuthDeg: number;
  elevationDeg: number;
  magnitude: number;
  aboveHorizon: boolean;
};

/** Bright catalogue stars in horizontal coordinates for the observer + time. */
export function skyStars(loc: GeoCoord, date: Date): SkyStar[] {
  return STARS.map((s) => {
    const hor = equatorialToHorizontal(s.ra, s.dec, loc, date);
    return {
      name: s.name,
      azimuthDeg: hor.azimuthDeg,
      elevationDeg: hor.elevationDeg,
      magnitude: s.mag,
      aboveHorizon: hor.elevationDeg > 0,
    };
  });
}

export type ConstellationSegment = {
  constellation: string;
  a: { azimuthDeg: number; elevationDeg: number };
  b: { azimuthDeg: number; elevationDeg: number };
};

/**
 * Constellation line segments where BOTH endpoint stars are above the horizon,
 * in horizontal coords — ready to draw on the sky map.
 */
export function constellationSegments(
  loc: GeoCoord,
  date: Date,
): ConstellationSegment[] {
  const out: ConstellationSegment[] = [];
  for (const c of CONSTELLATIONS) {
    for (const [an, bn] of c.lines) {
      const sa = STAR_BY_NAME[an];
      const sb = STAR_BY_NAME[bn];
      if (!sa || !sb) continue;
      const a = equatorialToHorizontal(sa.ra, sa.dec, loc, date);
      const b = equatorialToHorizontal(sb.ra, sb.dec, loc, date);
      if (a.elevationDeg > 0 && b.elevationDeg > 0) {
        out.push({ constellation: c.name, a, b });
      }
    }
  }
  return out;
}
