import "server-only";
import { nasaKey } from "@/lib/env";
import {
  DonkiFlareSchema,
  DonkiCmeSchema,
  DonkiGstSchema,
  ApodSchema,
} from "@/lib/schemas";
import type { SpaceWeather, SpaceWeatherEvent, DataProvenance } from "@/lib/types";

const NASA = "https://api.nasa.gov";

function ymd(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function fetchJson(url: string, revalidate: number, timeoutMs = 8000) {
  const res = await fetch(url, {
    next: { revalidate },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) throw new Error(`NASA ${res.status}`);
  return res.json();
}

function auroraFromKp(kp?: number): SpaceWeather["auroraLikelihood"] {
  if (kp === undefined) return "low";
  if (kp >= 6) return "high";
  if (kp >= 4) return "moderate";
  return "low";
}

/** NASA DONKI: solar flares, CMEs, geomagnetic storms over the last 7 days. */
export async function getSpaceWeather(): Promise<SpaceWeather> {
  const fetchedAt = Date.now();
  const key = nasaKey();
  const end = new Date();
  const start = new Date(end.getTime() - 7 * 86_400_000);
  const range = `startDate=${ymd(start)}&endDate=${ymd(end)}`;

  try {
    const [flaresRaw, cmesRaw, gstRaw] = await Promise.all([
      fetchJson(`${NASA}/DONKI/FLR?${range}&api_key=${key}`, 1800),
      fetchJson(`${NASA}/DONKI/CME?${range}&api_key=${key}`, 1800),
      fetchJson(`${NASA}/DONKI/GST?${range}&api_key=${key}`, 1800),
    ]);

    const flares = DonkiFlareSchema.parse(flaresRaw);
    const cmes = DonkiCmeSchema.parse(cmesRaw);
    const gst = DonkiGstSchema.parse(gstRaw);

    const events: SpaceWeatherEvent[] = [];

    for (const f of flares) {
      const t = Date.parse(f.peakTime ?? f.beginTime ?? "");
      if (!Number.isFinite(t)) continue;
      events.push({
        id: f.flrID ?? `flr-${t}`,
        kind: "flare",
        time: t,
        intensity: f.classType,
        note: `Solar flare${f.classType ? ` (class ${f.classType})` : ""}`,
      });
    }
    for (const c of cmes) {
      const t = Date.parse(c.startTime ?? "");
      if (!Number.isFinite(t)) continue;
      events.push({
        id: c.activityID ?? `cme-${t}`,
        kind: "cme",
        time: t,
        note: "Coronal mass ejection",
      });
    }

    let maxKp: number | undefined;
    for (const g of gst) {
      const t = Date.parse(g.startTime ?? "");
      const kp = g.allKpIndex?.reduce((m, k) => Math.max(m, k.kpIndex), 0);
      if (kp !== undefined) maxKp = Math.max(maxKp ?? 0, kp);
      if (!Number.isFinite(t)) continue;
      events.push({
        id: g.gstID ?? `gst-${t}`,
        kind: "geostorm",
        time: t,
        intensity: kp ? `Kp${kp}` : undefined,
        note: "Geomagnetic storm",
      });
    }

    events.sort((a, b) => b.time - a.time);

    const aurora = auroraFromKp(maxKp);
    const impact =
      events.length === 0
        ? "Space weather is quiet — no flares, CMEs, or storms in the last 7 days. Excellent conditions for observing."
        : aurora === "high"
          ? "Active geomagnetic storm — aurora likely at high latitudes; minor satellite/GPS effects possible."
          : events.some((e) => e.kind === "flare")
            ? "Recent solar flares — possible brief radio blackouts; minimal impact on visual observing."
            : "Mild recent activity — good observing conditions overall.";

    const provenance: DataProvenance = {
      source: "NASA DONKI",
      confidence: "live",
      fetchedAt,
      method: "REST",
    };

    return {
      events: events.slice(0, 12),
      kpIndex: maxKp,
      auroraLikelihood: aurora,
      observingImpact: impact,
      provenance,
    };
  } catch {
    return {
      events: [],
      auroraLikelihood: "low",
      observingImpact: "Space-weather feed unavailable — assuming quiet conditions.",
      provenance: {
        source: "Fallback (NASA DONKI unreachable)",
        confidence: "fallback",
        fetchedAt,
        method: "assumed",
      },
    };
  }
}

export type Apod = {
  title: string;
  explanation: string;
  url: string;
  mediaType: string;
  date: string;
  copyright?: string;
  provenance: DataProvenance;
};

/** NASA Astronomy Picture of the Day. */
export async function getApod(): Promise<Apod | null> {
  const fetchedAt = Date.now();
  try {
    const data = ApodSchema.parse(
      await fetchJson(`${NASA}/planetary/apod?api_key=${nasaKey()}`, 3600, 12000),
    );
    return {
      title: data.title,
      explanation: data.explanation,
      url: data.hdurl ?? data.url,
      mediaType: data.media_type,
      date: data.date,
      copyright: data.copyright,
      provenance: { source: "NASA APOD", confidence: "live", fetchedAt, method: "REST" },
    };
  } catch {
    return null;
  }
}
