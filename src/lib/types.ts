/**
 * Project Zenith — normalized domain types.
 * Everything the UI renders flows through these shapes, regardless of which
 * upstream provider produced it. Provenance is tracked so the UI can always
 * show source + freshness + confidence (a core judging requirement).
 */

export type GeoCoord = {
  lat: number; // degrees, -90..90
  lon: number; // degrees, -180..180
  alt?: number; // observer altitude in meters (default 0)
  label?: string;
};

/** How trustworthy a given datum is, surfaced as a badge in the UI. */
export type Confidence = "live" | "predicted" | "cached" | "fallback";

export type DataProvenance = {
  source: string; // e.g. "CelesTrak", "Open-Notify", "Demo fixture"
  confidence: Confidence;
  fetchedAt: number; // epoch ms when fetched
  method?: string; // e.g. "SGP4 propagation", "REST"
};

/** Satellite categories used for filtering + coloring. */
export type SatCategory =
  | "stations" // ISS + crewed/space stations
  | "brightest" // visually bright objects
  | "starlink"
  | "navigation" // GPS / GNSS
  | "weather"
  | "debris"
  | "other";

/** A raw orbital element set as served by CelesTrak (TLE form). */
export type TleRecord = {
  name: string;
  noradId: number;
  line1: string;
  line2: string;
  category: SatCategory;
};

/** A propagated satellite state at a given instant. */
export type SatState = {
  noradId: number;
  name: string;
  category: SatCategory;
  // Subpoint (ground track)
  lat: number;
  lon: number;
  altKm: number;
  velocityKmS: number;
  // Look angles from the active observer (undefined until computed)
  azimuthDeg?: number;
  elevationDeg?: number;
  rangeKm?: number;
  // Instant this state is valid for
  timestamp: number;
};

/** Sky position of a Solar System body or the Sun/Moon. */
export type SkyBody = {
  name: string;
  kind: "sun" | "moon" | "planet";
  azimuthDeg: number;
  elevationDeg: number;
  magnitude?: number;
  illumination?: number; // moon phase fraction 0..1
  aboveHorizon: boolean;
};

/** A predicted pass of a satellite over the observer. */
export type SatPass = {
  noradId: number;
  startUtc: number;
  peakUtc: number;
  endUtc: number;
  maxElevationDeg: number;
  startAzimuthDeg: number;
  endAzimuthDeg: number;
  durationSec: number;
  visibilityQuality: "excellent" | "good" | "fair" | "poor";
  /** Observer is in darkness (sun below civil twilight) at peak. */
  visible: boolean;
  sunAltAtPeakDeg: number;
  /** Samples across the pass (elevation chart + sky-map arc). */
  samples: { t: number; elevationDeg: number; azimuthDeg: number }[];
};

/** Observing-conditions inputs + computed score. */
export type ObservationScore = {
  score: number; // 0..100
  grade: "Excellent" | "Good" | "Fair" | "Poor";
  factors: {
    cloudCover?: number; // %
    isNight: boolean;
    moonIllumination: number; // 0..1
    bestElevationDeg: number;
    visibilityKm?: number;
  };
  summary: string;
};

/** NASA DONKI-derived space weather event, normalized. */
export type SpaceWeatherEvent = {
  id: string;
  kind: "flare" | "cme" | "geostorm" | "other";
  time: number;
  intensity?: string; // e.g. "M1.5", "Kp6"
  note: string;
};

export type SpaceWeather = {
  events: SpaceWeatherEvent[];
  kpIndex?: number;
  auroraLikelihood: "low" | "moderate" | "high";
  observingImpact: string; // plain-English
  provenance: DataProvenance;
};

/** OpenWeather-derived observing conditions. */
export type ObservingConditions = {
  cloudCoverPct: number;
  visibilityKm?: number;
  description: string;
  provenance: DataProvenance;
};

/** Health record for one upstream, shown in the Source Inspector. */
export type SourceHealth = {
  id: string;
  label: string;
  status: "ok" | "degraded" | "fallback" | "down";
  cacheAgeSec?: number;
  updateIntervalSec?: number;
  detail?: string;
};
