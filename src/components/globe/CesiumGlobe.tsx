"use client";

import { useEffect, useRef } from "react";
import * as Cesium from "cesium";
import { useStore } from "@/store/useStore";

// Cesium loads its Workers/Assets/Widgets from here (staged by copy-cesium.mjs).
if (typeof window !== "undefined") {
  (window as unknown as { CESIUM_BASE_URL: string }).CESIUM_BASE_URL = "/cesium";
}

const ZENITH = "#38e1ff";

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

  const location = useStore((s) => s.location);
  const setLocation = useStore((s) => s.setLocation);

  // Create the viewer once.
  useEffect(() => {
    if (!containerRef.current || viewerRef.current) return;

    // Load Cesium's widget CSS from the staged assets (avoids bundler deep-import).
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

    // Aesthetic tuning.
    const scene = viewer.scene;
    scene.globe.baseColor = Cesium.Color.fromCssColorString("#0a1326");
    scene.globe.showGroundAtmosphere = true;
    if (scene.skyAtmosphere) scene.skyAtmosphere.show = true;
    scene.backgroundColor = Cesium.Color.TRANSPARENT;
    scene.fog.enabled = true;
    viewer.cesiumWidget.creditContainer.classList.add("cesium-credits");
    viewer.scene.screenSpaceCameraController.minimumZoomDistance = 800_000;

    // Data source that holds the observer marker + zenith cone.
    const marker = new Cesium.CustomDataSource("observer");
    viewer.dataSources.add(marker);
    markerRef.current = marker;

    // Click anywhere on the globe → pick that coordinate.
    const handler = new Cesium.ScreenSpaceEventHandler(scene.canvas);
    handler.setInputAction((evt: Cesium.ScreenSpaceEventHandler.PositionedEvent) => {
      const cartesian = scene.camera.pickEllipsoid(evt.position, scene.globe.ellipsoid);
      if (!cartesian) return;
      const carto = Cesium.Cartographic.fromCartesian(cartesian);
      const lat = Cesium.Math.toDegrees(carto.latitude);
      const lon = Cesium.Math.toDegrees(carto.longitude);
      setLocation({
        lat: Number(lat.toFixed(4)),
        lon: Number(lon.toFixed(4)),
        alt: 0,
        label: "Custom coordinate",
      });
    }, Cesium.ScreenSpaceEventType.LEFT_CLICK);

    viewerRef.current = viewer;

    // Initial camera position over the default observer.
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(
        location.lon,
        location.lat,
        14_000_000,
      ),
      duration: 0,
    });

    return () => {
      handler.destroy();
      viewer.destroy();
      viewerRef.current = null;
      markerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Reposition the observer marker + zenith cone whenever the location changes.
  useEffect(() => {
    const marker = markerRef.current;
    const viewer = viewerRef.current;
    if (!marker || !viewer) return;

    marker.entities.removeAll();
    const { lat, lon } = location;

    // Ground pin.
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

    // Horizon ring on the ground.
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

    // Zenith cone — luminous overhead search volume opening upward.
    const coneHeight = 1_200_000; // ~1200 km visual
    const halfAngleDeg = 32;
    const topRadius = coneHeight * Math.tan(Cesium.Math.toRadians(halfAngleDeg));
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

    // Ease the camera toward the new location.
    viewer.camera.flyTo({
      destination: Cesium.Cartesian3.fromDegrees(lon, lat, 9_000_000),
      duration: 1.2,
    });
  }, [location]);

  return <div ref={containerRef} className="size-full" />;
}

export default CesiumGlobe;
