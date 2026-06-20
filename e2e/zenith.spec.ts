import { test, expect } from "@playwright/test";

const search = (page: import("@playwright/test").Page) =>
  page.getByPlaceholder(/Search satellite/i);

test.describe("Project Zenith", () => {
  test("app loads straight into the dashboard with a rendered globe", async ({
    page,
  }) => {
    await page.goto("/");
    await expect(page.getByText("Project Zenith").first()).toBeVisible();
    // CesiumJS mounts a WebGL canvas — confirms the globe initialized.
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 40_000 });
  });

  test("ISS is tracked by default — telemetry + shareable URL reflect it", async ({
    page,
  }) => {
    await page.goto("/");
    await page.waitForResponse(
      (r) => r.url().includes("/api/tle") && r.ok(),
      { timeout: 40_000 },
    );
    // Default selection is the ISS (NORAD 25544).
    await expect(page.getByText("NORAD 25544")).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/sat=25544/);
  });

  test("searching a coordinate moves the observer (URL updates)", async ({
    page,
  }) => {
    await page.goto("/");
    const box = search(page);
    await box.click();
    await box.fill("48.85, 2.35");
    await box.press("Enter");
    await expect(page).toHaveURL(/lat=48\.85/);
    await expect(page).toHaveURL(/lon=2\.35/);
  });

  test("shareable /observe link restores location + selected satellite", async ({
    page,
  }) => {
    await page.goto("/observe?lat=35.6800&lon=139.6500&sat=25544");
    await expect(page.getByText("NORAD 25544")).toBeVisible({ timeout: 30_000 });
    await expect(page).toHaveURL(/lat=35\.68/);
  });

  test("overhead list populates from live propagation, click updates selection", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "left panel collapses on mobile");
    await page.goto("/");
    const overhead = page
      .locator("section", { hasText: "Overhead Now" })
      .first();
    await expect(overhead).toBeVisible();
    const firstItem = overhead.locator("ul button").first();
    await expect(firstItem).toBeVisible({ timeout: 40_000 });
    await firstItem.click();
    // Selecting an object keeps a populated telemetry card visible.
    await expect(page.getByText(/NORAD \d+/).first()).toBeVisible();
  });

  test("pass predictor + observation score render with a selection", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "panels collapse on mobile");
    await page.goto("/");
    await expect(page.getByText("Observation Score").first()).toBeVisible({
      timeout: 40_000,
    });
    await expect(page.getByText("Pass Predictor").first()).toBeVisible({
      timeout: 40_000,
    });
  });

  test("mobile layout shows the bottom tab bar", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "mobile-only layout check");
    await page.goto("/");
    await expect(page.getByRole("button", { name: "overhead" })).toBeVisible();
    await expect(page.getByRole("button", { name: "sky" })).toBeVisible();
    await expect(page.locator("canvas").first()).toBeVisible({ timeout: 40_000 });
  });

  test("degrades gracefully when the TLE feed is unavailable", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name === "mobile", "left panel collapses on mobile");
    await page.route("**/api/tle**", (route) => route.abort());
    await page.goto("/");
    // App shell still renders — no crash, with an empty-state hint.
    await expect(page.getByText("Project Zenith").first()).toBeVisible();
    await expect(page.getByText(/Computing overhead objects/i)).toBeVisible({
      timeout: 20_000,
    });
  });
});
