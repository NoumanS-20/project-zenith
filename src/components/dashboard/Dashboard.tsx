"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Panel,
  Stat,
  ConfidenceBadge,
  StatusDot,
} from "@/components/ui/primitives";
import { GlobeView } from "@/components/globe/GlobeView";
import { NavControls } from "@/components/globe/NavControls";
import { GlobeReadout } from "@/components/globe/GlobeReadout";
import { SearchBar } from "@/components/panels/SearchBar";
import { PassPredictor } from "@/components/panels/PassPredictor";
import { SourceInspector } from "@/components/panels/SourceInspector";
import { SkyMap } from "@/components/panels/SkyMap";
import { SpaceWeatherPanel } from "@/components/panels/SpaceWeatherPanel";
import { ApodCard } from "@/components/panels/ApodCard";
import { ObservingConditions } from "@/components/panels/ObservingConditions";
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { useStore, ALL_CATEGORIES } from "@/store/useStore";
import { CollapsedDock } from "./CollapsedDock";
import { Inspector } from "./Inspector";
import { useSatelliteEngine } from "@/hooks/useSatelliteEngine";
import { useUrlSync } from "@/hooks/useUrlSync";
import { useIsMobileLayout } from "@/hooks/useIsMobileLayout";
import { overheadRank, classifyElevation } from "@/lib/astro/observer";
import { buildObserveQuery } from "@/lib/url-state";
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
  useUrlSync();
  const satStates = useStore((s) => s.satStates);
  const presentationMode = useStore((s) => s.presentationMode);
  const leftPanelOpen = useStore((s) => s.leftPanelOpen);
  const setLeftPanelOpen = useStore((s) => s.setLeftPanelOpen);
  const selectedId = useStore((s) => s.selectedNoradId);
  const mobileTab = useStore((s) => s.mobileTab);
  const reducedMotion = useStore((s) => s.reducedMotion);
  const isMobileLayout = useIsMobileLayout();

  // Default the left panel closed on small screens so the globe leads.
  useEffect(() => {
    if (typeof window !== "undefined" && window.innerWidth < 1024) {
      setLeftPanelOpen(false);
    }
  }, [setLeftPanelOpen]);

  const overhead = useMemo(
    () =>
      satStates
        .filter((s) => (s.elevationDeg ?? -90) > 0)
        .sort((a, b) => overheadRank(b) - overheadRank(a))
        .slice(0, 14),
    [satStates],
  );

  const hasSelection = selectedId !== null && satStates.some((s) => s.noradId === selectedId);

  return (
    <div
      className="relative h-dvh w-full overflow-hidden"
      data-reduced-motion={reducedMotion ? "true" : undefined}
    >
      <h1 className="sr-only">
        Project Zenith — The Celestial Eye: real-time satellite, ISS, and sky
        dashboard for any point on Earth
      </h1>

      {/* GLOBE (full-bleed) */}
      <GlobeView />

      {/* OVERLAY LAYER */}
      {!presentationMode && (
        <>
          {/* TOP-LEFT: brand · search · left panel */}
          <div className="pointer-events-none absolute left-3 top-3 z-20 flex max-h-[calc(100dvh-1.5rem)] w-[min(90vw,360px)] flex-col gap-2">
            <div className="pointer-events-auto flex items-center gap-2">
              <Brand />
              <button
                aria-label="Toggle panel"
                onClick={() => useStore.getState().toggleLeftPanel()}
                className="grid size-9 shrink-0 place-items-center rounded-lg border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/85 text-[color:var(--color-ink-dim)] backdrop-blur transition-colors hover:text-[color:var(--color-ink)]"
              >
                <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>

            <div className="pointer-events-auto">
              <SearchBar />
            </div>

            {isMobileLayout && leftPanelOpen && mobileTab !== "globe" && (
              <div className="pointer-events-auto flex min-h-0 flex-col gap-2 overflow-y-auto pr-0.5">
                <PanelTabs />
                {mobileTab === "overhead" && (
                  <>
                    <PlacesPanel />
                    <LayersPanel satStates={satStates} />
                    <OverheadPanel overhead={overhead} />
                  </>
                )}
                {mobileTab === "sky" && <SkyMap />}
                {mobileTab === "weather" && (
                  <>
                    <SpaceWeatherPanel />
                    <ObservingConditions />
                    <ApodCard />
                  </>
                )}
                {mobileTab === "settings" && (
                  <>
                    <SettingsPanel />
                    <SourceInspector />
                  </>
                )}
              </div>
            )}
          </div>

          {/* TOP-RIGHT: status + demo */}
          <div className="pointer-events-auto absolute right-3 top-3 z-20 flex items-center gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/85 px-2.5 py-1.5 text-xs text-[color:var(--color-ink-dim)] backdrop-blur sm:inline-flex">
              <StatusDot status="ok" />
              Live · {satStates.length.toLocaleString()} tracked
            </span>
            <ShareButton />
            <DemoButton />
          </div>

          {/* SELECTION CARDS — top-right on desktop, bottom sheet on mobile */}
          {hasSelection && (
            <aside
              className={cn(
                "pointer-events-auto z-20 flex flex-col gap-2",
                "absolute lg:right-3 lg:top-16 lg:w-[340px]",
                "max-lg:bottom-16 max-lg:left-2 max-lg:right-2",
              )}
            >
              <Inspector />
            </aside>
          )}

          {/* BOTTOM-LEFT: dock + readout (desktop) */}
          <div className="absolute bottom-3 left-3 z-20 hidden flex-col gap-2 lg:flex">
            <CollapsedDock satStates={satStates} overhead={overhead} />
            <div className="pointer-events-none"><GlobeReadout /></div>
          </div>

          {/* BOTTOM-LEFT: readout only (tablet bottom-sheet range) */}
          <div className="pointer-events-none absolute bottom-3 left-3 z-20 hidden sm:block lg:hidden">
            <GlobeReadout />
          </div>
        </>
      )}

      {/* BOTTOM-RIGHT: navigation cluster (always available) */}
      <div className="absolute bottom-3 right-3 z-20 max-lg:bottom-16">
        <NavControls />
      </div>

      {/* MOBILE TAB BAR */}
      {!presentationMode && <MobileTabBar />}

      {/* PRESENTATION MODE exit affordance */}
      {presentationMode && (
        <button
          onClick={() => useStore.getState().togglePresentation()}
          className="pointer-events-auto absolute right-3 top-3 z-20 rounded-full border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/85 px-3 py-1.5 text-xs text-[color:var(--color-ink-dim)] backdrop-blur hover:text-[color:var(--color-ink)]"
        >
          Exit Presentation
        </button>
      )}
    </div>
  );
}

const PANEL_TABS = [
  { id: "overhead", label: "Layers" },
  { id: "sky", label: "Sky" },
  { id: "weather", label: "Weather" },
  { id: "settings", label: "Settings" },
] as const;

function PanelTabs() {
  const mobileTab = useStore((s) => s.mobileTab);
  const setMobileTab = useStore((s) => s.setMobileTab);
  return (
    <div className="flex items-center gap-1 rounded-lg border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/85 p-1 backdrop-blur">
      {PANEL_TABS.map((t) => (
        <button
          key={t.id}
          data-testid={`panel-tab-${t.id}`}
          onClick={() => setMobileTab(t.id)}
          className={cn(
            "flex-1 rounded-md px-2 py-1.5 text-xs font-medium transition-colors",
            mobileTab === t.id
              ? "bg-[color:var(--color-zenith)]/15 text-[color:var(--color-zenith)]"
              : "text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-ink)]",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function Brand() {
  return (
    <div className="flex items-center gap-2.5 rounded-full border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/85 px-3 py-1.5 backdrop-blur">
      <span className="grid size-6 place-items-center rounded-md bg-[color:var(--color-zenith)]/15 text-[color:var(--color-zenith)]">
        ◎
      </span>
      <div className="leading-none">
        <div className="text-sm font-semibold tracking-tight text-[color:var(--color-ink)]">
          Project Zenith
        </div>
      </div>
    </div>
  );
}

function ShareButton() {
  const [copied, setCopied] = useState(false);
  const onShare = () => {
    const { location, selectedNoradId } = useStore.getState();
    const url = `${window.location.origin}/observe?${buildObserveQuery(location, selectedNoradId)}`;
    navigator.clipboard?.writeText(url).then(
      () => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      },
      () => {},
    );
  };
  return (
    <button
      onClick={onShare}
      className="rounded-full border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/85 px-3 py-1.5 text-xs text-[color:var(--color-ink-dim)] backdrop-blur transition-colors hover:border-[color:var(--color-zenith)]/40 hover:text-[color:var(--color-ink)]"
    >
      {copied ? "Copied ✓" : "Share"}
    </button>
  );
}

function DemoButton() {
  const presentationMode = useStore((s) => s.presentationMode);
  const togglePresentation = useStore((s) => s.togglePresentation);
  return (
    <button
      onClick={togglePresentation}
      className="rounded-full border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/85 px-3 py-1.5 text-xs text-[color:var(--color-ink-dim)] backdrop-blur transition-colors hover:border-[color:var(--color-zenith)]/40 hover:text-[color:var(--color-ink)]"
    >
      {presentationMode ? "Exit" : "Presentation"}
    </button>
  );
}

function PlacesPanel() {
  const setLocation = useStore((s) => s.setLocation);
  const selectObject = useStore((s) => s.selectObject);

  const handle = (p: ZenithLocationPreset) => {
    if (p.kind === "iss") return selectObject(25544);
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
    <Panel title="Places">
      <div className="grid grid-cols-2 gap-1.5">
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
    </Panel>
  );
}

export function LayersPanel({ satStates }: { satStates: SatState[] }) {
  const activeCategories = useStore((s) => s.activeCategories);
  const toggleCategory = useStore((s) => s.toggleCategory);
  return (
    <Panel title="Layers">
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
  );
}

export function OverheadPanel({ overhead }: { overhead: SatState[] }) {
  const selectObject = useStore((s) => s.selectObject);
  const selectedId = useStore((s) => s.selectedNoradId);
  return (
    <Panel
      title="Overhead Now"
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

export function TelemetryPanel() {
  const selectedId = useStore((s) => s.selectedNoradId);
  const satStates = useStore((s) => s.satStates);
  const computedAt = useStore((s) => s.satComputedAt);
  const provenance = useStore((s) => s.tleProvenance);

  const selected = satStates.find((s) => s.noradId === selectedId);
  const ageSec = computedAt ? Math.max(0, Math.round((Date.now() - computedAt) / 1000)) : 0;
  const source = selected ? provenance[selected.category]?.source ?? "CelesTrak" : "—";
  const confidence = selected
    ? provenance[selected.category]?.confidence ?? "predicted"
    : "predicted";

  if (!selected) return null;

  return (
    <Panel
      title="Selected Object"
      action={
        <div className="flex items-center gap-2">
          <ConfidenceBadge value={confidence} />
          <CloseSelection />
        </div>
      }
    >
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
    </Panel>
  );
}

function CloseSelection() {
  const selectObject = useStore((s) => s.selectObject);
  return (
    <button
      aria-label="Clear selection"
      onClick={() => selectObject(null)}
      className="text-[color:var(--color-ink-faint)] transition-colors hover:text-[color:var(--color-ink)]"
    >
      ×
    </button>
  );
}

export function SkyPositionPanel() {
  const selectedId = useStore((s) => s.selectedNoradId);
  const satStates = useStore((s) => s.satStates);
  const selected = satStates.find((s) => s.noradId === selectedId);
  if (!selected || selected.elevationDeg === undefined) return null;

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

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-2 py-2 text-xs text-[color:var(--color-ink-faint)]">
      <span className="size-1.5 animate-pulse rounded-full bg-[color:var(--color-zenith)]" />
      {text}
    </div>
  );
}

function MobileTabBar() {
  const mobileTab = useStore((s) => s.mobileTab);
  const leftPanelOpen = useStore((s) => s.leftPanelOpen);
  const setMobileTab = useStore((s) => s.setMobileTab);
  const setLeftPanelOpen = useStore((s) => s.setLeftPanelOpen);
  return (
    <nav className="pointer-events-auto absolute inset-x-2 bottom-2 z-30 flex items-center justify-around rounded-[var(--radius-panel)] border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/90 py-1.5 backdrop-blur lg:hidden">
      {(["globe", "overhead", "sky", "weather", "settings"] as const).map((t) => {
        const active = t === "globe" ? !leftPanelOpen : leftPanelOpen && mobileTab === t;
        return (
          <button
            key={t}
            data-testid={`mobile-tab-${t}`}
            onClick={() => {
              if (t === "globe") {
                setLeftPanelOpen(false);
              } else {
                setMobileTab(t);
                setLeftPanelOpen(true);
              }
            }}
            className={cn(
              "flex-1 rounded-md px-1 py-1.5 text-[0.66rem] font-medium uppercase tracking-wide transition-colors",
              active
                ? "text-[color:var(--color-zenith)]"
                : "text-[color:var(--color-ink-faint)]",
            )}
          >
            {t}
          </button>
        );
      })}
    </nav>
  );
}
