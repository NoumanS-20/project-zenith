/**
 * A tiny imperative bridge between the floating navigation UI and the Cesium
 * viewer (which lives inside CesiumGlobe). CesiumGlobe registers the API on
 * mount; the Google-Earth-style controls call into it.
 */
export type GlobeApi = {
  zoomIn: () => void;
  zoomOut: () => void;
  resetNorth: () => void;
  tiltToggle: () => void;
  toggle2D3D: () => void;
  flyHome: () => void;
  mode: () => "2d" | "3d";
};

let api: GlobeApi | null = null;

export function registerGlobeApi(a: GlobeApi) {
  api = a;
}
export function clearGlobeApi() {
  api = null;
}

export const globe: GlobeApi = {
  zoomIn: () => api?.zoomIn(),
  zoomOut: () => api?.zoomOut(),
  resetNorth: () => api?.resetNorth(),
  tiltToggle: () => api?.tiltToggle(),
  toggle2D3D: () => api?.toggle2D3D(),
  flyHome: () => api?.flyHome(),
  mode: () => api?.mode() ?? "3d",
};
