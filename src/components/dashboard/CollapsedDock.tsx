"use client";

import { useStore } from "@/store/useStore";
import { cn } from "@/lib/cn";
import { LayersPanel, OverheadPanel } from "./Dashboard";
import { SkyMap } from "@/components/panels/SkyMap";
import { SpaceWeatherPanel } from "@/components/panels/SpaceWeatherPanel";
import { ObservingConditions } from "@/components/panels/ObservingConditions";
import { ApodCard } from "@/components/panels/ApodCard";
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { SourceInspector } from "@/components/panels/SourceInspector";
import type { SatState } from "@/lib/types";

type DockId = "layers" | "overhead" | "sky" | "weather" | "settings";

function DockPill({
  label,
  active,
  count,
  onToggle,
}: {
  label: string;
  active: boolean;
  count?: number;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className={cn(
        "press flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs backdrop-blur transition-colors",
        active
          ? "border-[color:var(--color-zenith)]/50 bg-[color:var(--color-zenith)]/12 text-[color:var(--color-zenith)]"
          : "border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/85 text-[color:var(--color-ink-dim)] hover:text-[color:var(--color-ink)]",
      )}
    >
      <span className="text-[color:var(--color-ink-faint)]">{active ? "▾" : "▸"}</span>
      {label}
      {typeof count === "number" && count > 0 && (
        <span className="mono text-[0.62rem] text-[color:var(--color-ink-faint)]">{count}</span>
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

  const pills: { id: DockId; label: string; count?: number }[] = [
    { id: "layers", label: "Layers" },
    { id: "overhead", label: "Overhead", count: overhead.length },
    { id: "sky", label: "Sky" },
    { id: "weather", label: "Weather" },
    { id: "settings", label: "Settings" },
  ];

  return (
    <div className="pointer-events-auto flex max-w-[min(92vw,360px)] flex-col gap-2">
      {dockSection && (
        <div className="flex max-h-[64dvh] flex-col gap-2 overflow-y-auto pr-0.5">
          {dockSection === "layers" && <LayersPanel satStates={satStates} />}
          {dockSection === "overhead" && <OverheadPanel overhead={overhead} />}
          {dockSection === "sky" && <SkyMap />}
          {dockSection === "weather" && (
            <>
              <SpaceWeatherPanel />
              <ObservingConditions />
              <ApodCard />
            </>
          )}
          {dockSection === "settings" && (
            <>
              <SettingsPanel />
              <SourceInspector />
            </>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {pills.map((p) => (
          <DockPill
            key={p.id}
            label={p.label}
            count={p.count}
            active={dockSection === p.id}
            onToggle={() => toggle(p.id)}
          />
        ))}
      </div>
    </div>
  );
}
