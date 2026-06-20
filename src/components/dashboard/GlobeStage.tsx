"use client";

import { useStore } from "@/store/useStore";

/**
 * M1 placeholder stage. A CSS-rendered Earth with a zenith marker so the layout,
 * spacing, and responsiveness are real. In M4 this component is replaced by the
 * CesiumJS globe (3D) with a Leaflet 2D fallback — the surrounding layout stays.
 */
export function GlobeStage() {
  const location = useStore((s) => s.location);

  return (
    <div className="relative h-full w-full overflow-hidden rounded-[var(--radius-panel)] border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-void)]">
      {/* Grid + horizon glow */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage:
            "linear-gradient(var(--color-space-line) 1px, transparent 1px), linear-gradient(90deg, var(--color-space-line) 1px, transparent 1px)",
          backgroundSize: "44px 44px",
          maskImage:
            "radial-gradient(120% 90% at 50% 40%, black 30%, transparent 80%)",
        }}
      />

      {/* Earth */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div
          className="size-[min(58vmin,520px)] rounded-full"
          style={{
            background:
              "radial-gradient(circle at 35% 30%, #1b4a78, #0a2347 45%, #051026 75%)",
            boxShadow:
              "inset -30px -24px 80px rgba(0,0,0,0.7), 0 0 70px rgba(56,225,255,0.18), 0 0 140px rgba(56,225,255,0.08)",
          }}
        >
          <div
            className="size-full rounded-full opacity-30 mix-blend-screen"
            style={{
              backgroundImage:
                "radial-gradient(closest-side at 60% 40%, rgba(52,245,197,0.5), transparent 60%), radial-gradient(closest-side at 30% 70%, rgba(124,92,255,0.4), transparent 55%)",
            }}
          />
        </div>
      </div>

      {/* Zenith marker chip */}
      <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="relative -translate-y-[18%]">
          <span className="absolute left-1/2 top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--color-zenith)] shadow-[0_0_16px_var(--color-zenith)]" />
          <span className="absolute left-1/2 top-1/2 size-10 -translate-x-1/2 -translate-y-1/2 animate-ping rounded-full border border-[color:var(--color-zenith)]/40" />
        </div>
      </div>

      {/* Coordinate readout */}
      <div className="pointer-events-none absolute bottom-4 left-4 rounded-lg border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-deep)]/80 px-3 py-2 backdrop-blur">
        <div className="text-[0.6rem] uppercase tracking-wider text-[color:var(--color-ink-faint)]">
          Observer Zenith
        </div>
        <div className="mono text-sm text-[color:var(--color-zenith)]">
          {location.lat.toFixed(4)}°, {location.lon.toFixed(4)}°
        </div>
        {location.label && (
          <div className="text-xs text-[color:var(--color-ink-dim)]">
            {location.label}
          </div>
        )}
      </div>

      {/* Mode hint */}
      <div className="pointer-events-none absolute right-4 top-4 rounded-full border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-deep)]/70 px-3 py-1 text-[0.62rem] uppercase tracking-wider text-[color:var(--color-ink-faint)] backdrop-blur">
        3D Globe · Live
      </div>
    </div>
  );
}
