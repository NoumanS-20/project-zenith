"use client";

import { useQuery } from "@tanstack/react-query";

type Apod = {
  title: string;
  explanation: string;
  url: string;
  mediaType: string;
  date: string;
  copyright?: string;
} | null;

/** NASA Astronomy Picture of the Day. */
export function useApod() {
  return useQuery<Apod>({
    queryKey: ["apod"],
    staleTime: 6 * 60 * 60_000,
    queryFn: async () => {
      const res = await fetch("/api/apod");
      if (!res.ok) throw new Error(`apod ${res.status}`);
      return (await res.json()) as Apod;
    },
  });
}
