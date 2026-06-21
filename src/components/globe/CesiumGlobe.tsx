"use client";

import { useEffect, useRef } from "react";
// Type-only import: erased at build time so Cesium is NOT bundled. The bundled
// (minified) Cesium tripped a "octal escape in template string" parse error in
// production. Instead we load the prebuilt UMD from /cesium at runtime.
import type * as CesiumNS from "cesium";
import { useStore } from "@/store/useStore";
import { toSatrec, propagateSubpoint } from "@/lib/astro/propagate";
import { registerGlobeApi, clearGlobeApi } from "@/lib/globeControls";
import type { SatState, SatCategory } from "@/lib/types";

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

type Win = { Cesium?: typeof CesiumNS; CESIUM_BASE_URL?: string };

/** Load the prebuilt Cesium UMD once and resolve the global Cesium namespace. */
let cesiumPromise: Promise<typeof CesiumNS> | null = null;
function loadCesium(): Promise<typeof CesiumNS> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Cesium needs a browser"));
  }
  const w = window as unknown as Win;
  if (w.Cesium) return Promise.resolve(w.Cesium);
  if (cesiumPromise) return cesiumPromise;

  w.CESIUM_BASE_URL = "/cesium";
  if (!document.getElementById("cesium-widgets-css")) {
    const link = document.createElement("link");
    link.id = "cesium-widgets-css";
    link.rel = "stylesheet";
    link.href = "/cesium/Widgets/widgets.css";
    document.head.appendChild(link);
  }

  cesiumPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "/cesium/Cesium.js";
    script.async = true;
    script.onload = () =>
      w.Cesium ? resolve(w.Cesium) : reject(new Error("Cesium not on window"));
    script.onerror = () => reject(new Error("Failed to load /cesium/Cesium.js"));
    document.body.appendChild(script);
  });
  return cesiumPromise;
}

export function CesiumGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let destroyed = false;
    let cleanup = () => {};
    loadCesium().then((Cesium) => {
      if (destroyed || !containerRef.current) return;
      cleanup = init(Cesium, containerRef.current);
    });
    return () => {
      destroyed = true;
      cleanup();
    };
  }, []);

  return <div ref={containerRef} className="size-full" />;
}

/** Build the viewer + all layers/handlers; returns a cleanup function. */
function init(Cesium: typeof CesiumNS, container: HTMLDivElement): () => void {
  const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
  if (ionToken) Cesium.Ion.defaultAccessToken = ionToken;

  const darkImagery = () =>
    new Cesium.ImageryLayer(
      new Cesium.UrlTemplateImageryProvider({
        url: "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png",
        subdomains: "abcd",
        credit: "© OpenStreetMap contributors, © CARTO",
        maximumLevel: 18,
      }),
    );

  // CARTO dark base ALWAYS (keyless), so the globe always has imagery even if
  // Ion fails; Ion satellite imagery is added as an overlay below.
  const viewer = new Cesium.Viewer(container, {
    baseLayer: darkImagery(),
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

  if (ionToken) {
    try {
      viewer.imageryLayers.add(Cesium.ImageryLayer.fromWorldImagery({}));
    } catch {
      /* keep CARTO base */
    }
  }

  const marker = new Cesium.CustomDataSource("observer");
  viewer.dataSources.add(marker);
  const trail = new Cesium.CustomDataSource("trail");
  viewer.dataSources.add(trail);
  const points = scene.primitives.add(new Cesium.PointPrimitiveCollection());

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

  const loc = useStore.getState().location;
  const cam = viewer.camera;
  cam.flyTo({
    destination: Cesium.Cartesian3.fromDegrees(loc.lon, loc.lat, 14_000_000),
    duration: 0,
  });

  // Bottom-left readout (heading + eye altitude).
  scene.camera.percentageChanged = 0.05;
  const syncReadout = () =>
    useStore
      .getState()
      .setCameraReadout(
        Cesium.Math.toDegrees(cam.heading),
        cam.positionCartographic.height / 1000,
      );
  scene.camera.changed.addEventListener(syncReadout);
  syncReadout();

  // Imperative API for the navigation controls.
  let mode: "2d" | "3d" = "3d";
  let topDown = false;
  registerGlobeApi({
    zoomIn: () => cam.zoomIn(Math.max(cam.positionCartographic.height * 0.35, 50_000)),
    zoomOut: () => cam.zoomOut(Math.max(cam.positionCartographic.height * 0.6, 80_000)),
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
          pitch: Cesium.Math.toRadians(topDown ? -90 : -45),
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

  // --- Observer marker + zenith cone ---
  const applyMarker = (lat: number, lon: number) => {
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
    marker.entities.add({
      position: Cesium.Cartesian3.fromDegrees(lon, lat, coneHeight / 2),
      cylinder: {
        length: coneHeight,
        topRadius: coneHeight * Math.tan(Cesium.Math.toRadians(32)),
        bottomRadius: 0,
        material: Cesium.Color.fromCssColorString(ZENITH).withAlpha(0.1),
        outline: true,
        outlineColor: Cesium.Color.fromCssColorString(ZENITH).withAlpha(0.35),
        numberOfVerticalLines: 8,
      },
    });
    scene.requestRender();
  };

  // --- Satellite point cloud ---
  const renderPoints = (states: SatState[], selectedId: number | null) => {
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
    scene.requestRender();
  };

  // --- Orbit trail + fly-to for the selected satellite ---
  const drawTrail = (noradId: number | null, doFly: boolean) => {
    trail.entities.removeAll();
    if (noradId === null) {
      scene.requestRender();
      return;
    }
    const rec = useStore.getState().tles.find((t) => t.noradId === noradId);
    const satrec = rec ? toSatrec(rec) : null;
    if (satrec) {
      const center = useStore.getState().effectiveEpoch();
      const positions: CesiumNS.Cartesian3[] = [];
      for (let dt = -50 * 60; dt <= 50 * 60; dt += 60) {
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
    }
    scene.requestRender();
    if (!doFly) return;
    const st = useStore.getState().satStates.find((s) => s.noradId === noradId);
    if (st) {
      cam.flyTo({
        destination: Cesium.Cartesian3.fromDegrees(
          st.lon,
          st.lat,
          Math.max(st.altKm * 1000 * 3, 4_000_000),
        ),
        duration: 1.4,
      });
    }
  };

  // Initial draws (Cesium + refs are ready now).
  const state0 = useStore.getState();
  applyMarker(state0.location.lat, state0.location.lon);
  renderPoints(state0.satStates, state0.selectedNoradId);
  drawTrail(state0.selectedNoradId, false);

  // Subscriptions.
  let prevLoc = state0.location;
  let prevSel = state0.selectedNoradId;
  let prevTleLen = state0.tles.length;
  const unsub = useStore.subscribe((s) => {
    if (s.location !== prevLoc) {
      prevLoc = s.location;
      applyMarker(s.location.lat, s.location.lon);
    }
    renderPoints(s.satStates, s.selectedNoradId);
    if (s.selectedNoradId !== prevSel) {
      prevSel = s.selectedNoradId;
      prevTleLen = s.tles.length;
      drawTrail(s.selectedNoradId, true);
    } else if (s.tles.length !== prevTleLen) {
      prevTleLen = s.tles.length;
      drawTrail(s.selectedNoradId, false);
    }
  });
  const trailIv = setInterval(
    () => drawTrail(useStore.getState().selectedNoradId, false),
    20_000,
  );

  return () => {
    clearInterval(trailIv);
    unsub();
    scene.camera.changed.removeEventListener(syncReadout);
    clearGlobeApi();
    handler.destroy();
    viewer.destroy();
  };
}

export default CesiumGlobe;
