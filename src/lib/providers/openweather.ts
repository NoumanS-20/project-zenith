import "server-only";
import { env, hasKey } from "@/lib/env";
import { OpenWeatherSchema } from "@/lib/schemas";
import type { ObservingConditions } from "@/lib/types";

/**
 * OpenWeather current conditions for a coordinate. Returns cloud cover and
 * visibility (the inputs to the observation score). Degrades to a clearly
 * labelled fallback when no key is set or the request fails.
 */
export async function getConditions(
  lat: number,
  lon: number,
): Promise<ObservingConditions> {
  const fetchedAt = Date.now();

  if (!hasKey.openweather()) {
    return {
      cloudCoverPct: 30,
      visibilityKm: undefined,
      description: "Conditions unavailable (no API key)",
      provenance: {
        source: "Fallback (no OpenWeather key)",
        confidence: "fallback",
        fetchedAt,
        method: "assumed",
      },
    };
  }

  try {
    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${env.OPENWEATHER_API_KEY}`;
    const res = await fetch(url, {
      next: { revalidate: 900 },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) throw new Error(`OpenWeather ${res.status}`);
    const data = OpenWeatherSchema.parse(await res.json());
    return {
      cloudCoverPct: data.clouds?.all ?? 0,
      visibilityKm:
        typeof data.visibility === "number" ? data.visibility / 1000 : undefined,
      description: data.weather?.[0]?.description ?? "Clear",
      provenance: {
        source: "OpenWeatherMap",
        confidence: "live",
        fetchedAt,
        method: "REST",
      },
    };
  } catch {
    return {
      cloudCoverPct: 30,
      visibilityKm: undefined,
      description: "Conditions unavailable",
      provenance: {
        source: "Fallback (OpenWeather unreachable)",
        confidence: "fallback",
        fetchedAt,
        method: "assumed",
      },
    };
  }
}
