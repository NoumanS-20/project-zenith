"use client";

import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import { useStore } from "@/store/useStore";
import { toSatrec, propagateSubpoint } from "@/lib/astro/propagate";
import type { SatState, SatCategory } from "@/lib/types";

// Cesium loads its Workers/Assets/Widgets from here (staged by copy-cesium.mjs).
if (typeof window !== "undefined") {
  (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium";
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
function darkImagery(): Cesium.ImageryLayer {
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
  const viewerRef = useRef<Cesium.Viewer | null>(null);
  const markerRef = useRef<Cesium.CustomDataSource | null>(null);
  const trailRef = useRef<Cesium.CustomDataSource | null>(null);
  const pointsRef = useRef<Cesium.PointPrimitiveCollection | null>(null);

  // Create the viewer once.
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    if (!document.getElementById("cesium-widgets-css")) {
      const link = document.createElement("link");
      link.id = "cesium-widgets-css";
      link.rel = "stylesheet";
      link.href = "/cesium/Widgets/widgets.css";
      document.head.appendChild(link);
    }

    const ionToken = process.env.NEXT_PUBLIC_CESIUM_ION_TOKEN;
    if (ionToken) Cesium.Ion.defaultAccessToken = ionToken;

    const viewer = new Cesium.Viewer(containerRef.current, {
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
    handler.setInputAction((evt: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
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

    return () => {
      handler.destroy();
      viewer.destroy();
      viewerRef.current = null;
      markerRef.current = null;
      trailRef.current = null;
      pointsRef.current = null;
    };
  }, []);

  // Observer marker + zenith cone, reacting to location changes.
  useEffect(() => {
    const apply = (lat: number, lon: number) => {
      const marker = markerRef.current;
      const viewer = viewerRef.current;
      if (!marker || !viewer) return;
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
      if (!points) return;
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
      if (!trail || !viewer) return;
      trail.entities.removeAll();
      if (noradId === null) return;

      const rec = useStore.getState().tles.find((t) => t.noradId === noradId);
      if (!rec) return;
      const satrec = toSatrec(rec);
      if (!satrec) return;

      const center = useStore.getState().effectiveEpoch();
      const positions: Cesium.Cartesian3[] = [];
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

  return <div ref={containerRef} className="size-full" />;
}

export default CesiumGlobe;
