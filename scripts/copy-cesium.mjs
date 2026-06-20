// Copies CesiumJS static assets (Workers, Assets, Widgets, ThirdParty) into
// public/cesium so the globe can load them at runtime via CESIUM_BASE_URL.
// This avoids any webpack/turbopack loader config and works in dev + on Vercel.
import { cp, access, rm } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const src = resolve(root, "node_modules", "cesium", "Build", "Cesium");
const dest = resolve(root, "public", "cesium");

async function exists(p) {
  try {
    await access(p, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(src))) {
    console.warn("[copy-cesium] Cesium build assets not found yet, skipping.");
    return;
  }
  if (await exists(dest)) {
    await rm(dest, { recursive: true, force: true });
  }
  await cp(src, dest, { recursive: true });
  console.log("[copy-cesium] Cesium assets copied to public/cesium");
}

main().catch((err) => {
  console.error("[copy-cesium] failed:", err);
  // Non-fatal: never block install/build on asset copy.
  process.exit(0);
});
