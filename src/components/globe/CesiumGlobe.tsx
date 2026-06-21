"use client";

import { useEffect, useRef, useState } from "react";
// Types only — erased at build time. The Cesium *runtime* is loaded as an
// external script (see loadCesium below), NOT bundled. Bundling Cesium's
// prebuilt UMD makes the minifier re-emit its inlined wasm as a template
// literal with octal escapes — an illegal-syntax chunk that hangs the globe.
// Loading the pristine /cesium/Cesium.js as a global avoids that entirely
// and keeps Cesium (~5.8MB) out of the app bundle for a faster first load.
import type * as CesiumNS from "cesium";
import { useStore } from "@/store/useStore";
import { toSatrec, propagateSubpoint } from "@/lib/astro/propagate";
import { registerGlobeApi, clearGlobeApi } from "@/lib/globeControls";
import type { SatState, SatCategory } from "@/lib/types";

// The external Cesium.js UMD bundle attaches itself to window.Cesium.
declare global {
  interface Window {
    Cesium?: typeof CesiumNS;
    CESIUM_BASE_URL?: string;
  }
}

const CESIUM_SCRIPT_ID = "cesium-umd-script";

/**
 * Load the pristine prebuilt Cesium from /cesium/Cesium.js (staged by
 * copy-cesium.mjs) as a one-time external script and resolve window.Cesium.
 * Idempotent across mounts.
 */
function loadCesium(): Promise<typeof CesiumNS> {
  if (window.Cesium) return Promise.resolve(window.Cesium);
  // Cesium reads this to find its Workers/Assets/Widgets.
  window.CESIUM_BASE_URL = "/cesium";

  return new Promise((resolve, reject) => {
    const existing = document.getElementById(CESIUM_SCRIPT_ID) as
      | HTMLScriptElement
      | null;
    if (existing) {
      if (window.Cesium) return resolve(window.Cesium);
      existing.addEventListener("load", () =>
        window.Cesium ? resolve(window.Cesium) : reject(new Error("Cesium global missing after load")),
      );
      existing.addEventListener("error", () => reject(new Error("Cesium script failed to load")));
      return;
    }
    const script = document.createElement("script");
    script.id = CESIUM_SCRIPT_ID;
    script.src = "/cesium/Cesium.js";
    script.async = true;
    script.onload = () =>
      window.Cesium ? resolve(window.Cesium) : reject(new Error("Cesium global missing after load"));
    script.onerror = () => reject(new Error("Cesium script failed to load"));
    document.head.appendChild(script);
  });
}

const ZENITH = "#38e1ff";
const ISS_NORAD = 25544;

const CATEGORY_COLOR: Record<SatCategory, string> = {
  stations: "#38e1ff",
  brightest: "#ffffff",
  starlink: "#7c5cff",
  navigation: "#34f5c5",
  weather: "#5db4ff",
  debris: "#6b7da6",
  other: "#9fb2d4",
};

/** Dark, keyless CARTO basemap — fits the command-center aesthetic, no Ion token. */
function darkImagery(Cesium: typeof CesiumNS): CesiumNS.ImageryLayer {
  return new Cesium.ImageryLayer(
    new Cesium.UrlTemplateImageryProvider({
      url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
      subdomains: "abcd",
      credit: "© OpenStreetMap contributors, © CARTO",
      maximumLevel: 18,
    }),
  );
}

export function CesiumGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<CesiumNS.Viewer | null>(null);
  const markerRef = useRef<CesiumNS.CustomDataSource | null>(null);
  const trailRef = useRef<CesiumNS.CustomDataSource | null>(null);
  const pointsRef = useRef<CesiumNS.PointPrimitiveCollection | null>(null);
  const [loadError, setLoadError] = useState(false);

  // Create the viewer once.
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;
    let cancelled = false;
    let cleanup: (() => void) | undefined;

    loadCesium()
      .then((Cesium) => {
        const container = containerRef.current;
        if (cancelled || !container || viewerRef.current) return;
        cleanup = initViewer(Cesium, container);
      })
      .catch((err) => {
        console.error("[CesiumGlobe] failed to load Cesium:", err);
        if (!cancelled) setLoadError(true);
      });

    // Synchronously-defined setup, invoked once Cesium is available.
    function initViewer(Cesium: typeof CesiumNS, container: HTMLDivElement): () => void {
    if (!document.getElementById("cesium-widgets-css")) {
      const link = document.createElement("link");
      link.id = "cesium-widgets-css";
      link.rel = "stylesheet";
      link.href = "/cesium/Widgets/widgets.css";
      document.head.appendChild(link);
    }

    const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
    if (ionToken) Cesium.Ion.defaultAccessToken = ionToken;

    // With an Ion token: real satellite imagery (Google-Earth-like).
    // Without: keyless dark CARTO basemap that still suits the dark theme.
    // Default world imagery style is aerial-with-labels — the Google-Earth look.
    const baseLayer = ionToken
      ? Cesium.ImageryLayer.fromWorldImagery({})
      : darkImagery(Cesium);

    const viewer = new Cesium.Viewer(container, {
      baseLayer,
      // Render only when something changes (camera/entities) instead of a
      // continuous loop — big CPU/GPU win and keeps the main thread idle.
      requestRenderMode: true,
      maximumRenderTimeChange: Infinity,
      baseLayerPicker: false,
      geocoder: false,
      homeButton: false,
      sceneModePicker: false,
      navigationHelpButton: false,
      animation: false,
      timeline: false,
      fullscreenButton: false,
      selectionIndicator: false,
      infoBox: false,
      terrainProvider: new Cesium.EllipsoidTerrainProvider(),
    });

    const scene = viewer.scene;
    scene.globe.baseColor = Cesium.Color.fromCssColorString("#0a1326");
    scene.globe.showGroundAtmosphere = true;
    if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
    scene.backgroundColor = Cesium.Color.TRANSPARENT;
    scene.fog.enabled = true;
    viewer.cesiumWidget.creditContainer.classList.add("cesium-credits");
    scene.screenSpaceCameraController.minimumZoomDistance = 800_000;

    const marker = new Cesium.CustomDataSource("observer");
    viewer.dataSources.add(marker);
    markerRef.current = marker;

    const trail = new Cesium.CustomDataSource("trail");
    viewer.dataSources.add(trail);
    trailRef.current = trail;

    const points = scene.primitives.add(new Cesium.PointPrimitiveCollection());
    pointsRef.current = points;

    // Click → select a satellite if one was hit, otherwise pick the coordinate.
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction((evt: CesiumNS.ScreenSpaceEventHandler.PositionedEvent) => {
      const picked = scene.pick(evt.position) as { id?: unknown } | undefined;
      const pid = picked?.id as { noradId?: number } | undefined;
      if (pid && typeof pid.noradId === "number") {
        useStore.getState().selectObject(pid.noradId);
        return;
      }
      const cartesian = scene.camera.pickEllipsoid(evt.position, scene.globe.ellipsoid);
      if (!cartesian) return;
      const carto = Cesium.Cartographic.fromCartesian(cartesian);
      useStore.getState().setLocation({
        lat: Number(Cesium.Math.toDegrees(carto.latitude).toFixed(4)),
        lon: Number(Cesium.Math.toDegrees(carto.longitude).toFixed(4)),
        alt: 0,
        label: "Custom coordinate",
      });
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = viewer;

    const loc = useStore.getState().location;
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(loc.lon, loc.lat, 14_000_000),
      duration: 0,
    });

    // Keep the bottom-left readout (heading + eye altitude) in sync.
    const cam = viewer.camera;
    scene.camera.percentageChanged = 0.05;
    const syncReadout = () => {
      useStore
        .getState()
        .setCameraReadout(
          Cesium.Math.toDegrees(cam.heading),
          cam.positionCartographic.height / 1000,
        );
    };
    scene.camera.changed.addEventListener(syncReadout);
    syncReadout();

    // Imperative API for the Google-Earth-style navigation controls.
    let mode: "2d" | "3d" = "3d";
    let topDown = false;
    registerGlobeApi({
      zoomIn: () => cam.zoomIn(Math.max(cam.positionCartographic.height * 0.35, 50_000)),
      zoomOut: () =>
        cam.zoomOut(Math.max(cam.positionCartographic.height * 0.6, 80_000)),
      resetNorth: () =>
        cam.flyTo({
          destination: cam.position.clone(),
          orientation: { heading: 0, pitch: cam.pitch, roll: 0 },
          duration: 0.6,
        }),
      tiltToggle: () => {
        topDown = !topDown;
        cam.flyTo({
          destination: cam.position.clone(),
          orientation: {
            heading: cam.heading,
            pitch: topDown
              ? Cesium.Math.toRadians(-90)
              : Cesium.Math.toRadians(-45),
            roll: 0,
          },
          duration: 0.6,
        });
      },
      toggle2D3D: () => {
        if (mode === "3d") {
          scene.morphTo2D(1.0);
          mode = "2d";
        } else {
          scene.morphTo3D(1.0);
          mode = "3d";
        }
        useStore.getState().setSceneMode(mode);
      },
      flyHome: () => {
        const l = useStore.getState().location;
        cam.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(l.lon, l.lat, 9_000_000),
          duration: 1.2,
        });
      },
      mode: () => mode,
    });

    return () => {
      scene.camera.changed.removeEventListener(syncReadout);
      clearGlobeApi();
      handler.destroy();
      viewer.destroy();
      viewerRef.current = null;
      markerRef.current = null;
      trailRef.current = null;
      pointsRef.current = null;
    };
    } // end initViewer

    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, []);

  // Observer marker + zenith cone, reacting to location changes.
  useEffect(() => {
    const apply = (lat: number, lon: number) => {
      const marker = markerRef.current;
      const viewer = viewerRef.current;
      const Cesium = window.Cesium;
      if (!marker || !viewer || !Cesium) return;
      marker.entities.removeAll();

      marker.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
        point: {
          pixelSize: 11,
          color: Cesium.Color.fromCssColorString(ZENITH),
          outlineColor: Cesium.Color.WHITE,
          outlineWidth: 2,
          disableDepthTestDistance: Number.POSITIVE_INFINITY,
        },
      });
      marker.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, 0),
        ellipse: {
          semiMinorAxis: 350_000,
          semiMajorAxis: 350_000,
          material: Cesium.Color.fromCssColorString(ZENITH).withAlpha(0.06),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(ZENITH).withAlpha(0.5),
          height: 0,
        },
      });
      const coneHeight = 1_200_000;
      const topRadius = coneHeight * Math.tan(Cesium.Math.toRadians(32));
      marker.entities.add({
        position: Cesium.Cartesian3.fromDegrees(lon, lat, coneHeight / 2),
        cylinder: {
          length: coneHeight,
          topRadius,
          bottomRadius: 0,
          material: Cesium.Color.fromCssColorString(ZENITH).withAlpha(0.1),
          outline: true,
          outlineColor: Cesium.Color.fromCssColorString(ZENITH).withAlpha(0.35),
          numberOfVerticalLines: 8,
        },
      });
      viewer.camera.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(lon, lat, 9_000_000),
        duration: 1.2,
      });
      viewer.scene.requestRender();
    };

    const { lat, lon } = useStore.getState().location;
    apply(lat, lon);
    // Re-fire only when the location object actually changes.
    let prev = useStore.getState().location;
    const unsub = useStore.subscribe((s) => {
      if (s.location !== prev) {
        prev = s.location;
        apply(s.location.lat, s.location.lon);
      }
    });
    return () => unsub();
  }, []);

  // Satellite point cloud — rebuilt each engine tick from the store.
  useEffect(() => {
    const render = (states: SatState[], selectedId: number | null) => {
      const points = pointsRef.current;
      const Cesium = window.Cesium;
      if (!points || !Cesium) return;
      points.removeAll();
      for (const s of states) {
        const isIss = s.noradId === ISS_NORAD;
        const isSel = s.noradId === selectedId;
        const baseColor = isIss ? "#ffb454" : CATEGORY_COLOR[s.category] ?? "#9fb2d4";
        points.add({
          position: Cesium.Cartesian3.fromDegrees(s.lon, s.lat, s.altKm * 1000),
          color: Cesium.Color.fromCssColorString(baseColor).withAlpha(
            isSel || isIss ? 1 : 0.85,
          ),
          pixelSize: isSel ? 14 : isIss ? 11 : 5,
          outlineColor: isSel
            ? Cesium.Color.WHITE
            : Cesium.Color.fromCssColorString(baseColor).withAlpha(0.4),
          outlineWidth: isSel ? 2 : 0,
          id: { noradId: s.noradId, name: s.name },
        });
      }
      viewerRef.current?.scene.requestRender();
    };

    render(useStore.getState().satStates, useStore.getState().selectedNoradId);
    const unsub = useStore.subscribe((s) =>
      render(s.satStates, s.selectedNoradId),
    );
    return () => unsub();
  }, []);

  // Orbit trail + fly-to for the selected satellite.
  useEffect(() => {
    const drawTrail = (noradId: number | null, doFly: boolean) => {
      const trail = trailRef.current;
      const viewer = viewerRef.current;
      const Cesium = window.Cesium;
      if (!trail || !viewer || !Cesium) return;
      trail.entities.removeAll();
      if (noradId === null) return;

      const rec = useStore.getState().tles.find((t) => t.noradId === noradId);
      if (!rec) return;
      const satrec = toSatrec(rec);
      if (!satrec) return;

      const center = useStore.getState().effectiveEpoch();
      const positions: CesiumNS.Cartesian3[] = [];
      const stepSec = 60;
      const spanSec = 50 * 60; // ~ one LEO orbit either side
      for (let dt = -spanSec; dt <= spanSec; dt += stepSec) {
        const sp = propagateSubpoint(satrec, new Date(center + dt * 1000));
        if (sp)
          positions.push(
            Cesium.Cartesian3.fromDegrees(sp.lon, sp.lat, sp.altKm * 1000),
          );
      }
      if (positions.length > 1) {
        trail.entities.add({
          polyline: {
            positions,
            width: 2,
            material: new Cesium.PolylineGlowMaterialProperty({
              glowPower: 0.25,
              color: Cesium.Color.fromCssColorString("#ffb454").withAlpha(0.9),
            }),
            arcType: Cesium.ArcType.NONE,
          },
        });
      }

      viewer.scene.requestRender();

      // Fly to the satellite's current position (only on user selection).
      if (!doFly) return;
      const st = useStore.getState().satStates.find((s) => s.noradId === noradId);
      if (st) {
        viewer.camera.flyTo({
          destination: Cesium.Cartesian3.fromDegrees(
            st.lon,
            st.lat,
            Math.max(st.altKm * 1000 * 3, 4_000_000),
          ),
          duration: 1.4,
        });
      }
    };

    // Initial draw: show the trail but keep the wide globe view.
    drawTrail(useStore.getState().selectedNoradId, false);
    let prevSel = useStore.getState().selectedNoradId;
    let prevTleLen = useStore.getState().tles.length;
    const unsub = useStore.subscribe((s) => {
      if (s.selectedNoradId !== prevSel) {
        prevSel = s.selectedNoradId;
        prevTleLen = s.tles.length;
        drawTrail(s.selectedNoradId, true);
      } else if (s.tles.length !== prevTleLen) {
        prevTleLen = s.tles.length;
        drawTrail(s.selectedNoradId, false);
      }
    });
    // Refresh the trail periodically so the ground track stays current.
    const iv = setInterval(
      () => drawTrail(useStore.getState().selectedNoradId, false),
      20_000,
    );
    return () => {
      unsub();
      clearInterval(iv);
    };
  }, []);

  // If the external Cesium script can't load, throw so GlobeErrorBoundary
  // swaps in the dependency-free 2D fallback instead of hanging forever.
  if (loadError) throw new Error("Cesium failed to load");

  return <div ref={containerRef} className="size-full" />;
}

export default CesiumGlobe;
