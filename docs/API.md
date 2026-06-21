# API Reference — Project Zenith

All routes are **Next.js App Router route handlers** under `src/app/api/`. They act as a secure proxy: third-party keys are read server-side only and **never reach the browser**. Every upstream response is validated with Zod and normalized; on failure each route degrades to cached/fallback data with a `confidence` label.

Base URL (production): `https://project-zenith-alpha.vercel.app`

---

### `GET /api/tle`

Two-line element sets for satellites, from CelesTrak.

| Query | Type | Default | Notes |
|-------|------|---------|-------|
| `categories` | comma list | `stations,brightest,navigation` | any of `stations,brightest,starlink,navigation,weather,debris` |

**Response**
```jsonc
{
  "records": [{ "name": "ISS (ZARYA)", "noradId": 25544, "line1": "1 25544U…", "line2": "2 25544…", "category": "stations" }],
  "count": 24,
  "categories": ["stations"],
  "provenance": { "stations": { "source": "CelesTrak", "confidence": "live", "fetchedAt": 0, "method": "GP/TLE" } }
}
```
Cache: `s-maxage=7200, stale-while-revalidate=86400`. Falls back to bundled fixtures if CelesTrak is unreachable.

---

### `GET /api/iss`

Live ISS subpoint + people in space (Open-Notify).

**Response**
```jsonc
{
  "now": { "lat": -21.5, "lon": 28.6, "timestamp": 0, "provenance": { "source": "Open-Notify", "confidence": "live" } },
  "astros": { "number": 12, "people": [{ "name": "…", "craft": "ISS" }], "provenance": { … } }
}
```
`now` is `null` if Open-Notify is down — the client then propagates NORAD 25544 from its TLE. Cache: `s-maxage=5`.

---

### `GET /api/weather`

Observing conditions for a coordinate (OpenWeatherMap).

| Query | Type | Required |
|-------|------|----------|
| `lat` | number (-90..90) | yes |
| `lon` | number (-180..180) | yes |

**Response**
```jsonc
{ "cloudCoverPct": 71, "visibilityKm": 10, "description": "broken clouds",
  "provenance": { "source": "OpenWeatherMap", "confidence": "live", "fetchedAt": 0, "method": "REST" } }
```
Cache: `s-maxage=900`. Returns a labelled fallback when no key/unreachable.

---

### `GET /api/spaceweather`

NASA DONKI flares, CMEs, and geomagnetic storms (last 7 days) + aurora outlook.

**Response**
```jsonc
{
  "events": [{ "id": "…", "kind": "flare|cme|geostorm", "time": 0, "intensity": "M1.5", "note": "Solar flare (class M1.5)" }],
  "kpIndex": 6,
  "auroraLikelihood": "low|moderate|high",
  "observingImpact": "Recent solar flares — possible brief radio blackouts; minimal impact on visual observing.",
  "provenance": { "source": "NASA DONKI", "confidence": "live" }
}
```
Cache: `s-maxage=1800`.

---

### `GET /api/apod`

NASA Astronomy Picture of the Day.

**Response** (`null` if NASA APOD is unavailable)
```jsonc
{ "title": "…", "explanation": "…", "url": "https://…", "mediaType": "image", "date": "2026-06-21",
  "copyright": "…", "provenance": { "source": "NASA APOD", "confidence": "live" } }
```
Cache: `s-maxage=3600`.

---

### `GET /api/health`

Operational status of every data source (drives the Source Inspector). No keys leaked — reports only configured/operational state.

**Response**
```jsonc
{
  "sources": [{ "id": "celestrak", "label": "CelesTrak TLE", "status": "ok|degraded|fallback|down", "updateIntervalSec": 7200, "detail": "…" }],
  "generatedAt": 0
}
```
Cache: `s-maxage=60`.

---

## Shareable links

The dashboard hydrates from the query string, enabling deep links:

```
/observe?lat=13.0827&lon=80.2707&sat=25544
```

`lat`/`lon` set the observer; `sat` selects a NORAD id. The **Share** button copies the current state as one of these URLs.

## Environment variables

See [`.env.example`](../.env.example). All are optional and server-side, except `NEXT_PUBLIC_CESIUM_ION_TOKEN` (client, public by design). With **no keys at all**, the core experience still works via CelesTrak + Open-Notify + Astronomy Engine.
