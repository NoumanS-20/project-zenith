import { describe, it, expect } from "vitest";
import { EASE_OUT, EASE_DRAWER, DUR } from "@/lib/motion";

describe("motion tokens", () => {
  it("exposes a strong ease-out curve (no ease-in)", () => {
    expect(EASE_OUT).toBe("cubic-bezier(0.23, 1, 0.32, 1)");
  });
  it("exposes the iOS drawer curve", () => {
    expect(EASE_DRAWER).toBe("cubic-bezier(0.32, 0.72, 0, 1)");
  });
  it("keeps UI durations under 300ms and exit faster than enter", () => {
    expect(DUR.press).toBeLessThanOrEqual(160);
    expect(DUR.enter).toBeLessThanOrEqual(300);
    expect(DUR.exit).toBeLessThan(DUR.enter);
  });
});
