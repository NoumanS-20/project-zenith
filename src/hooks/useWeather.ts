"use client";

import { useQuery } from "@tanstack/react-query";
import { useStore } from "@/store/useStore";
import type { ObservingConditions } from "@/lib/types";

/** Observing conditions (cloud/visibility) for the observer location. */
export function useWeather() {
  const location = useStore((s) => s.location);
  const lat = Number(location.lat.toFixed(2));
  const lon = Number(location.lon.toFixed(2));

  return useQuery<ObservingConditions>({
    queryKey: ["weather", lat, lon],
    staleTime: 10 * 60_000,
    queryFn: async () => {
      const res = await fetch(`/api/weather?lat=${lat}&lon=${lon}`);
      if (!res.ok) throw new Error(`weather ${res.status}`);
      return (await res.json()) as ObservingConditions;
    },
  });
}
