"use client";

import dynamic from "next/dynamic";
import { useStore } from "@/store/useStore";

// Cesium touches window/WebGL — must load client-side only.
const CesiumGlobe = dynamic(() => import("./CesiumGlobe"), {
  ssr: false,
  loading: () => <GlobeLoading />,
});

function GlobeLoading() {
  return (
    <div className="grid size-full place-items-center bg-[color:var(--color-space-void)]">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="size-10 animate-spin rounded-full border-2 border-[color:var(--color-space-line)] border-t-[color:var(--color-zenith)]" />
        <div className="text-xs uppercase tracking-wider text-[color:var(--color-ink-faint)]">
          Initializing globe…
        </div>
      </div>
    </div>
  );
}

export function GlobeView() {
  const location = useStore((s) => s.location);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[var(--radius-panel)] border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-void)]">
      <CesiumGlobe />

      {/* Coordinate readout overlay */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-deep)]/85 px-3 py-2 backdrop-blur">
        <div className="text-[0.6rem] uppercase tracking-wider text-[color:var(--color-ink-faint)]">
          Observer Zenith
        </div>
        <div className="mono text-sm text-[color:var(--color-zenith)]">
          {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
        </div>
        {location.label && (
          <div className="text-xs text-[color:var(--color-ink-dim)]">{location.label}</div>
        )}
      </div>

      <div className="pointer-events-none absolute right-3 top-3 z-10 rounded-full border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-deep)]/75 px-3 py-1 text-[0.62rem] uppercase tracking-wider text-[color:var(--color-ink-faint)] backdrop-blur">
        Click the globe to set a coordinate
      </div>
    </div>
  );
}
