"use client";

import { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { Panel } from "@/components/ui/primitives";
import { usePasses } from "@/hooks/usePasses";
import { azToCompass } from "@/lib/astro/passes";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/cn";
import type { SatPass } from "@/lib/types";

const QUALITY_COLOR: Record<SatPass["visibilityQuality"], string> = {
  excellent: "var(--color-aurora)",
  good: "var(--color-zenith)",
  fair: "var(--color-solar)",
  poor: "var(--color-ink-faint)",
};

function fmtTime(ms: number) {
  return new Date(ms).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });
}
function fmtDay(ms: number) {
  return new Date(ms).toLocaleDateString([], { weekday: "short" });
}
function fmtDur(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}m ${s.toString().padStart(2, "0")}s`;
}

export function PassPredictor() {
  const selectedId = useStore((s) => s.selectedNoradId);
  const passes = usePasses();
  const [openIdx, setOpenIdx] = useState(0);

  if (selectedId == null) return null;

  return (
    <Panel
      title="Pass Predictor"
      action={
        <span className="text-[0.62rem] text-[color:var(--color-ink-faint)]">
          next 24h
        </span>
      }
    >
      {passes.length === 0 ? (
        <p className="py-2 text-xs text-[color:var(--color-ink-faint)]">
          No passes above 10° in the next 24 hours from this location.
        </p>
      ) : (
        <div className="flex flex-col gap-1.5">
          {passes.map((p, i) => {
            const open = i === openIdx;
            return (
              <div
                key={p.startUtc}
                className="overflow-hidden rounded-md border border-[color:var(--color-space-line)] bg-[color:var(--color-space-deep)]"
              >
                <button
                  onClick={() => setOpenIdx(open ? -1 : i)}
                  className="flex w-full items-center justify-between px-2.5 py-2 text-left"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className="size-2 rounded-full"
                      style={{ background: QUALITY_COLOR[p.visibilityQuality] }}
                    />
                    <span className="text-sm text-[color:var(--color-ink)]">
                      {fmtDay(p.startUtc)} {fmtTime(p.startUtc)}
                    </span>
                    {p.visible && (
                      <span className="rounded-full bg-[color:var(--color-aurora)]/15 px-1.5 py-0.5 text-[0.55rem] font-semibold uppercase text-[color:var(--color-aurora)]">
                        visible
                      </span>
                    )}
                  </span>
                  <span className="mono text-xs text-[color:var(--color-zenith)]">
                    {p.maxElevationDeg.toFixed(0)}°
                  </span>
                </button>

                {open && (
                  <div className="border-t border-[color:var(--color-space-line)] px-2.5 py-2">
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <Mini label="Max elev" value={`${p.maxElevationDeg.toFixed(0)}°`} />
                      <Mini label="Duration" value={fmtDur(p.durationSec)} />
                      <Mini
                        label="Direction"
                        value={`${azToCompass(p.startAzimuthDeg)}→${azToCompass(p.endAzimuthDeg)}`}
                      />
                      <Mini label="Rise" value={fmtTime(p.startUtc)} />
                      <Mini label="Peak" value={fmtTime(p.peakUtc)} />
                      <Mini label="Set" value={fmtTime(p.endUtc)} />
                    </div>
                    <div className="mt-2">
                      <ResponsiveContainer width="99%" height={80}>
                        <AreaChart
                          data={p.samples.map((s) => ({
                            t: s.t,
                            el: Math.max(0, s.elevationDeg),
                          }))}
                          margin={{ top: 4, right: 4, bottom: 0, left: -28 }}
                        >
                          <defs>
                            <linearGradient id="passFill" x1="0" y1="0" x2="0" y2="1">
                              <stop
                                offset="0%"
                                stopColor={QUALITY_COLOR[p.visibilityQuality]}
                                stopOpacity={0.5}
                              />
                              <stop
                                offset="100%"
                                stopColor={QUALITY_COLOR[p.visibilityQuality]}
                                stopOpacity={0.04}
                              />
                            </linearGradient>
                          </defs>
                          <XAxis dataKey="t" hide />
                          <YAxis
                            domain={[0, 90]}
                            tick={{ fontSize: 9, fill: "var(--color-ink-faint)" }}
                            tickCount={4}
                          />
                          <Tooltip
                            contentStyle={{
                              background: "var(--color-space-panel)",
                              border: "1px solid var(--color-space-edge)",
                              borderRadius: 8,
                              fontSize: 11,
                            }}
                            labelFormatter={(v) => fmtTime(Number(v))}
                            formatter={(v) => [`${Number(v).toFixed(0)}°`, "elev"]}
                          />
                          <Area
                            type="monotone"
                            dataKey="el"
                            stroke={QUALITY_COLOR[p.visibilityQuality]}
                            strokeWidth={1.5}
                            fill="url(#passFill)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                    <button
                      onClick={() => downloadIcs(p, selectedId)}
                      className={cn(
                        "mt-2 w-full rounded-md border border-[color:var(--color-space-line)] py-1.5 text-xs text-[color:var(--color-ink-dim)]",
                        "transition-colors hover:border-[color:var(--color-zenith)]/40 hover:text-[color:var(--color-ink)]",
                      )}
                    >
                      Add to calendar (.ics)
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Panel>
  );
}

function Mini({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[0.55rem] uppercase tracking-wider text-[color:var(--color-ink-faint)]">
        {label}
      </div>
      <div className="mono text-[color:var(--color-ink)]">{value}</div>
    </div>
  );
}

function downloadIcs(p: SatPass, noradId: number) {
  const dt = (ms: number) =>
    new Date(ms).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Project Zenith//Pass//EN",
    "BEGIN:VEVENT",
    `UID:zenith-${noradId}-${p.startUtc}@projectzenith`,
    `DTSTAMP:${dt(Date.now())}`,
    `DTSTART:${dt(p.startUtc)}`,
    `DTEND:${dt(p.endUtc)}`,
    `SUMMARY:Satellite pass (NORAD ${noradId}) — max ${p.maxElevationDeg.toFixed(0)}°`,
    `DESCRIPTION:Max elevation ${p.maxElevationDeg.toFixed(0)}°, ${p.visibilityQuality} pass${p.visible ? " (visible)" : ""}.`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  const blob = new Blob([ics], { type: "text/calendar" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `zenith-pass-${noradId}.ics`;
  a.click();
  URL.revokeObjectURL(url);
}
