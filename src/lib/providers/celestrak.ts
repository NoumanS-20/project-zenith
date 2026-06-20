import "server-only";
import type { SatCategory, TleRecord, DataProvenance } from "@/lib/types";
import { FALLBACK_TLES } from "@/lib/fixtures/tle";

/** Map our UI categories to CelesTrak GP groups. */
const GROUP: Record<Exclude<SatCategory, "other">, string> = {
  stations: "stations",
  brightest: "visual",
  starlink: "starlink",
  navigation: "gnss",
  weather: "weather",
  debris: "cosmos-2251-debris",
};

/** Cap per category to keep propagation + rendering performant. */
const MAX_PER_CATEGORY: Partial<Record<SatCategory, number>> = {
  starlink: 200,
  debris: 150,
  navigation: 120,
};

const CELESTRAK_BASE = "https://celestrak.org/NORAD/elements/gp.php";

/** Parse CelesTrak 3-line TLE text into records for one category. */
function parseTleText(text: string, category: SatCategory): TleRecord[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trimEnd())
    .filter((l) => l.length > 0);

  const out: TleRecord[] = [];
  for (let i = 0; i + 2 < lines.length + 1; i += 3) {
    const name = lines[i]?.trim();
    const line1 = lines[i + 1];
    const line2 = lines[i + 2];
    if (!name || !line1 || !line2) break;
    if (!line1.startsWith("1 ") || !line2.startsWith("2 ")) continue;
    const noradId = Number.parseInt(line1.slice(2, 7), 10);
    if (!Number.isFinite(noradId)) continue;
    out.push({ name, noradId, line1, line2, category });
  }
  return out;
}

export type TleResult = {
  records: TleRecord[];
  provenance: DataProvenance;
};

/**
 * Fetch TLEs for a category from CelesTrak. Heavily cached (Next data cache,
 * 2h revalidate) — CelesTrak explicitly asks clients not to poll aggressively.
 * Falls back to bundled fixtures on any failure so the app never goes dark.
 */
export async function getTles(category: SatCategory): Promise<TleResult> {
  const group = GROUP[category as Exclude<SatCategory, "other">];
  const fetchedAt = Date.now();

  if (!group) {
    return {
      records: FALLBACK_TLES,
      provenance: {
        source: "Demo fixture",
        confidence: "fallback",
        fetchedAt,
        method: "bundled TLE",
      },
    };
  }

  const url = `${CELESTRAK_BASE}?GROUP=${group}&FORMAT=tle`;
  try {
    const res = await fetch(url, {
      next: { revalidate: 7200 }, // 2 hours
      headers: { "User-Agent": "ProjectZenith/1.0 (AstralWeb)" },
    });
    if (!res.ok) throw new Error(`CelesTrak ${res.status}`);
    const text = await res.text();
    // CelesTrak returns an error sentence (not TLE) when throttled.
    if (/error|invalid|rate/i.test(text.slice(0, 60)) && !text.includes("\n1 ")) {
      throw new Error("CelesTrak throttled");
    }
    let records = parseTleText(text, category);
    const cap = MAX_PER_CATEGORY[category];
    if (cap && records.length > cap) records = records.slice(0, cap);
    if (records.length === 0) throw new Error("CelesTrak empty");

    return {
      records,
      provenance: {
        source: "CelesTrak",
        confidence: "live",
        fetchedAt,
        method: "GP/TLE",
      },
    };
  } catch {
    const records = FALLBACK_TLES.filter((t) => t.category === category);
    return {
      records: records.length ? records : FALLBACK_TLES,
      provenance: {
        source: "Demo fixture (CelesTrak unreachable)",
        confidence: "fallback",
        fetchedAt,
        method: "bundled TLE",
      },
    };
  }
}
