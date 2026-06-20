import { NextResponse } from "next/server";
import { getTles } from "@/lib/providers/celestrak";
import type { SatCategory, TleRecord, DataProvenance } from "@/lib/types";

export const revalidate = 7200;

const VALID: SatCategory[] = [
  "stations",
  "brightest",
  "starlink",
  "navigation",
  "weather",
  "debris",
];

/**
 * GET /api/tle?categories=stations,brightest
 * Returns merged, de-duplicated TLE records plus per-category provenance.
 * Defaults to a safe lightweight set when no categories are given.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const requested = (searchParams.get("categories") ?? "stations,brightest,navigation")
    .split(",")
    .map((s) => s.trim())
    .filter((s): s is SatCategory => VALID.includes(s as SatCategory));

  const categories = requested.length ? requested : (["stations"] as SatCategory[]);

  const results = await Promise.all(categories.map((c) => getTles(c)));

  const byId = new Map<number, TleRecord>();
  const provenance: Record<string, DataProvenance> = {};
  results.forEach((r, i) => {
    provenance[categories[i]] = r.provenance;
    for (const rec of r.records) {
      if (!byId.has(rec.noradId)) byId.set(rec.noradId, rec);
    }
  });

  return NextResponse.json(
    {
      records: Array.from(byId.values()),
      count: byId.size,
      categories,
      provenance,
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=7200, stale-while-revalidate=86400",
      },
    },
  );
}
