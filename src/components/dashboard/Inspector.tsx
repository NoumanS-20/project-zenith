"use client";

import { TelemetryPanel, SkyPositionPanel } from "./Dashboard";
import { PassPredictor } from "@/components/panels/PassPredictor";

/** Single right-side inspector for the selected object: telemetry, sky
 *  position, and passes stacked in one scroll column (not three loose cards).
 *  Each child Panel carries its own `.reveal` entrance — do not wrap this in
 *  another `.reveal` (would double-animate). */
export function Inspector() {
  return (
    <div className="flex max-h-[46dvh] flex-col gap-2 overflow-y-auto pr-0.5 lg:max-h-[calc(100dvh-5rem)]">
      <TelemetryPanel />
      <SkyPositionPanel />
      <PassPredictor />
    </div>
  );
}
