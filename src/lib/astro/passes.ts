import type { GeoCoord, SatPass, TleRecord } from "@/lib/types";
import { toSatrec, lookAnglesFor } from "./propagate";
import { sunAltitude } from "./sky";

/** 16-point compass label for an azimuth in degrees. */
export function azToCompass(deg: number): string {
  const dirs = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW",
  ];
  return dirs[Math.round(((deg % 360) / 22.5)) % 16];
}

function quality(maxEl: number): SatPass["visibilityQuality"] {
  if (maxEl >= 70) return "excellent";
  if (maxEl >= 40) return "good";
  if (maxEl >= 20) return "fair";
  return "poor";
}

export type PassOptions = {
  hours?: number; // look-ahead window
  stepSec?: number; // sampling resolution
  minMaxElevationDeg?: number; // ignore passes lower than this
  maxResults?: number;
};

/**
 * Predict upcoming passes for a satellite over an observer using local SGP4.
 * Walks the look-ahead window sampling elevation, detecting rise → peak → set,
 * and tags each pass with visibility quality + whether the sky is dark at peak.
 */
export function predictPasses(
  rec: TleRecord,
  observer: GeoCoord,
  fromEpochMs: number,
  opts: PassOptions = {},
): SatPass[] {
  const satrec = toSatrec(rec);
  if (!satrec) return [];

  const hours = opts.hours ?? 24;
  const stepMs = (opts.stepSec ?? 30) * 1000;
  const minMaxEl = opts.minMaxElevationDeg ?? 10;
  const maxResults = opts.maxResults ?? 6;
  const endMs = fromEpochMs + hours * 3_600_000;

  const passes: SatPass[] = [];
  let inPass = false;
  let cur: {
    start: number;
    startAz: number;
    peak: number;
    maxEl: number;
    samples: { t: number; elevationDeg: number; azimuthDeg: number }[];
  } | null = null;

  for (let t = fromEpochMs; t <= endMs; t += stepMs) {
    const la = lookAnglesFor(satrec, observer, new Date(t));
    if (!la) continue;
    const el = la.elevationDeg;

    if (!inPass && el > 0) {
      inPass = true;
      cur = {
        start: t,
        startAz: la.azimuthDeg,
        peak: t,
        maxEl: el,
        samples: [{ t, elevationDeg: el, azimuthDeg: la.azimuthDeg }],
      };
    } else if (inPass && cur) {
      cur.samples.push({ t, elevationDeg: el, azimuthDeg: la.azimuthDeg });
      if (el > cur.maxEl) {
        cur.maxEl = el;
        cur.peak = t;
      }
      if (el <= 0) {
        inPass = false;
        if (cur.maxEl >= minMaxEl) {
          const sunAlt = sunAltitude(observer, new Date(cur.peak));
          passes.push({
            noradId: rec.noradId,
            startUtc: cur.start,
            peakUtc: cur.peak,
            endUtc: t,
            maxElevationDeg: cur.maxEl,
            startAzimuthDeg: cur.startAz,
            endAzimuthDeg: la.azimuthDeg,
            durationSec: Math.round((t - cur.start) / 1000),
            visibilityQuality: quality(cur.maxEl),
            visible: sunAlt < -6,
            sunAltAtPeakDeg: sunAlt,
            samples: cur.samples,
          });
          if (passes.length >= maxResults) break;
        }
        cur = null;
      }
    }
  }

  return passes;
}
