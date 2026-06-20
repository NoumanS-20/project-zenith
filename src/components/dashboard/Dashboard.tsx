"use client";

import { Panel, Stat, ConfidenceBadge, StatusDot } from "@/components/ui/primitives";
import { GlobeView } from "@/components/globe/GlobeView";
import { useStore, ALL_CATEGORIES } from "@/store/useStore";
import { cn } from "@/lib/cn";

const CATEGORY_LABELS: Record<string, string> = {
  stations: "ISS / Stations",
  brightest: "Brightest",
  starlink: "Starlink",
  navigation: "GPS / Nav",
  weather: "Weather",
  debris: "Debris",
};

/**
 * M1 dashboard shell — the cinematic command-center layout.
 * Desktop: left rail (search/filters) · center globe · right rail (telemetry).
 * Mobile: globe + bottom-sheet + tab bar.
 * Panels currently show representative data; live wiring lands M2–M6.
 */
export function Dashboard() {
  const { activeCategories, toggleCategory, mobileTab, setMobileTab } = useStore();

  return (
    <div className="relative z-10 flex h-dvh flex-col gap-2 p-2 md:gap-3 md:p-3">
      <TopBar />

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-2 md:gap-3 lg:grid-cols-[300px_1fr_340px]">
        {/* LEFT RAIL */}
        <aside
          className={cn(
            "min-h-0 flex-col gap-3 overflow-y-auto",
            "hidden lg:flex",
          )}
        >
          <Panel title="Observatory">
            <button className="w-full rounded-lg border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel-2)] px-3 py-2 text-left text-sm text-[color:var(--color-ink-dim)] transition-colors hover:border-[color:var(--color-zenith)]/40">
              Search satellite or NORAD ID…
            </button>
            <div className="mt-3 grid grid-cols-2 gap-1.5">
              {["My Location", "Chennai", "New York", "Tokyo", "London", "ISS Focus"].map(
                (p) => (
                  <button
                    key={p}
                    className="rounded-md border border-[color:var(--color-space-line)] bg-[color:var(--color-space-deep)] px-2 py-1.5 text-xs text-[color:var(--color-ink-dim)] transition-colors hover:border-[color:var(--color-zenith)]/40 hover:text-[color:var(--color-ink)]"
                  >
                    {p}
                  </button>
                ),
              )}
            </div>
          </Panel>

          <Panel title="Categories">
            <div className="flex flex-col gap-1">
              {ALL_CATEGORIES.map((c) => {
                const active = activeCategories.has(c);
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
                    <span
                      className={cn(
                        "size-2 rounded-full",
                        active
                          ? "bg-[color:var(--color-zenith)] shadow-[0_0_8px_var(--color-zenith)]"
                          : "bg-[color:var(--color-space-line)]",
                      )}
                    />
                  </button>
                );
              })}
            </div>
          </Panel>

          <Panel title="Overhead Now" className="flex-1">
            <ul className="flex flex-col gap-1.5">
              {[
                ["ISS (ZARYA)", "87.4°"],
                ["NOAA 19", "61.2°"],
                ["GPS BIIR-2", "44.8°"],
                ["STARLINK-1130", "31.0°"],
              ].map(([name, el]) => (
                <li
                  key={name}
                  className="flex items-center justify-between rounded-md border border-[color:var(--color-space-line)] bg-[color:var(--color-space-deep)] px-2.5 py-1.5"
                >
                  <span className="text-sm text-[color:var(--color-ink)]">{name}</span>
                  <span className="mono text-xs text-[color:var(--color-zenith)]">
                    {el}
                  </span>
                </li>
              ))}
            </ul>
          </Panel>
        </aside>

        {/* CENTER GLOBE */}
        <main className="relative min-h-0">
          <GlobeView />
        </main>

        {/* RIGHT RAIL */}
        <aside className="hidden min-h-0 flex-col gap-3 overflow-y-auto lg:flex">
          <Panel
            title="Selected Object"
            action={<ConfidenceBadge value="live" />}
          >
            <div className="mb-2">
              <div className="text-lg font-semibold text-[color:var(--color-ink)]">
                ISS (ZARYA)
              </div>
              <div className="mono text-xs text-[color:var(--color-ink-faint)]">
                NORAD 25544
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <Stat label="Latitude" value="13.04°" />
              <Stat label="Longitude" value="80.31°" />
              <Stat label="Altitude" value="408.2" unit="km" />
              <Stat label="Velocity" value="7.66" unit="km/s" />
              <Stat label="Azimuth" value="142.7°" />
              <Stat label="Elevation" value="87.4°" />
            </div>
            <div className="mt-3 flex items-center justify-between border-t border-[color:var(--color-space-line)] pt-2 text-xs text-[color:var(--color-ink-faint)]">
              <span>Source: CelesTrak · SGP4</span>
              <span className="mono">age 1s</span>
            </div>
          </Panel>

          <Panel title="Observation Score">
            <div className="flex items-center gap-3">
              <div className="mono text-3xl font-bold text-[color:var(--color-aurora)]">
                82
              </div>
              <div className="text-sm text-[color:var(--color-ink-dim)]">
                <div className="font-semibold text-[color:var(--color-ink)]">Good</div>
                Clear skies, near-zenith pass, dark twilight.
              </div>
            </div>
          </Panel>

          <Panel title="Next Pass" className="flex-1">
            <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
              <Stat label="Start" value="21:34 IST" />
              <Stat label="Duration" value="6m 14s" />
              <Stat label="Max Elev" value="72°" />
              <Stat label="Direction" value="SW → NE" />
            </div>
          </Panel>
        </aside>
      </div>

      <StatusStrip />

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

function TopBar() {
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
          Live · 25,847 objects
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

function StatusStrip() {
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
      <span className="mono">Updated 0s ago · SGP4 client-side</span>
    </footer>
  );
}
