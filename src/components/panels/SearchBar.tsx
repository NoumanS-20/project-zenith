"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/cn";

const COORD_RE = /^\s*(-?\d+(?:\.\d+)?)\s*,\s*(-?\d+(?:\.\d+)?)\s*$/;

type PresetChip =
  | { label: string; kind: "geo" }
  | { label: string; kind: "iss" }
  | { label: string; lat: number; lon: number; locLabel: string };

const PRESET_CHIPS: PresetChip[] = [
  { label: "My Location", kind: "geo" },
  { label: "Chennai", lat: 13.0827, lon: 80.2707, locLabel: "Chennai, India" },
  { label: "New York", lat: 40.7128, lon: -74.006, locLabel: "New York, USA" },
  { label: "Tokyo", lat: 35.6762, lon: 139.6503, locLabel: "Tokyo, Japan" },
  { label: "London", lat: 51.5074, lon: -0.1278, locLabel: "London, UK" },
  { label: "ISS Focus", kind: "iss" },
];

/** Google-Earth-style search: satellites by name/NORAD, or a "lat, lon" coordinate. */
export function SearchBar() {
  const tles = useStore((s) => s.tles);
  const selectObject = useStore((s) => s.selectObject);
  const setLocation = useStore((s) => s.setLocation);

  const [q, setQ] = useState("");
  const [focused, setFocused] = useState(false);

  const applyPreset = (p: PresetChip) => {
    if ("kind" in p && p.kind === "iss") {
      selectObject(25544);
    } else if ("kind" in p && p.kind === "geo") {
      if (typeof navigator !== "undefined" && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) =>
            setLocation({
              lat: Number(pos.coords.latitude.toFixed(4)),
              lon: Number(pos.coords.longitude.toFixed(4)),
              alt: 0,
              label: "My Location",
            }),
          () =>
            setLocation({ lat: 13.0827, lon: 80.2707, label: "Chennai (fallback)" }),
        );
      }
    } else if ("lat" in p) {
      setLocation({ lat: p.lat, lon: p.lon, alt: 0, label: p.locLabel });
    }
    setQ("");
    setFocused(false);
  };

  const coordMatch = q.match(COORD_RE);
  const coord = coordMatch
    ? { lat: Number(coordMatch[1]), lon: Number(coordMatch[2]) }
    : null;
  const coordValid =
    coord &&
    coord.lat >= -90 &&
    coord.lat <= 90 &&
    coord.lon >= -180 &&
    coord.lon <= 180;

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term || coordMatch) return [];
    return tles
      .filter(
        (t) =>
          t.name.toLowerCase().includes(term) ||
          String(t.noradId).includes(term),
      )
      .slice(0, 8);
  }, [q, tles, coordMatch]);

  const open = focused && (results.length > 0 || Boolean(coordMatch));

  const pickSat = (noradId: number) => {
    selectObject(noradId);
    setQ("");
    setFocused(false);
  };
  const goCoord = () => {
    if (!coordValid || !coord) return;
    setLocation({
      lat: Number(coord.lat.toFixed(4)),
      lon: Number(coord.lon.toFixed(4)),
      alt: 0,
      label: "Searched coordinate",
    });
    setQ("");
    setFocused(false);
  };

  return (
    <div className="relative w-[min(86vw,340px)]">
      <div className="flex items-center gap-2 rounded-full border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/90 px-3.5 py-2 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.9)] backdrop-blur focus-within:border-[color:var(--color-zenith)]/60">
        <svg viewBox="0 0 24 24" className="size-4 shrink-0 text-[color:var(--color-ink-faint)]" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              if (coordValid) goCoord();
              else if (results[0]) pickSat(results[0].noradId);
            }
          }}
          placeholder="Search satellite, NORAD ID, or lat, lon"
          aria-label="Search satellite by name or NORAD ID, or enter latitude, longitude"
          className="w-full bg-transparent text-sm text-[color:var(--color-ink)] placeholder:text-[color:var(--color-ink-faint)] focus:outline-none"
        />
        {q && (
          <button
            aria-label="Clear"
            onClick={() => setQ("")}
            className="text-[color:var(--color-ink-faint)] hover:text-[color:var(--color-ink)]"
          >
            ×
          </button>
        )}
      </div>

      {open && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] overflow-hidden rounded-xl border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/95 shadow-[0_20px_50px_-24px_rgba(0,0,0,0.95)] backdrop-blur">
          {coordMatch && (
            <button
              onClick={goCoord}
              disabled={!coordValid}
              className={cn(
                "flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm",
                coordValid
                  ? "text-[color:var(--color-ink)] hover:bg-[color:var(--color-zenith)]/10"
                  : "cursor-not-allowed text-[color:var(--color-ink-faint)]",
              )}
            >
              <span>
                Go to coordinate{" "}
                <span className="mono text-[color:var(--color-zenith)]">{q.trim()}</span>
              </span>
              {!coordValid && <span className="text-xs">out of range</span>}
            </button>
          )}
          {results.map((r) => (
            <button
              key={r.noradId}
              onClick={() => pickSat(r.noradId)}
              className="flex w-full items-center justify-between px-3.5 py-2 text-left transition-colors hover:bg-[color:var(--color-zenith)]/10"
            >
              <span className="truncate text-sm text-[color:var(--color-ink)]">{r.name}</span>
              <span className="mono ml-2 shrink-0 text-xs text-[color:var(--color-ink-faint)]">
                {r.noradId}
              </span>
            </button>
          ))}
        </div>
      )}

      {focused && !q && (
        <div className="absolute left-0 right-0 top-[calc(100%+6px)] flex flex-wrap gap-1.5 rounded-xl border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/95 p-2 backdrop-blur">
          {PRESET_CHIPS.map((p) => (
            <button
              key={p.label}
              onMouseDown={(e) => {
                e.preventDefault();
                applyPreset(p);
              }}
              className="press rounded-full border border-[color:var(--color-space-line)] bg-[color:var(--color-space-deep)] px-2.5 py-1 text-xs text-[color:var(--color-ink-dim)] transition-colors hover:border-[color:var(--color-zenith)]/40 hover:text-[color:var(--color-ink)]"
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
