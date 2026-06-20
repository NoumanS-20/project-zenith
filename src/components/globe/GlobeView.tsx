"use client";

import dynamic from "next/dynamic";

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

/** Full-bleed globe surface (overlays are layered on top by the Dashboard). */
export function GlobeView() {
  return (
    <div className="absolute inset-0">
      <CesiumGlobe />
    </div>
  );
}
