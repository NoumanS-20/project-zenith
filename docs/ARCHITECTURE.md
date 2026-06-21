# Architecture — Project Zenith

> How a click on the globe becomes a live picture of the sky above that point.

## High-level data flow

```
┌──────────────────────────── BROWSER ────────────────────────────┐
│                                                                  │
│  Zustand store            TanStack Query           Astronomy     │
│  (location, selection,    (cache, polling,         Engine        │
│   filters, time, camera)   stale-while-revalidate)  (Sun/Moon/   │
│        │                        │                    planets)    │
│        ▼                        ▼                       │        │
│  useSatelliteEngine  ───►  fetch /api/* ──┐            │        │
│   (1 Hz SGP4 tick)                        │            │        │
│        │                                  │            │        │
│        ▼                                  │            ▼        │
│  satellite.js (SGP4)                      │    sky.ts / score.ts │
│  observer az/el + overhead filter         │    passes.ts (SGP4)  │
│        │                                  │            │        │
│        ▼                                  │            ▼        │
│  CesiumJS globe  ·  2D fallback  ·  Sky Map · Panels · Charts    │
│                                           │                      │
└───────────────────────────────────────────┼──────────────────────┘
                                            │  (HTTPS, keys server-side)
                  ┌─────────────────────────▼─────────────────────────┐
                  │             NEXT.JS ROUTE HANDLERS (proxy)         │
                  │  /api/tle  /api/iss  /api/weather                  │
                  │  /api/spaceweather  /api/apod  /api/health         │
                  │   • Zod-validate every upstream response           │
                  │   • cache (Next data cache + Cache-Control)        │
                  │   • graceful fallback to fixtures                  │
                  └─────────────────────────┬─────────────────────────┘
                                            │
        ┌───────────────┬──────────────┬────┴──────┬─────────────┬───────────┐
     CelesTrak     Open-Notify       NASA          N2YO       OpenWeather   (IP geo)
     TLE/GP        ISS + crew     DONKI·APOD·NeoWs  passes    cloud/vis
```

## Layers

| Layer | Responsibility | Key files |
|-------|----------------|-----------|
| **State** | Selected location/object, filters, time, camera, panel UI | `src/store/useStore.ts` |
| **Data fetching** | Cached, validated access to the proxy routes | `src/hooks/*`, `@tanstack/react-query` |
| **Secure proxy** | Server-only calls to upstreams; keys never sent to browser | `src/app/api/*`, `src/lib/providers/*`, `src/lib/env.ts` |
| **Validation** | Parse/normalize every external payload | `src/lib/schemas.ts` (Zod) |
| **Orbital engine** | SGP4 propagation, observer look-angles, overhead ranking, pass prediction, scoring | `src/lib/astro/*` |
| **Astronomy** | Sun/Moon/planet positions, twilight, moon phase | `src/lib/astro/sky.ts` (Astronomy Engine) |
| **Rendering** | 3D globe, 2D fallback, sky map, panels, charts | `src/components/*` |

## Key decisions

- **Direct (imperative) CesiumJS, not Resium.** Avoids React-19 peer-dependency friction and gives precise control of the viewer, entities, and camera. The globe is loaded client-only via `next/dynamic({ ssr: false })`.
- **satellite.js v5 (pure JS), not v7.** v7 inlines a WASM module that hangs the Turbopack production build when bundled for the browser. v5 has the same classic SGP4 API and builds cleanly.
- **Cesium `requestRenderMode`.** The globe renders on demand (camera/entity changes) instead of a continuous loop — large CPU/GPU savings and keeps the main thread idle. Position updates call `scene.requestRender()`.
- **Propagation on a 1 Hz tick, never in the render loop.** A few hundred curated objects propagate in <10 ms/tick on the main thread; a Web Worker (`src/workers/propagate.worker.ts`) is included to scale to the full catalog.
- **Keys server-side only.** Every keyed provider is proxied through a Next.js route handler; `NEXT_PUBLIC_CESIUM_ION_TOKEN` is the only client value (public by design).
- **Graceful degradation everywhere.** CelesTrak/ISS/NASA/OpenWeather each fall back to fixtures or "assumed" values with a confidence label; the app drops to a 2D map without WebGL.

## Caching & freshness

| Source | Revalidate | Why |
|--------|-----------|-----|
| CelesTrak TLE | 2 h | Orbital elements change slowly; CelesTrak asks clients not to poll hard |
| Open-Notify ISS | 5 s | Live position |
| OpenWeather | 15 min | Conditions change slowly |
| NASA DONKI | 30 min | Event feed |
| NASA APOD | 1 h | Daily image |
| `/api/health` | 1 min | Status panel |

Confidence is surfaced in the UI as **live / predicted / cached / fallback** badges.

## Rendering & performance

- Satellites drawn as a batched **PointPrimitiveCollection**, not thousands of entities.
- Category filters + level-of-detail keep the visible set small.
- `requestRenderMode` + `requestAnimationFrame` visual updates; **no external API calls inside animation loops**.
- 2D fallback (`Globe2DFallback`) is pure SVG — works with zero WebGL.

See [API.md](API.md) for the route contracts.
