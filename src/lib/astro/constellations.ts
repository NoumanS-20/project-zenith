/**
 * A compact bright-star catalogue + constellation line figures for the sky map.
 * Coordinates are J2000 (RA in hours, Dec in degrees). Precession drift vs.
 * "of date" is well under a degree this century — negligible at sky-map scale.
 *
 * Curated to the most recognizable constellations spread across both
 * hemispheres so something is always up wherever the observer is.
 */

export type Star = {
  name: string;
  /** Right ascension, hours (0..24). */
  ra: number;
  /** Declination, degrees (-90..90). */
  dec: number;
  /** Apparent magnitude (lower = brighter). */
  mag: number;
};

export type Constellation = {
  name: string;
  /** Line figure as pairs of star names. */
  lines: [string, string][];
};

export const STARS: Star[] = [
  // Orion
  { name: "Betelgeuse", ra: 5.919, dec: 7.407, mag: 0.5 },
  { name: "Rigel", ra: 5.242, dec: -8.202, mag: 0.18 },
  { name: "Bellatrix", ra: 5.418, dec: 6.35, mag: 1.64 },
  { name: "Mintaka", ra: 5.533, dec: -0.299, mag: 2.23 },
  { name: "Alnilam", ra: 5.604, dec: -1.202, mag: 1.69 },
  { name: "Alnitak", ra: 5.679, dec: -1.943, mag: 1.77 },
  { name: "Saiph", ra: 5.796, dec: -9.67, mag: 2.07 },
  // Ursa Major — Big Dipper
  { name: "Dubhe", ra: 11.062, dec: 61.751, mag: 1.79 },
  { name: "Merak", ra: 11.031, dec: 56.382, mag: 2.37 },
  { name: "Phecda", ra: 11.897, dec: 53.695, mag: 2.44 },
  { name: "Megrez", ra: 12.257, dec: 57.033, mag: 3.31 },
  { name: "Alioth", ra: 12.9, dec: 55.96, mag: 1.77 },
  { name: "Mizar", ra: 13.399, dec: 54.925, mag: 2.04 },
  { name: "Alkaid", ra: 13.792, dec: 49.313, mag: 1.86 },
  // Cassiopeia
  { name: "Caph", ra: 0.153, dec: 59.15, mag: 2.28 },
  { name: "Schedar", ra: 0.675, dec: 56.537, mag: 2.24 },
  { name: "Gamma Cas", ra: 0.945, dec: 60.717, mag: 2.47 },
  { name: "Ruchbah", ra: 1.43, dec: 60.235, mag: 2.68 },
  { name: "Segin", ra: 1.906, dec: 63.67, mag: 3.35 },
  // Crux — Southern Cross
  { name: "Acrux", ra: 12.443, dec: -63.099, mag: 0.77 },
  { name: "Mimosa", ra: 12.795, dec: -59.689, mag: 1.25 },
  { name: "Gacrux", ra: 12.519, dec: -57.113, mag: 1.59 },
  { name: "Imai", ra: 12.252, dec: -58.749, mag: 2.79 },
  // Cygnus — Northern Cross
  { name: "Deneb", ra: 20.69, dec: 45.28, mag: 1.25 },
  { name: "Sadr", ra: 20.371, dec: 40.257, mag: 2.23 },
  { name: "Gienah Cyg", ra: 20.77, dec: 33.97, mag: 2.48 },
  { name: "Delta Cyg", ra: 19.749, dec: 45.131, mag: 2.87 },
  { name: "Albireo", ra: 19.512, dec: 27.96, mag: 3.18 },
  // Leo
  { name: "Regulus", ra: 10.139, dec: 11.967, mag: 1.35 },
  { name: "Denebola", ra: 11.818, dec: 14.572, mag: 2.11 },
  { name: "Algieba", ra: 10.333, dec: 19.842, mag: 2.28 },
  { name: "Zosma", ra: 11.235, dec: 20.524, mag: 2.56 },
  { name: "Chort", ra: 11.237, dec: 15.43, mag: 3.33 },
  // Scorpius
  { name: "Antares", ra: 16.49, dec: -26.432, mag: 1.06 },
  { name: "Dschubba", ra: 16.005, dec: -22.622, mag: 2.29 },
  { name: "Sargas", ra: 17.622, dec: -42.998, mag: 1.86 },
  { name: "Shaula", ra: 17.56, dec: -37.104, mag: 1.62 },
  // Lone bright markers (help orient the map)
  { name: "Sirius", ra: 6.752, dec: -16.716, mag: -1.46 },
  { name: "Vega", ra: 18.616, dec: 38.784, mag: 0.03 },
  { name: "Arcturus", ra: 14.261, dec: 19.182, mag: -0.05 },
  { name: "Capella", ra: 5.278, dec: 45.998, mag: 0.08 },
  { name: "Aldebaran", ra: 4.599, dec: 16.509, mag: 0.86 },
  { name: "Pollux", ra: 7.755, dec: 28.026, mag: 1.14 },
  { name: "Castor", ra: 7.577, dec: 31.888, mag: 1.58 },
  { name: "Procyon", ra: 7.655, dec: 5.225, mag: 0.34 },
  { name: "Spica", ra: 13.42, dec: -11.161, mag: 0.97 },
  { name: "Fomalhaut", ra: 22.961, dec: -29.622, mag: 1.16 },
  { name: "Altair", ra: 19.846, dec: 8.868, mag: 0.76 },
];

export const CONSTELLATIONS: Constellation[] = [
  {
    name: "Orion",
    lines: [
      ["Betelgeuse", "Bellatrix"],
      ["Betelgeuse", "Alnitak"],
      ["Bellatrix", "Mintaka"],
      ["Mintaka", "Alnilam"],
      ["Alnilam", "Alnitak"],
      ["Alnitak", "Saiph"],
      ["Mintaka", "Rigel"],
      ["Saiph", "Rigel"],
    ],
  },
  {
    name: "Ursa Major",
    lines: [
      ["Dubhe", "Merak"],
      ["Merak", "Phecda"],
      ["Phecda", "Megrez"],
      ["Megrez", "Dubhe"],
      ["Megrez", "Alioth"],
      ["Alioth", "Mizar"],
      ["Mizar", "Alkaid"],
    ],
  },
  {
    name: "Cassiopeia",
    lines: [
      ["Caph", "Schedar"],
      ["Schedar", "Gamma Cas"],
      ["Gamma Cas", "Ruchbah"],
      ["Ruchbah", "Segin"],
    ],
  },
  {
    name: "Crux",
    lines: [
      ["Acrux", "Gacrux"],
      ["Mimosa", "Imai"],
    ],
  },
  {
    name: "Cygnus",
    lines: [
      ["Deneb", "Sadr"],
      ["Sadr", "Albireo"],
      ["Delta Cyg", "Sadr"],
      ["Sadr", "Gienah Cyg"],
    ],
  },
  {
    name: "Leo",
    lines: [
      ["Regulus", "Algieba"],
      ["Algieba", "Zosma"],
      ["Zosma", "Denebola"],
      ["Denebola", "Chort"],
      ["Chort", "Regulus"],
    ],
  },
  {
    name: "Scorpius",
    lines: [
      ["Dschubba", "Antares"],
      ["Antares", "Shaula"],
      ["Shaula", "Sargas"],
    ],
  },
];

/** Lookup helper: star by name. */
export const STAR_BY_NAME: Record<string, Star> = Object.fromEntries(
  STARS.map((s) => [s.name, s]),
);
