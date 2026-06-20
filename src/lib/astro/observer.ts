import type { GeoCoord, SatState, TleRecord } from "@/lib/types";
import { computeSatState } from "./propagate";

/** Scientific thresholds (degrees of elevation above the horizon). */
export const HORIZON_DEG = 0;
export const NEAR_ZENITH_DEG = 75;
export const ZENITH_HIT_DEG = 85;

export type OverheadClass = "below" | "visible" | "near-zenith" | "zenith";

export function classifyElevation(elevationDeg: number): OverheadClass {
  if (elevationDeg < HORIZON_DEG) return "below";
  if (elevationDeg >= ZENITH_HIT_DEG) return "zenith";
  if (elevationDeg >= NEAR_ZENITH_DEG) return "near-zenith";
  return "visible";
}

/** Category weighting nudges hero objects (ISS, bright sats) up the ranking. */
const CATEGORY_WEIGHT: Record<string, number> = {
  stations: 12,
  brightest: 8,
  navigation: 3,
  weather: 3,
  starlink: 1,
  debris: 0,
  other: 0,
};

/**
 * Overhead ranking score. Elevation dominates (closeness to zenith), nudged by
 * object category so the ISS and bright objects surface first when elevations
 * are comparable.
 */
export function overheadRank(s: SatState): number {
  const el = s.elevationDeg ?? -90;
  return el + (CATEGORY_WEIGHT[s.category] ?? 0);
}

/**
 * Compute states for all TLEs against an observer at an instant, keep only those
 * above the horizon, and rank them by zenith-closeness. This is the function the
 * Web Worker runs off the main thread.
 */
export function computeOverhead(
  tles: TleRecord[],
  observer: GeoCoord,
  epochMs: number,
  opts: { minElevationDeg?: number } = {},
): SatState[] {
  const date = new Date(epochMs);
  const minEl = opts.minElevationDeg ?? HORIZON_DEG;
  const states: SatState[] = [];
  for (const rec of tles) {
    const st = computeSatState(rec, observer, date);
    if (!st || st.elevationDeg === undefined) continue;
    if (st.elevationDeg >= minEl) states.push(st);
  }
  states.sort((a, b) => overheadRank(b) - overheadRank(a));
  return states;
}

/** Compute states for ALL tles (no horizon filter) — used for globe rendering. */
export function computeAllStates(
  tles: TleRecord[],
  observer: GeoCoord,
  epochMs: number,
): SatState[] {
  const date = new Date(epochMs);
  const out: SatState[] = [];
  for (const rec of tles) {
    const st = computeSatState(rec, observer, date);
    if (st) out.push(st);
  }
  return out;
}
