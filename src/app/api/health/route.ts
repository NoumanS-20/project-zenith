import { NextResponse } from "next/server";
import { hasKey } from "@/lib/env";
import type { SourceHealth } from "@/lib/types";

export const revalidate = 60;

/**
 * GET /api/health — reports the configured/operational state of every data
 * source without leaking keys. Drives the Source Inspector + bottom status strip.
 */
export async function GET() {
  const sources: SourceHealth[] = [
    {
      id: "celestrak",
      label: "CelesTrak TLE",
      status: "ok",
      updateIntervalSec: 7200,
      detail: "Orbital elements · cached 2h",
    },
    {
      id: "opennotify",
      label: "Open-Notify ISS",
      status: "ok",
      updateIntervalSec: 5,
      detail: "ISS position + crew (SGP4 fallback)",
    },
    {
      id: "astronomy",
      label: "Astronomy Engine",
      status: "ok",
      updateIntervalSec: 1,
      detail: "Sun/Moon/planets · client-side",
    },
    {
      id: "nasa",
      label: "NASA DONKI/APOD",
      status: hasKey.nasa() ? "ok" : "degraded",
      updateIntervalSec: 3600,
      detail: hasKey.nasa() ? "API key set" : "Using DEMO_KEY (rate-limited)",
    },
    {
      id: "n2yo",
      label: "N2YO Passes",
      status: hasKey.n2yo() ? "ok" : "fallback",
      updateIntervalSec: 600,
      detail: hasKey.n2yo() ? "API key set" : "Local SGP4 pass calc",
    },
    {
      id: "openweather",
      label: "OpenWeather",
      status: hasKey.openweather() ? "ok" : "fallback",
      updateIntervalSec: 900,
      detail: hasKey.openweather() ? "API key set" : "Conditions unavailable",
    },
  ];

  return NextResponse.json(
    { sources, generatedAt: Date.now() },
    { headers: { "Cache-Control": "public, s-maxage=60" } },
  );
}
