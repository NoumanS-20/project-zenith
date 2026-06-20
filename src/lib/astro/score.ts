import type { ObservationScore } from "@/lib/types";

export type ScoreInput = {
  cloudCoverPct?: number; // 0..100
  isNight: boolean;
  moonIllumination: number; // 0..1
  bestElevationDeg: number; // best overhead elevation right now
  visibilityKm?: number;
};

function clamp(n: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, n));
}

function grade(score: number): ObservationScore["grade"] {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
}

/**
 * Observation score (0..100). Weighted blend of the factors that actually
 * determine whether you can watch a pass:
 *   clear sky 35 · darkness 25 · high pass 25 · dark moon 10 · visibility 5
 */
export function computeObservationScore(input: ScoreInput): ObservationScore {
  const cloud = input.cloudCoverPct ?? 30; // assume partly cloudy if unknown
  const cloudScore = ((100 - clamp(cloud, 0, 100)) / 100) * 35;
  const darknessScore = input.isNight ? 25 : 5;
  const elevationScore = clamp(input.bestElevationDeg / 90, 0, 1) * 25;
  const moonScore = (1 - clamp(input.moonIllumination, 0, 1)) * 10;
  const visibilityScore =
    input.visibilityKm !== undefined ? clamp(input.visibilityKm / 10, 0, 1) * 5 : 3;

  const score = Math.round(
    cloudScore + darknessScore + elevationScore + moonScore + visibilityScore,
  );
  const g = grade(score);

  const bits: string[] = [];
  bits.push(input.isNight ? "Dark skies" : "Daylight limits visibility");
  if (cloud <= 20) bits.push("clear conditions");
  else if (cloud <= 60) bits.push("some cloud");
  else bits.push("heavy cloud");
  if (input.bestElevationDeg >= 75) bits.push("near-zenith pass");
  else if (input.bestElevationDeg >= 30) bits.push("good elevation");
  else bits.push("low passes only");
  if (input.moonIllumination >= 0.7) bits.push("bright moon");

  return {
    score: clamp(score, 0, 100),
    grade: g,
    factors: {
      cloudCover: input.cloudCoverPct,
      isNight: input.isNight,
      moonIllumination: input.moonIllumination,
      bestElevationDeg: input.bestElevationDeg,
      visibilityKm: input.visibilityKm,
    },
    summary: bits.join(", ") + ".",
  };
}
