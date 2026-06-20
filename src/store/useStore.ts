"use client";

import { create } from "zustand";
import type {
  GeoCoord,
  SatCategory,
  SatState,
  TleRecord,
  DataProvenance,
} from "@/lib/types";

/** Default observer: Chennai (SRM IST home turf, also a judge demo preset). */
export const DEFAULT_LOCATION: GeoCoord = {
  lat: 13.0827,
  lon: 80.2707,
  alt: 0,
  label: "Chennai, India",
};

export type RenderMode = "auto" | "3d" | "2d";

export type TimeMode =
  | { kind: "now" }
  | { kind: "fixed"; epochMs: number };

type ZenithState = {
  // Observer selection
  location: GeoCoord;
  setLocation: (loc: GeoCoord) => void;

  // Selected object (NORAD id) or special targets
  selectedNoradId: number | null;
  selectObject: (noradId: number | null) => void;

  // Category filters
  activeCategories: Set<SatCategory>;
  toggleCategory: (c: SatCategory) => void;
  setCategories: (cs: SatCategory[]) => void;

  // Time scrubbing (Time Machine)
  time: TimeMode;
  setTimeNow: () => void;
  setFixedTime: (epochMs: number) => void;
  /** Resolve the effective epoch the whole app should render against. */
  effectiveEpoch: () => number;

  // Rendering / accessibility preferences
  renderMode: RenderMode;
  setRenderMode: (m: RenderMode) => void;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  presentationMode: boolean;
  togglePresentation: () => void;

  // Mobile active tab
  mobileTab: "globe" | "overhead" | "sky" | "weather" | "settings";
  setMobileTab: (t: ZenithState["mobileTab"]) => void;

  // Globe camera readout (updated by CesiumGlobe on camera change)
  cameraHeadingDeg: number;
  eyeAltitudeKm: number;
  sceneMode: "2d" | "3d";
  setCameraReadout: (headingDeg: number, eyeAltitudeKm: number) => void;
  setSceneMode: (m: "2d" | "3d") => void;

  // Google-Earth-style left panel
  leftPanelOpen: boolean;
  toggleLeftPanel: () => void;
  setLeftPanelOpen: (v: boolean) => void;

  // Live orbital engine output (updated ~1Hz by useSatelliteEngine)
  tles: TleRecord[];
  setTles: (tles: TleRecord[]) => void;
  tleProvenance: Record<string, DataProvenance>;
  setTleProvenance: (p: Record<string, DataProvenance>) => void;
  satStates: SatState[];
  satComputedAt: number;
  setSatStates: (states: SatState[], computedAt: number) => void;
};

const ALL_CATEGORIES: SatCategory[] = [
  "stations",
  "brightest",
  "starlink",
  "navigation",
  "weather",
  "debris",
];

export const useStore = create<ZenithState>((set, get) => ({
  location: DEFAULT_LOCATION,
  setLocation: (location) => set({ location }),

  selectedNoradId: 25544, // ISS by default — the hero object
  selectObject: (selectedNoradId) => set({ selectedNoradId }),

  activeCategories: new Set<SatCategory>(["stations", "brightest", "navigation"]),
  toggleCategory: (c) =>
    set((s) => {
      const next = new Set(s.activeCategories);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return { activeCategories: next };
    }),
  setCategories: (cs) => set({ activeCategories: new Set(cs) }),

  time: { kind: "now" },
  setTimeNow: () => set({ time: { kind: "now" } }),
  setFixedTime: (epochMs) => set({ time: { kind: "fixed", epochMs } }),
  effectiveEpoch: () => {
    const t = get().time;
    return t.kind === "now" ? Date.now() : t.epochMs;
  },

  renderMode: "auto",
  setRenderMode: (renderMode) => set({ renderMode }),
  reducedMotion: false,
  setReducedMotion: (reducedMotion) => set({ reducedMotion }),
  presentationMode: false,
  togglePresentation: () =>
    set((s) => ({ presentationMode: !s.presentationMode })),

  mobileTab: "overhead",
  setMobileTab: (mobileTab) => set({ mobileTab }),

  cameraHeadingDeg: 0,
  eyeAltitudeKm: 14000,
  sceneMode: "3d",
  setCameraReadout: (cameraHeadingDeg, eyeAltitudeKm) =>
    set({ cameraHeadingDeg, eyeAltitudeKm }),
  setSceneMode: (sceneMode) => set({ sceneMode }),

  leftPanelOpen: true,
  toggleLeftPanel: () => set((s) => ({ leftPanelOpen: !s.leftPanelOpen })),
  setLeftPanelOpen: (leftPanelOpen) => set({ leftPanelOpen }),

  tles: [],
  setTles: (tles) => set({ tles }),
  tleProvenance: {},
  setTleProvenance: (tleProvenance) => set({ tleProvenance }),
  satStates: [],
  satComputedAt: 0,
  setSatStates: (satStates, satComputedAt) => set({ satStates, satComputedAt }),
}));

export { ALL_CATEGORIES };
