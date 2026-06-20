"use client";

import { useMemo } from "react";
import {
  Panel,
  Stat,
  ConfidenceBadge,
  StatusDot,
} from "@/components/ui/primitives";
import { GlobeView } from "@/components/globe/GlobeView";
import { useStore, ALL_CATEGORIES } from "@/store/useStore";
import { useSatelliteEngine } from "@/hooks/useSatelliteEngine";
import { overheadRank, classifyElevation } from "@/lib/astro/observer";
import { cn } from "@/lib/cn";
import type { SatState } from "@/lib/types";

const CATEGORY_LABELS: Record<string, string> = {
  stations: "ISS / Stations",
  brightest: "Brightest",
  starlink: "Starlink",
  navigation: "GPS / Nav",
  weather: "Weather",
  debris: "Debris",
};

type ZenithLocationPreset = {
  label: string;
  kind?: "geo" | "iss";
  lat?: number;
  lon?: number;
  locLabel?: string;
};

const PRESETS: ZenithLocationPreset[] = [
  { label: "My Location", kind: "geo" },
  { label: "Chennai", lat: 13.0827, lon: 80.2707, locLabel: "Chennai, India" },
  { label: "New York", lat: 40.7128, lon: -74.006, locLabel: "New York, USA" },
  { label: "Tokyo", lat: 35.6762, lon: 139.6503, locLabel: "Tokyo, Japan" },
  { label: "London", lat: 51.5074, lon: -0.1278, locLabel: "London, UK" },
  { label: "ISS Focus", kind: "iss" },
];

export function Dashboard() {
  useSatelliteEngine();
  const { activeCategories, toggleCategory, mobileTab, setMobileTab } = useStore();
  const satStates = useStore((s) => s.satStates);

  const overhead = useMemo(
    () =>
      satStates
        .filter((s) => (s.elevationDeg ?? -90) > 0)
        .sort((a, b) => overheadRank(b) - overheadRank(a))
        .slice(0, 14),
    [satStates],
  );

  return (
    <div className="relative z-10 flex h-dvh flex-col gap-2 p-2 md:gap-3 md:p-3">
      <TopBar trackedCount={satStates.length} />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 md:gap-3 lg:grid-cols-[300px_1fr_340px]">
        {/* LEFT RAIL */}
        <aside className="hidden min-h-0 flex-col gap-3 overflow-y-auto lg:flex">
          <Panel title="Observatory">
            <button className="w-full rounded-lg border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel-2)] px-3 py-2 text-left text-sm text-[color:var(--color-ink-dim)] transition-colors hover:border-[color:var(--color-zenith)]/40">
              Search satellite or NORAD ID…
            </button>
            <LocationPresets />
          </Panel>

          <Panel title="Categories">
            <div className="flex flex-col gap-1">
              {ALL_CATEGORIES.map((c) => {
                const active = activeCategories.has(c);
                const count = satStates.filter((s) => s.category === c).length;
                return (
                  <button
                    key={c}
                    onClick={() => toggleCategory(c)}
                    className={cn(
                      "flex items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors",
                      active
                        ? "bg-[color:var(--color-zenith)]/12 text-[color:var(--color-ink)]"
                        : "text-[color:var(--color-ink-faint)] hover:bg-[color:var(--color-space-panel-2)]",
                    )}
                  >
                    <span>{CATEGORY_LABELS[c]}</span>
                    <span className="flex items-center gap-2">
                      {active && count > 0 && (
                        <span className="mono text-[0.62rem] text-[color:var(--color-ink-faint)]">
                          {count}
                        </span>
                      )}
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          active
                            ? "bg-[color:var(--color-zenith)] shadow-[0_0_8px_var(--color-zenith)]"
                            : "bg-[color:var(--color-space-line)]",
                        )}
                      />
                    </span>
                  </button>
                );
              })}
            </div>
          </Panel>

          <OverheadPanel overhead={overhead} className="flex-1" />
        </aside>

        {/* CENTER GLOBE */}
        <main className="relative min-h-0">
          <GlobeView />
        </main>

        {/* RIGHT RAIL */}
        <aside className="hidden min-h-0 flex-col gap-3 overflow-y-auto lg:flex">
          <TelemetryPanel />
          <SkyPositionPanel />
          <OverheadSummaryPanel overhead={overhead} className="flex-1" />
        </aside>
      </div>

      <StatusStrip computedCount={satStates.length} />

      {/* MOBILE TAB BAR */}
      <nav className="flex items-center justify-around rounded-[var(--radius-panel)] border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)] py-1.5 lg:hidden">
        {(["globe", "overhead", "sky", "weather", "settings"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setMobileTab(t)}
            className={cn(
              "flex-1 rounded-md px-1 py-1.5 text-[0.68rem] font-medium uppercase tracking-wide transition-colors",
              mobileTab === t
                ? "text-[color:var(--color-zenith)]"
                : "text-[color:var(--color-ink-faint)]",
            )}
          >
            {t}
          </button>
        ))}
      </nav>
    </div>
  );
}

function LocationPresets() {
  const setLocation = useStore((s) => s.setLocation);
  const selectObject = useStore((s) => s.selectObject);

  const handle = (p: ZenithLocationPreset) => {
    if (p.kind === "iss") {
      selectObject(25544);
      return;
    }
    if (p.kind === "geo") {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            setLocation({
              lat: Number(pos.coords.latitude.toFixed(4)),
              lon: Number(pos.coords.longitude.toFixed(4)),
              alt: 0,
              label: "My Location",
            }),
          () => setLocation({ lat: 13.0827, lon: 80.2707, label: "Chennai (fallback)" }),
        );
      }
      return;
    }
    setLocation({ lat: p.lat!, lon: p.lon!, alt: 0, label: p.locLabel });
  };

  return (
    <div className="mt-3 grid grid-cols-2 gap-1.5">
      {PRESETS.map((p) => (
        <button
          key={p.label}
          onClick={() => handle(p)}
          className="rounded-md border border-[color:var(--color-space-line)] bg-[color:var(--color-space-deep)] px-2 py-1.5 text-xs text-[color:var(--color-ink-dim)] transition-colors hover:border-[color:var(--color-zenith)]/40 hover:text-[color:var(--color-ink)]"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

function OverheadPanel({
  overhead,
  className,
}: {
  overhead: SatState[];
  className?: string;
}) {
  const selectObject = useStore((s) => s.selectObject);
  const selectedId = useStore((s) => s.selectedNoradId);

  return (
    <Panel
      title="Overhead Now"
      className={className}
      action={
        <span className="mono text-[0.62rem] text-[color:var(--color-ink-faint)]">
          {overhead.length}
        </span>
      }
    >
      {overhead.length === 0 ? (
        <EmptyHint text="Computing overhead objects…" />
      ) : (
        <ul className="flex flex-col gap-1.5">
          {overhead.map((s) => {
            const cls = classifyElevation(s.elevationDeg ?? -90);
            return (
              <li key={s.noradId}>
                <button
                  onClick={() => selectObject(s.noradId)}
                  className={cn(
                    "flex w-full items-center justify-between rounded-md border px-2.5 py-1.5 text-left transition-colors",
                    selectedId === s.noradId
                      ? "border-[color:var(--color-zenith)]/60 bg-[color:var(--color-zenith)]/10"
                      : "border-[color:var(--color-space-line)] bg-[color:var(--color-space-deep)] hover:border-[color:var(--color-zenith)]/30",
                  )}
                >
                  <span className="flex items-center gap-1.5 truncate">
                    {cls === "zenith" && (
                      <span className="text-[color:var(--color-solar)]">★</span>
                    )}
                    <span className="truncate text-sm text-[color:var(--color-ink)]">
                      {s.name}
                    </span>
                  </span>
                  <span className="mono text-xs text-[color:var(--color-zenith)]">
                    {s.elevationDeg!.toFixed(1)}°
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

function TelemetryPanel() {
  const selectedId = useStore((s) => s.selectedNoradId);
  const satStates = useStore((s) => s.satStates);
  const computedAt = useStore((s) => s.satComputedAt);
  const provenance = useStore((s) => s.tleProvenance);

  const selected = satStates.find((s) => s.noradId === selectedId);
  const ageSec = computedAt ? Math.max(0, Math.round((Date.now() - computedAt) / 1000)) : 0;
  const source = selected
    ? provenance[selected.category]?.source ?? "CelesTrak"
    : "—";
  const confidence = selected
    ? provenance[selected.category]?.confidence ?? "predicted"
    : "predicted";

  return (
    <Panel
      title="Selected Object"
      action={selected ? <ConfidenceBadge value={confidence} /> : undefined}
    >
      {!selected ? (
        <EmptyHint text="Select a satellite on the globe or overhead list." />
      ) : (
        <>
          <div className="mb-2">
            <div className="text-lg font-semibold text-[color:var(--color-ink)]">
              {selected.name}
            </div>
            <div className="mono text-xs text-[color:var(--color-ink-faint)]">
              NORAD {selected.noradId}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            <Stat label="Latitude" value={`${selected.lat.toFixed(2)}°`} />
            <Stat label="Longitude" value={`${selected.lon.toFixed(2)}°`} />
            <Stat label="Altitude" value={selected.altKm.toFixed(1)} unit="km" />
            <Stat label="Velocity" value={selected.velocityKmS.toFixed(2)} unit="km/s" />
            <Stat label="Azimuth" value={`${(selected.azimuthDeg ?? 0).toFixed(1)}°`} />
            <Stat label="Elevation" value={`${(selected.elevationDeg ?? 0).toFixed(1)}°`} />
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-[color:var(--color-space-line)] pt-2 text-xs text-[color:var(--color-ink-faint)]">
            <span>Source: {source} · SGP4</span>
            <span className="mono">age {ageSec}s</span>
          </div>
        </>
      )}
    </Panel>
  );
}

function SkyPositionPanel() {
  const selectedId = useStore((s) => s.selectedNoradId);
  const satStates = useStore((s) => s.satStates);
  const selected = satStates.find((s) => s.noradId === selectedId);

  if (!selected || selected.elevationDeg === undefined) {
    return (
      <Panel title="Sky Position">
        <EmptyHint text="Look angles appear when an object is selected." />
      </Panel>
    );
  }

  const cls = classifyElevation(selected.elevationDeg);
  const above = selected.elevationDeg > 0;
  const label =
    cls === "zenith"
      ? "At zenith"
      : cls === "near-zenith"
        ? "Near zenith"
        : above
          ? "Above horizon"
          : "Below horizon";

  return (
    <Panel
      title="Sky Position"
      action={
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wide",
            above
              ? "bg-[color:var(--color-aurora)]/15 text-[color:var(--color-aurora)]"
              : "bg-[color:var(--color-ink-faint)]/15 text-[color:var(--color-ink-faint)]",
          )}
        >
          {label}
        </span>
      }
    >
      <div className="grid grid-cols-3 gap-x-3 gap-y-2.5">
        <Stat label="Elevation" value={`${selected.elevationDeg.toFixed(1)}°`} />
        <Stat label="Azimuth" value={`${(selected.azimuthDeg ?? 0).toFixed(0)}°`} />
        <Stat label="Range" value={(selected.rangeKm ?? 0).toFixed(0)} unit="km" />
      </div>
    </Panel>
  );
}

function OverheadSummaryPanel({
  overhead,
  className,
}: {
  overhead: SatState[];
  className?: string;
}) {
  const best = overhead[0];
  const zenithCount = overhead.filter(
    (s) => (s.elevationDeg ?? 0) >= 85,
  ).length;

  return (
    <Panel title="Overhead Summary" className={className}>
      <div className="grid grid-cols-2 gap-x-3 gap-y-3">
        <Stat label="Above horizon" value={overhead.length} />
        <Stat label="At zenith" value={zenithCount} />
        <Stat
          label="Highest now"
          value={best ? `${best.elevationDeg!.toFixed(0)}°` : "—"}
        />
        <Stat label="Top object" value={best ? best.name.split(" ")[0] : "—"} />
      </div>
      <p className="mt-3 border-t border-[color:var(--color-space-line)] pt-2 text-xs leading-relaxed text-[color:var(--color-ink-faint)]">
        Ranked by elevation toward your zenith. Observation score &amp; pass
        predictions arrive with the weather + sky layers.
      </p>
    </Panel>
  );
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 py-2 text-xs text-[color:var(--color-ink-faint)]">
      <span className="size-1.5 animate-pulse rounded-full bg-[color:var(--color-zenith)]" />
      {text}
    </div>
  );
}

function TopBar({ trackedCount }: { trackedCount: number }) {
  const presentationMode = useStore((s) => s.presentationMode);
  const togglePresentation = useStore((s) => s.togglePresentation);
  return (
    <header className="flex items-center justify-between gap-3 rounded-[var(--radius-panel)] border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/80 px-3 py-2 backdrop-blur">
      <div className="flex items-center gap-2.5">
        <span className="grid size-7 place-items-center rounded-md bg-[color:var(--color-zenith)]/15 text-[color:var(--color-zenith)]">
          ◎
        </span>
        <div className="leading-tight">
          <div className="text-sm font-semibold tracking-tight text-[color:var(--color-ink)]">
            Project Zenith
          </div>
          <div className="text-[0.6rem] uppercase tracking-[0.18em] text-[color:var(--color-ink-faint)]">
            The Celestial Eye
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="hidden items-center gap-1.5 rounded-full border border-[color:var(--color-space-line)] px-2.5 py-1 text-xs text-[color:var(--color-ink-dim)] sm:inline-flex">
          <StatusDot status="ok" />
          Live · {trackedCount.toLocaleString()} tracked
        </span>
        <button
          onClick={togglePresentation}
          className="rounded-full border border-[color:var(--color-space-line)] px-2.5 py-1 text-xs text-[color:var(--color-ink-dim)] transition-colors hover:border-[color:var(--color-zenith)]/40"
        >
          {presentationMode ? "Exit Demo" : "Demo Mode"}
        </button>
      </div>
    </header>
  );
}

function StatusStrip({ computedCount }: { computedCount: number }) {
  return (
    <footer className="hidden items-center justify-between gap-4 rounded-[var(--radius-panel)] border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/70 px-3 py-1.5 text-xs text-[color:var(--color-ink-faint)] backdrop-blur sm:flex">
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <StatusDot status="ok" /> CelesTrak TLE
        </span>
        <span className="flex items-center gap-1.5">
          <StatusDot status="ok" /> Open-Notify ISS
        </span>
        <span className="flex items-center gap-1.5">
          <StatusDot status="fallback" /> N2YO Passes
        </span>
        <span className="flex items-center gap-1.5">
          <StatusDot status="ok" /> NASA DONKI
        </span>
      </div>
      <span className="mono">{computedCount} objects · SGP4 client-side · 1 Hz</span>
    </footer>
  );
}
