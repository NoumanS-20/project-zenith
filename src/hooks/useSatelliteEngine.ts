"use client";

import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";
import { useStore } from "@/store/useStore";
import { TleRecordSchema } from "@/lib/schemas";
import { computeAllStates } from "@/lib/astro/observer";

const TleResponseSchema = z.object({
  records: z.array(TleRecordSchema),
  count: z.number(),
  categories: z.array(z.string()),
  provenance: z.record(
    z.string(),
    z.object({
      source: z.string(),
      confidence: z.enum(["live", "predicted", "cached", "fallback"]),
      fetchedAt: z.number(),
      method: z.string().optional(),
    }),
  ),
});

/** How often the worker recomputes all satellite positions (ms). */
const TICK_MS = 1000;

/**
 * The live orbital engine. Mount once near the top of the dashboard. It:
 *  1. fetches TLEs for the active categories (cached 2h, Zod-validated),
 *  2. SGP4-propagates every satellite on a ~1Hz tick,
 *  3. writes results to the Zustand store for the globe + panels to consume.
 *
 * No network calls in the tick loop. Propagation runs synchronously on the
 * curated catalog (a few hundred objects → <10ms/tick, well under one frame).
 * The same `computeAllStates` powers `workers/propagate.worker.ts`, which is
 * kept as a drop-in for scaling to the full 25k-object catalog.
 */
export function useSatelliteEngine() {
  const activeCategories = useStore((s) => s.activeCategories);
  const setTles = useStore((s) => s.setTles);
  const setTleProvenance = useStore((s) => s.setTleProvenance);
  const setSatStates = useStore((s) => s.setSatStates);

  const catKey = useMemo(
    () => Array.from(activeCategories).sort().join(","),
    [activeCategories],
  );

  const tleQuery = useQuery({
    queryKey: ["tle", catKey],
    enabled: catKey.length > 0,
    staleTime: 2 * 60 * 60_000,
    queryFn: async () => {
      const res = await fetch(`/api/tle?categories=${encodeURIComponent(catKey)}`);
      if (!res.ok) throw new Error(`TLE ${res.status}`);
      return TleResponseSchema.parse(await res.json());
    },
  });

  // Publish fetched TLEs + provenance to the store.
  useEffect(() => {
    if (!tleQuery.data) return;
    setTles(tleQuery.data.records);
    setTleProvenance(tleQuery.data.provenance);
  }, [tleQuery.data, setTles, setTleProvenance]);

  // Tick loop — recompute against latest observer + time each second.
  const tles = tleQuery.data?.records;
  const setSatStatesRef = useRef(setSatStates);
  setSatStatesRef.current = setSatStates;
  useEffect(() => {
    if (!tles || tles.length === 0) return;
    const tick = () => {
      const state = useStore.getState();
      const states = computeAllStates(tles, state.location, state.effectiveEpoch());
      setSatStatesRef.current(states, Date.now());
    };
    tick(); // immediate
    const iv = setInterval(tick, TICK_MS);
    return () => clearInterval(iv);
  }, [tles]);

  return {
    isLoading: tleQuery.isLoading,
    isError: tleQuery.isError,
    count: tleQuery.data?.count ?? 0,
  };
}
