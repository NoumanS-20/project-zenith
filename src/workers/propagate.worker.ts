/// <reference lib="webworker" />
import { computeOverhead, computeAllStates } from "../lib/astro/observer";
import type { GeoCoord, TleRecord, SatState } from "../lib/types";

export type PropagateRequest = {
  id: number;
  tles: TleRecord[];
  observer: GeoCoord;
  epochMs: number;
  /** "overhead" filters to above-horizon + ranks; "all" returns every state. */
  mode: "overhead" | "all";
  minElevationDeg?: number;
};

export type PropagateResponse = {
  id: number;
  states: SatState[];
  computedAt: number;
};

self.onmessage = (e: MessageEvent<PropagateRequest>) => {
  const { id, tles, observer, epochMs, mode, minElevationDeg } = e.data;
  const states =
    mode === "overhead"
      ? computeOverhead(tles, observer, epochMs, { minElevationDeg })
      : computeAllStates(tles, observer, epochMs);
  const res: PropagateResponse = { id, states, computedAt: Date.now() };
  (self as unknown as Worker).postMessage(res);
};
