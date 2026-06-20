"use client";

import { useMemo } from "react";
import { useStore } from "@/store/useStore";
import { useWeather } from "./useWeather";
import { isNight, moonInfo, sunAltitude, twilightPhase } from "@/lib/astro/sky";
import { computeObservationScore } from "@/lib/astro/score";
import type { ObservationScore } from "@/lib/types";

export type ObservationResult = ObservationScore & {
  twilight: ReturnType<typeof twilightPhase>;
  moonPhase: string;
  cloudSource: string;
};

/** Combines weather + sky darkness + moon + best overhead pass into a score. */
export function useObservation(): ObservationResult {
  const location = useStore((s) => s.location);
  const satStates = useStore((s) => s.satStates);
  const time = useStore((s) => s.time);
  const weather = useWeather();

  const epoch = time.kind === "fixed" ? time.epochMs : Date.now();
  const timeBucket = time.kind === "fixed" ? time.epochMs : Math.floor(epoch / 300_000);
  const bestEl = satStates.reduce(
    (m, s) => Math.max(m, s.elevationDeg ?? -90),
    0,
  );
  const cloud = weather.data?.cloudCoverPct;
  const visibilityKm = weather.data?.visibilityKm;
  const cloudSource = weather.data?.provenance.source ?? "—";

  return useMemo(() => {
    const date = new Date(epoch);
    const night = isNight(location, date);
    const sunAlt = sunAltitude(location, date);
    const moon = moonInfo(location, date);
    const base = computeObservationScore({
      cloudCoverPct: cloud,
      isNight: night,
      moonIllumination: moon.illumination,
      bestElevationDeg: bestEl,
      visibilityKm,
    });
    return {
      ...base,
      twilight: twilightPhase(sunAlt),
      moonPhase: moon.phaseName,
      cloudSource,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    location.lat,
    location.lon,
    timeBucket,
    Math.round(bestEl),
    cloud,
    visibilityKm,
    cloudSource,
  ]);
}
