import type { GeoCoord } from "@/lib/types";

export type ObserveParams = {
  lat?: number;
  lon?: number;
  sat?: number;
  label?: string;
};

/** Parse /observe?lat=..&lon=..&sat=.. into typed params. */
export function parseObserveParams(search: string): ObserveParams {
  const p = new URLSearchParams(search);
  const out: ObserveParams = {};
  const lat = Number(p.get("lat"));
  const lon = Number(p.get("lon"));
  if (p.has("lat") && Number.isFinite(lat) && lat >= -90 && lat <= 90) out.lat = lat;
  if (p.has("lon") && Number.isFinite(lon) && lon >= -180 && lon <= 180) out.lon = lon;
  const sat = Number(p.get("sat"));
  if (p.has("sat") && Number.isInteger(sat) && sat > 0) out.sat = sat;
  const label = p.get("label");
  if (label) out.label = label;
  return out;
}

/** Build a shareable query string for the current observatory state. */
export function buildObserveQuery(loc: GeoCoord, sat: number | null): string {
  const p = new URLSearchParams();
  p.set("lat", loc.lat.toFixed(4));
  p.set("lon", loc.lon.toFixed(4));
  if (sat != null) p.set("sat", String(sat));
  return p.toString();
}
