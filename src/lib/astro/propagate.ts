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
  type SatRec,
  type EciVec3,
} from "satellite.js";
import type { GeoCoord, TleRecord, SatState } from "@/lib/types";

// satellite.js v5 (pure JS, no WASM) exposes degreesToRadians but not its
// inverse, so define the radians→degrees helper locally.
const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Parse a TLE record into an SGP4 satrec, or null if the elements are bad. */
export function toSatrec(rec: Pick<TleRecord, "line1" | "line2">): SatRec | null {
  try {
    const satrec = twoline2satrec(rec.line1, rec.line2);
    // error is non-zero for unusable element sets
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

/** Wrap a longitude into [-180, 180]. */
function wrapLon(lon: number): number {
  return ((((lon + 180) % 360) + 360) % 360) - 180;
}

/** Narrow satellite.js propagate output (position/velocity are `false` on error). */
function eci(satrec: SatRec, date: Date): {
  position: EciVec3<number>;
  velocity: EciVec3<number>;
} | null {
  const pv = propagate(satrec, date);
  const { position, velocity } = pv;
  if (typeof position === "boolean" || typeof velocity === "boolean") return null;
  if (!Number.isFinite(position.x) || !Number.isFinite(position.y)) return null;
  return { position, velocity };
}

export type SubpointState = {
  lat: number;
  lon: number;
  altKm: number;
  velocityKmS: number;
};

/** Propagate to a date → geodetic subpoint + speed. Null on propagation error. */
export function propagateSubpoint(satrec: SatRec, date: Date): SubpointState | null {
  const r = eci(satrec, date);
  if (!r) return null;
  const gmst = gstime(date);
  const geo = eciToGeodetic(r.position, gmst);
  const lat = degreesLat(geo.latitude);
  const lon = degreesLong(geo.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    lat,
    lon: wrapLon(lon),
    altKm: geo.height,
    velocityKmS: magnitude(r.velocity),
  };
}

export type LookAngles = { azimuthDeg: number; elevationDeg: number; rangeKm: number };

function observerGd(observer: GeoCoord) {
  return {
    longitude: degreesToRadians(observer.lon),
    latitude: degreesToRadians(observer.lat),
    height: (observer.alt ?? 0) / 1000, // meters → km
  };
}

/** Observer-relative look angles for a satrec at a given instant. */
export function lookAnglesFor(
  satrec: SatRec,
  observer: GeoCoord,
  date: Date,
): LookAngles | null {
  const r = eci(satrec, date);
  if (!r) return null;
  const gmst = gstime(date);
  const ecf = eciToEcf(r.position, gmst);
  const la = ecfToLookAngles(observerGd(observer), ecf);
  let azimuthDeg = toDeg(la.azimuth);
  if (azimuthDeg < 0) azimuthDeg += 360;
  return {
    azimuthDeg,
    elevationDeg: toDeg(la.elevation),
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

  const r = eci(satrec, date);
  if (!r) return null;

  const gmst = gstime(date);
  const geo = eciToGeodetic(r.position, gmst);
  const lat = degreesLat(geo.latitude);
  const lon = degreesLong(geo.longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const ecf = eciToEcf(r.position, gmst);
  const la = ecfToLookAngles(observerGd(observer), ecf);
  let azimuthDeg = toDeg(la.azimuth);
  if (azimuthDeg < 0) azimuthDeg += 360;

  return {
    noradId: rec.noradId,
    name: rec.name,
    category: rec.category,
    lat,
    lon: wrapLon(lon),
    altKm: geo.height,
    velocityKmS: magnitude(r.velocity),
    azimuthDeg,
    elevationDeg: toDeg(la.elevation),
    rangeKm: la.rangeSat,
    timestamp: date.getTime(),
  };
}
