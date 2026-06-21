// Generates README screenshots from the running dev server (http://localhost:3000).
// Usage: node scripts/screenshots.mjs   (dev server must be running)
import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";
const OUT = "docs/screenshots";
const webglArgs = [
  "--use-gl=angle",
  "--use-angle=swiftshader",
  "--enable-unsafe-swiftshader",
  "--ignore-gpu-blocklist",
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch({ args: webglArgs });

  // Desktop dashboard (ISS selected by default → telemetry + pass predictor)
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
  });
  await page.goto(BASE, { waitUntil: "load" });
  await sleep(8000); // globe + imagery tiles + first propagation tick
  await page.screenshot({ path: `${OUT}/desktop-dashboard.png` });

  // Sky map tab
  await page.getByTestId("panel-tab-sky").click();
  await sleep(2500);
  await page.screenshot({ path: `${OUT}/sky-map.png` });

  // Space weather tab
  await page.getByTestId("panel-tab-weather").click();
  await sleep(3500);
  await page.screenshot({ path: `${OUT}/space-weather.png` });
  await page.close();

  // Mobile
  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  await mobile.goto(BASE, { waitUntil: "load" });
  await sleep(8000);
  await mobile.screenshot({ path: `${OUT}/mobile.png` });
  await mobile.close();

  await browser.close();
  console.log(`[screenshots] saved to ${OUT}/`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
