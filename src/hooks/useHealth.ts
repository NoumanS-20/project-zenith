"use client";

import { useQuery } from "@tanstack/react-query";
import type { SourceHealth } from "@/lib/types";

type HealthResponse = { sources: SourceHealth[]; generatedAt: number };

/** Data-source health for the Source Inspector + status indicators. */
export function useHealth() {
  return useQuery<HealthResponse>({
    queryKey: ["health"],
    staleTime: 60_000,
    refetchInterval: 60_000,
    queryFn: async () => {
      const res = await fetch("/api/health");
      if (!res.ok) throw new Error(`health ${res.status}`);
      return (await res.json()) as HealthResponse;
    },
  });
}
