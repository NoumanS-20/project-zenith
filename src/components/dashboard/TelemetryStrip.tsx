"use client";

import { useStore } from "@/store/useStore";

/** Slim bottom strip with the selected object's key live numbers. Desktop only
 *  (lg:flex); renders nothing when no object is selected. Numbers update each
 *  ~1Hz tick — do NOT animate them (animation on 1Hz updates = noise). */
export function TelemetryStrip() {
  const selectedId = useStore((s) => s.selectedNoradId);
  const satStates = useStore((s) => s.satStates);
  const sel = satStates.find((s) => s.noradId === selectedId);
  if (!sel) return null;

  const Item = ({ label, value }: { label: string; value: string }) => (
    <span className="flex items-baseline gap-1.5">
      <span className="text-[0.58rem] uppercase tracking-wider text-[color:var(--color-ink-faint)]">
        {label}
      </span>
      <span className="mono text-sm text-[color:var(--color-ink)]">{value}</span>
    </span>
  );

  return (
    <div className="reveal pointer-events-none absolute inset-x-0 bottom-3 z-10 hidden justify-center lg:flex">
      <div className="flex items-center gap-5 rounded-full border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/85 px-5 py-2 backdrop-blur">
        <span className="mono text-sm font-semibold text-[color:var(--color-zenith)]">
          {sel.name}
        </span>
        <Item label="alt" value={`${sel.altKm.toFixed(0)} km`} />
        <Item label="vel" value={`${sel.velocityKmS.toFixed(2)} km/s`} />
        <Item label="el" value={`${(sel.elevationDeg ?? 0).toFixed(1)}°`} />
      </div>
    </div>
  );
}
