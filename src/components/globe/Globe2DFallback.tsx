"use client";

import { useStore } from "@/store/useStore";
import type { SatCategory } from "@/lib/types";

const CATEGORY_COLOR: Record<SatCategory, string> = {
  stations: "#38e1ff",
  brightest: "#ffffff",
  starlink: "#7c5cff",
  navigation: "#34f5c5",
  weather: "#5db4ff",
  debris: "#6b7da6",
  other: "#9fb2d4",
};

const ISS_NORAD = 25544;

/**
 * Dependency-free 2D fallback (equirectangular) used when WebGL/Cesium is
 * unavailable — low-power devices or restricted browsers. Plots live satellite
 * subpoints + the observer and supports click-to-pick, so the core experience
 * keeps working with zero WebGL.
 */
export function Globe2DFallback() {
  const satStates = useStore((s) => s.satStates);
  const location = useStore((s) => s.location);
  const selectedId = useStore((s) => s.selectedNoradId);
  const setLocation = useStore((s) => s.setLocation);
  const selectObject = useStore((s) => s.selectObject);

  const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const lon = ((e.clientX - rect.left) / rect.width) * 360 - 180;
    const lat = 90 - ((e.clientY - rect.top) / rect.height) * 180;
    setLocation({
      lat: Number(lat.toFixed(4)),
      lon: Number(lon.toFixed(4)),
      alt: 0,
      label: "Custom coordinate",
    });
  };

  const ox = location.lon + 180;
  const oy = 90 - location.lat;

  return (
    <div className="absolute inset-0 bg-[color:var(--color-space-void)]">
      <div
        className="relative h-full w-full cursor-crosshair"
        onClick={onClick}
        role="img"
        aria-label="2D satellite map (WebGL fallback)"
      >
        <svg viewBox="0 0 360 180" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
          <rect x="0" y="0" width="360" height="180" fill="#070b16" />
          {/* graticule */}
          {[30, 60, 90, 120, 150, 210, 240, 270, 300, 330].map((x) => (
            <line key={`v${x}`} x1={x} y1="0" x2={x} y2="180" stroke="var(--color-space-line)" strokeWidth="0.3" />
          ))}
          {[30, 60, 120, 150].map((y) => (
            <line key={`h${y}`} x1="0" y1={y} x2="360" y2={y} stroke="var(--color-space-line)" strokeWidth="0.3" />
          ))}
          {/* equator + prime meridian */}
          <line x1="0" y1="90" x2="360" y2="90" stroke="var(--color-space-edge)" strokeWidth="0.5" />
          <line x1="180" y1="0" x2="180" y2="180" stroke="var(--color-space-edge)" strokeWidth="0.5" />

          {/* satellites */}
          {satStates.map((s) => {
            const isIss = s.noradId === ISS_NORAD;
            const isSel = s.noradId === selectedId;
            return (
              <circle
                key={s.noradId}
                cx={s.lon + 180}
                cy={90 - s.lat}
                r={isSel ? 2.2 : isIss ? 1.8 : 1}
                fill={isIss ? "#ffb454" : CATEGORY_COLOR[s.category] ?? "#9fb2d4"}
                stroke={isSel ? "#fff" : "none"}
                strokeWidth={isSel ? 0.5 : 0}
                style={{ cursor: "pointer" }}
                onClick={(e) => {
                  e.stopPropagation();
                  selectObject(s.noradId);
                }}
              />
            );
          })}

          {/* observer */}
          <circle cx={ox} cy={oy} r="2.5" fill="none" stroke="var(--color-zenith)" strokeWidth="0.8" />
          <circle cx={ox} cy={oy} r="0.8" fill="var(--color-zenith)" />
        </svg>
      </div>

      <div className="pointer-events-none absolute right-3 top-3 rounded-full border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-deep)]/80 px-3 py-1 text-[0.62rem] uppercase tracking-wider text-[color:var(--color-solar)] backdrop-blur">
        2D fallback · WebGL unavailable
      </div>
    </div>
  );
}
