"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { GlobeErrorBoundary } from "./GlobeErrorBoundary";
import { Globe2DFallback } from "./Globe2DFallback";

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

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}

/** Full-bleed globe surface (overlays are layered on top by the Dashboard). */
export function GlobeView() {
  // null = unknown (server/first paint), true/false after detection.
  const [webgl, setWebgl] = useState<boolean | null>(null);
  useEffect(() => {
    // Defer out of the synchronous effect body to avoid cascading renders.
    const id = requestAnimationFrame(() => setWebgl(detectWebGL()));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div className="absolute inset-0">
      {webgl === false ? (
        <Globe2DFallback />
      ) : (
        <GlobeErrorBoundary fallback={<Globe2DFallback />}>
          <CesiumGlobe />
        </GlobeErrorBoundary>
      )}
    </div>
  );
}
