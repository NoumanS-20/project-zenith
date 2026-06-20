"use client";

import { useStore } from "@/store/useStore";

function fmtLat(lat: number) {
  return `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? "N" : "S"}`;
}
function fmtLon(lon: number) {
  return `${Math.abs(lon).toFixed(4)}° ${lon >= 0 ? "E" : "W"}`;
}
function fmtAlt(km: number) {
  if (km >= 1000) return `${(km / 1000).toFixed(2)} Mm`;
  if (km >= 1) return `${km.toFixed(0)} km`;
  return `${(km * 1000).toFixed(0)} m`;
}

/** Google-Earth-style coordinate + eye-altitude strip, bottom-left of the globe. */
export function GlobeReadout() {
  const location = useStore((s) => s.location);
  const eyeAltitudeKm = useStore((s) => s.eyeAltitudeKm);

  return (
    <div className="pointer-events-none flex items-center gap-3 rounded-lg border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-deep)]/80 px-3 py-1.5 backdrop-blur">
      <span className="mono text-xs text-[color:var(--color-zenith)]">
        {fmtLat(location.lat)} {fmtLon(location.lon)}
      </span>
      <span className="h-3 w-px bg-[color:var(--color-space-line)]" />
      <span className="text-[0.62rem] uppercase tracking-wider text-[color:var(--color-ink-faint)]">
        Eye alt
      </span>
      <span className="mono text-xs text-[color:var(--color-ink-dim)]">
        {fmtAlt(eyeAltitudeKm)}
      </span>
    </div>
  );
}
