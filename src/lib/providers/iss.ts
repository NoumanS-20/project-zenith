import "server-only";
import type { DataProvenance } from "@/lib/types";
import { OpenNotifyIssSchema, OpenNotifyAstrosSchema } from "@/lib/schemas";

export type IssNow = {
  lat: number;
  lon: number;
  timestamp: number;
  provenance: DataProvenance;
} | null;

export type Astros = {
  number: number;
  people: { name: string; craft: string }[];
  provenance: DataProvenance;
};

/**
 * Open-Notify ISS position. The service is occasionally down; on any failure we
 * return null and the client falls back to SGP4-propagating NORAD 25544 from the
 * CelesTrak TLE (which it already has). Either way the ISS is always tracked.
 */
export async function getIssNow(): Promise<IssNow> {
  const fetchedAt = Date.now();
  for (const base of ["https://api.open-notify.org", "http://api.open-notify.org"]) {
    try {
      const res = await fetch(`${base}/iss-now.json`, {
        next: { revalidate: 5 },
        signal: AbortSignal.timeout(4000),
      });
      if (!res.ok) continue;
      const json = await res.json();
      const parsed = OpenNotifyIssSchema.parse(json);
      return {
        lat: parsed.iss_position.latitude,
        lon: parsed.iss_position.longitude,
        timestamp: parsed.timestamp * 1000,
        provenance: {
          source: "Open-Notify",
          confidence: "live",
          fetchedAt,
          method: "REST",
        },
      };
    } catch {
      // try next base, then give up
    }
  }
  return null;
}

export async function getAstros(): Promise<Astros> {
  const fetchedAt = Date.now();
  try {
    const res = await fetch("http://api.open-notify.org/astros.json", {
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) throw new Error(String(res.status));
    const parsed = OpenNotifyAstrosSchema.parse(await res.json());
    return {
      number: parsed.number,
      people: parsed.people,
      provenance: {
        source: "Open-Notify",
        confidence: "live",
        fetchedAt,
        method: "REST",
      },
    };
  } catch {
    // Stable, well-known crew snapshot as fallback.
    const people = [
      { name: "Oleg Kononenko", craft: "ISS" },
      { name: "Nikolai Chub", craft: "ISS" },
      { name: "Tracy Caldwell Dyson", craft: "ISS" },
    ];
    return {
      number: people.length,
      people,
      provenance: {
        source: "Demo fixture (Open-Notify unreachable)",
        confidence: "fallback",
        fetchedAt,
        method: "snapshot",
      },
    };
  }
}
