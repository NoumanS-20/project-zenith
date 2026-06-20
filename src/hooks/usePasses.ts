"use client";

import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { predictPasses } from "@/lib/astro/passes";
import type { SatPass } from "@/lib/types";

/** Predicted passes for the currently selected satellite over the observer. */
export function usePasses(): SatPass[] {
  const selectedId = useStore((s) => s.selectedNoradId);
  const tles = useStore((s) => s.tles);
  const location = useStore((s) => s.location);
  const time = useStore((s) => s.time);

  // Refresh "now"-based predictions in 10-minute buckets to avoid recomputing
  // the 24h window on every render.
  const timeKey =
    time.kind === "fixed" ? time.epochMs : Math.floor(Date.now() / 600_000);

  return useMemo(() => {
    if (selectedId == null) return [];
    const rec = tles.find((t) => t.noradId === selectedId);
    if (!rec) return [];
    const from = time.kind === "fixed" ? time.epochMs : Date.now();
    return predictPasses(rec, location, from, { hours: 24, maxResults: 6 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, tles, location.lat, location.lon, time.kind, timeKey]);
}
