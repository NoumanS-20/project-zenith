"use client";

import { useStore } from "@/store/useStore";
import { cn } from "@/lib/cn";
import { LayersPanel, OverheadPanel } from "./Dashboard";
import type { SatState } from "@/lib/types";

function DockPill({
  id,
  label,
  count,
  active,
  onToggle,
}: {
  id: "layers" | "overhead";
  label: string;
  count?: number;
  active: boolean;
  onToggle: (id: "layers" | "overhead") => void;
}) {
  return (
    <button
      onClick={() => onToggle(id)}
      className={cn(
        "press flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs backdrop-blur transition-colors",
        active
          ? "border-[color:var(--color-zenith)]/50 bg-[color:var(--color-zenith)]/12 text-[color:var(--color-zenith)]"
          : "border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/85 text-[color:var(--color-ink-dim)] hover:text-[color:var(--color-ink)]",
      )}
    >
      <span className="text-[color:var(--color-ink-faint)]">
        {active ? "▾" : "▸"}
      </span>
      {label}
      {typeof count === "number" && count > 0 && (
        <span className="mono text-[0.62rem] text-[color:var(--color-ink-faint)]">
          {count}
        </span>
      )}
    </button>
  );
}

export function CollapsedDock({
  satStates,
  overhead,
}: {
  satStates: SatState[];
  overhead: SatState[];
}) {
  const dockSection = useStore((s) => s.dockSection);
  const toggle = useStore((s) => s.toggleDockSection);

  return (
    <div className="pointer-events-auto flex max-w-[min(92vw,320px)] flex-col gap-2">
      {dockSection && (
        <div className="max-h-[60dvh] overflow-y-auto pr-0.5">
          {dockSection === "layers" && <LayersPanel satStates={satStates} />}
          {dockSection === "overhead" && <OverheadPanel overhead={overhead} />}
        </div>
      )}
      <div className="flex gap-2">
        <DockPill id="layers" label="Layers" active={dockSection === "layers"} onToggle={toggle} />
        <DockPill id="overhead" label="Overhead" count={overhead.length} active={dockSection === "overhead"} onToggle={toggle} />
      </div>
    </div>
  );
}
