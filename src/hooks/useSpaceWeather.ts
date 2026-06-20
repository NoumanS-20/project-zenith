"use client";

import { useQuery } from "@tanstack/react-query";
import type { SpaceWeather } from "@/lib/types";

/** NASA DONKI space-weather summary. */
export function useSpaceWeather() {
  return useQuery<SpaceWeather>({
    queryKey: ["spaceweather"],
    staleTime: 30 * 60_000,
    queryFn: async () => {
      const res = await fetch("/api/spaceweather");
      if (!res.ok) throw new Error(`spaceweather ${res.status}`);
      return (await res.json()) as SpaceWeather;
    },
  });
}
