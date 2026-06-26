# 🎬 Project Zenith — Demo Video Script

**Live:** https://project-zenith-alpha.vercel.app · **Repo:** https://github.com/NoumanS-20/project-zenith
**Team:** IDSCC — SRM IST · **Target length:** ~2:30 (a 60-second cut is at the bottom)

---

## Before you record (60-second setup)

- Use **Chrome, full-screen, 1920×1080**, hardware acceleration ON (so the globe is crisp).
- Open the **live URL** fresh (so it loads from `?lat=13.0827&lon=80.2707&sat=25544` — Chennai + ISS).
- Pick a recording time when it's **night somewhere interesting** for the sky-map shot (or use the Tokyo/London preset on the night side) so constellations + a "Visible" pass show well.
- Close devtools. Have the cursor movements slow and deliberate.
- Record voiceover separately if you can — cleaner than live narration.

---

## Full script (~2:30)

> Format: **[TIME] ON SCREEN** — *voiceover.*

### 1 · Hook (0:00–0:15)
**[0:00] The dark 3D globe is already spinning gently, satellites scattered across it, the cyan zenith cone glowing over Chennai.**
*"This is Project Zenith — The Celestial Eye. It turns any point on Earth into a live observatory. No install, no sign-in — it opens straight into mission control."*

### 2 · Pick any coordinate (0:15–0:40)
**[0:15] Click a different spot on the globe — the zenith cone jumps there, the camera eases over, the coordinate readout updates bottom-left.**
*"Click anywhere on Earth and the observatory moves with you — a glowing zenith cone marks the search volume directly overhead."*
**[0:28] Click the search bar, type `Tokyo` (or a preset chip), select it.**
*"Or search a place, a satellite, or raw coordinates. Everything updates in real time."*

### 3 · Real-time satellites & the ISS (0:40–1:05)
**[0:40] Open the *Overhead* dock chip — the ranked list of objects currently above the location.**
*"These are the objects over your head right now — ranked by how close they are to your zenith, computed live from real orbital data."*
**[0:52] Click **ISS (ZARYA)**. The camera flies to it; the golden orbit trail draws; the Inspector fills with telemetry.**
*"Select the ISS and we fly to it — a live orbit trail, altitude four-hundred-and-eight kilometres, seven-point-six-six kilometres a second, updating every second."*

### 4 · Pass predictor & observation score (1:05–1:30)
**[1:05] In the Inspector, expand the *Pass Predictor* — show the elevation chart and the green "VISIBLE" badge.**
*"Zenith predicts the next twenty-four hours of passes — when to look, which direction, how high, and whether the sky will be dark enough to actually see it."*
**[1:18] Click "Add to calendar (.ics)". Then open the *Weather* chip → Observation Score gauge.**
*"Export a pass to your calendar — and check the observation score: live cloud cover, twilight, and moon phase, blended into one number."*

### 5 · Sky map, constellations & space weather (1:30–1:55)
**[1:30] Open the *Sky* chip. Show the circular sky map: planets, Moon, constellation lines, and the satellite pass arc. Toggle "✦ Lines".**
*"The sky map shows exactly what's above you — planets, the Moon, constellation figures, and the arc the selected satellite will trace across your sky."*
**[1:44] Open *Weather* → Space Weather panel (NASA DONKI events + aurora outlook).**
*"And live space weather from NASA — solar flares, storms, and an aurora outlook, in plain English."*

### 6 · Built to be trusted & demo-safe (1:55–2:15)
**[1:55] Hover a data source / show the "Source: CelesTrak · SGP4 · age 0s" line and a confidence badge.**
*"Every number is labelled with its source, its freshness, and its confidence — live, predicted, cached, or fallback."*
**[2:05] Click **Share** (toast: link copied), then **Presentation** for a clean globe; resize the window narrow to show the mobile layout.**
*"Share a link that restores the exact view, switch to presentation mode, and it's fully responsive — phone to 4K. If a device has no WebGL, it drops to a 2D map instead of breaking."*

### 7 · Close (2:15–2:30)
**[2:15] Pull back to the full globe; satellites and the ISS trail in frame.**
*"Real-time orbital mechanics in the browser, ten data sources, API keys kept server-side, and a full test suite in CI. Project Zenith — by Team IDSCC. Thanks for watching."*
**[2:28] End card: logo + live URL + repo URL.**

---

## 60-second cut (if a short version is required)

1. **(0:00–0:08)** Globe + zenith cone — *"Project Zenith turns any point on Earth into a live observatory."*
2. **(0:08–0:20)** Click a coordinate → cone moves, camera flies. *"Click anywhere — see what's overhead, in real time."*
3. **(0:20–0:34)** Select the ISS → orbit trail + live telemetry. *"Track the ISS and thousands of satellites, propagated live."*
4. **(0:34–0:46)** Pass Predictor (VISIBLE badge) + Observation Score. *"Know exactly when and where to look — and if the sky's clear."*
5. **(0:46–0:56)** Sky map with constellations + NASA space weather. *"A live sky map, constellations, and space-weather alerts."*
6. **(0:56–1:00)** End card: live URL + repo. *"Project Zenith — Team IDSCC."*

---

## On-screen lower-thirds (optional captions)

- "Real-time data: CelesTrak · Open-Notify · NASA · N2YO · OpenWeather"
- "Client-side SGP4 orbital propagation"
- "API keys server-side · graceful offline fallback"
- "Next.js · CesiumJS · TypeScript · tested in CI"

## Judging-criteria callouts (make sure each is on camera)

- **UI/UX & cosmic theme** → the opening globe, dark glass panels, smooth fly-to.
- **Real-time data integration** → overhead list + ISS telemetry "age 0s" + source labels.
- **Feature richness** → orbit trail, pass predictor, observation score, sky map + constellations, space weather, share link.
- **Code quality & docs** → mention tests/CI + the README/architecture docs in the close.
