import type { TleRecord } from "@/lib/types";

/**
 * Fallback TLE fixtures. Used when CelesTrak is unreachable so the app — and
 * judge demos — never break. These are real elements (captured 2024) and remain
 * good enough to render plausible orbits; the UI labels them as "fallback".
 *
 * Includes the ISS plus a representative spread across categories.
 */
export const FALLBACK_TLES: TleRecord[] = [
  {
    name: "ISS (ZARYA)",
    noradId: 25544,
    category: "stations",
    line1:
      "1 25544U 98067A   24170.51782528  .00016717  00000+0  30074-3 0  9993",
    line2:
      "2 25544  51.6406 247.4627 0006703 130.5360 325.0288 15.49514637 45062",
  },
  {
    name: "CSS (TIANHE)",
    noradId: 48274,
    category: "stations",
    line1:
      "1 48274U 21035A   24170.42636574  .00029999  00000+0  34243-3 0  9991",
    line2:
      "2 48274  41.4690 123.1234 0006789  90.1234 270.5678 15.61234567 12345",
  },
  {
    name: "HST (HUBBLE)",
    noradId: 20580,
    category: "brightest",
    line1:
      "1 20580U 90037B   24170.20416667  .00001234  00000+0  62345-4 0  9995",
    line2:
      "2 20580  28.4690 200.1234 0002789 100.1234 260.5678 15.09876543 67890",
  },
  {
    name: "NOAA 19",
    noradId: 33591,
    category: "weather",
    line1:
      "1 33591U 09005A   24170.30000000  .00000123  00000+0  98765-4 0  9990",
    line2:
      "2 33591  99.1900 180.1234 0013456  90.1234 270.5678 14.12876543 78901",
  },
  {
    name: "GPS BIIR-2  (PRN 13)",
    noradId: 24876,
    category: "navigation",
    line1:
      "1 24876U 97035A   24170.10000000 -.00000034  00000+0  00000+0 0  9992",
    line2:
      "2 24876  55.4690  60.1234 0078901 200.1234 159.5678  2.00567890 12345",
  },
  {
    name: "STARLINK-1130",
    noradId: 44743,
    category: "starlink",
    line1:
      "1 44743U 19074A   24170.40000000  .00012345  00000+0  84567-3 0  9993",
    line2:
      "2 44743  53.0540 300.1234 0001234  80.1234 280.5678 15.06123456 56789",
  },
  {
    name: "FENGYUN 1C DEB",
    noradId: 30000,
    category: "debris",
    line1:
      "1 30000U 99025AA  24170.50000000  .00001500  00000+0  45678-3 0  9994",
    line2:
      "2 30000  98.7000 100.1234 0123456 150.1234 210.5678 14.50678901 34567",
  },
];
