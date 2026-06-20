import {
  twoline2satrec,
  propagate,
  gstime,
  eciToGeodetic,
  eciToEcf,
  ecfToLookAngles,
  degreesLat,
  degreesLong,
  degreesToRadians,
  radiansToDegrees,
  type SatRec,
  type EciVec3,
} from "satellite.js";
import type { GeoCoord, TleRecord, SatState } from "@/lib/types";

/** Parse a TLE record into an SGP4 satrec, or null if the elements are bad. */
export function toSatrec(rec: Pick<TleRecord, "line1" | "line2">): SatRec | null {
  try {
    const satrec = twoline2satrec(rec.line1, rec.line2);
    // error is non-zero (SatRecError.None === 0) for unusable element sets
    if (satrec.error) return null;
    // twoline2satrec does not reject malformed lines — it produces NaN fields
    // with error 0. Reject those so garbage never reaches the propagator.
    if (
      !Number.isFinite(satrec.no) ||
      !Number.isFinite(satrec.ecco) ||
      !Number.isFinite(satrec.inclo) ||
      !Number.isFinite(satrec.jdsatepoch)
    ) {
      return null;
    }
    return satrec;
  } catch {
    return null;
  }
}

function magnitude(v: EciVec3<number>): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

export type SubpointState = {
  lat: number;
  lon: number;
  altKm: number;
  velocityKmS: number;
};

/** Propagate to a date → geodetic subpoint + speed. Null on propagation error. */
export function propagateSubpoint(satrec: SatRec, date: Date): SubpointState | null {
  const pv = propagate(satrec, date);
  if (!pv || !pv.position || !pv.velocity) return null;
  const { x, y, z } = pv.position;
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;

  const gmst = gstime(date);
  const geo = eciToGeodetic(pv.position, gmst);
  const lat = degreesLat(geo.latitude);
  const lon = degreesLong(geo.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  return {
    lat,
    lon,
    altKm: geo.height,
    velocityKmS: magnitude(pv.velocity),
  };
}

export type LookAngles = { azimuthDeg: number; elevationDeg: number; rangeKm: number };

/** Observer-relative look angles for a satrec at a given instant. */
export function lookAnglesFor(
  satrec: SatRec,
  observer: GeoCoord,
  date: Date,
): LookAngles | null {
  const pv = propagate(satrec, date);
  if (!pv || !pv.position) return null;
  const gmst = gstime(date);
  const ecf = eciToEcf(pv.position, gmst);
  const observerGd = {
    longitude: degreesToRadians(observer.lon),
    latitude: degreesToRadians(observer.lat),
    height: (observer.alt ?? 0) / 1000, // meters → km
  };
  const la = ecfToLookAngles(observerGd, ecf);
  let azimuthDeg = radiansToDegrees(la.azimuth);
  if (azimuthDeg < 0) azimuthDeg += 360;
  return {
    azimuthDeg,
    elevationDeg: radiansToDegrees(la.elevation),
    rangeKm: la.rangeSat,
  };
}

/**
 * Full state for one satellite at one instant: ground subpoint + observer look
 * angles, in a single SGP4 propagation. Returns null for un-propagatable TLEs.
 */
export function computeSatState(
  rec: TleRecord,
  observer: GeoCoord,
  date: Date,
): SatState | null {
  const satrec = toSatrec(rec);
  if (!satrec) return null;

  const pv = propagate(satrec, date);
  if (!pv || !pv.position || !pv.velocity) return null;
  const { x, y, z } = pv.position;
  if (!Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(z)) return null;

  const gmst = gstime(date);
  const geo = eciToGeodetic(pv.position, gmst);
  const lat = degreesLat(geo.latitude);
  const lon = degreesLong(geo.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const ecf = eciToEcf(pv.position, gmst);
  const observerGd = {
    longitude: degreesToRadians(observer.lon),
    latitude: degreesToRadians(observer.lat),
    height: (observer.alt ?? 0) / 1000,
  };
  const la = ecfToLookAngles(observerGd, ecf);
  let azimuthDeg = radiansToDegrees(la.azimuth);
  if (azimuthDeg < 0) azimuthDeg += 360;

  return {
    noradId: rec.noradId,
    name: rec.name,
    category: rec.category,
    lat,
    lon,
    altKm: geo.height,
    velocityKmS: magnitude(pv.velocity),
    azimuthDeg,
    elevationDeg: radiansToDegrees(la.elevation),
    rangeKm: la.rangeSat,
    timestamp: date.getTime(),
  };
}
