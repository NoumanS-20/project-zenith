"use client";

import { useMemo } from "react";
import { Panel } from "@/components/ui/primitives";
import { useStore } from "@/store/useStore";
import { usePasses } from "@/hooks/usePasses";
import { skyBodies, sunAltitude, twilightPhase } from "@/lib/astro/sky";
import type { SkyBody } from "@/lib/types";

const R = 108;
const C = 120;

const BODY_COLOR: Record<string, string> = {
  Sun: "var(--color-solar)",
  Moon: "#cdd6e6",
  Mercury: "#b9a98f",
  Venus: "#f3e6b0",
  Mars: "#ff7a59",
  Jupiter: "#e8c79a",
  Saturn: "#e6d9a6",
};

/** Project az/el (degrees) onto the polar sky disc (zenith centre, horizon edge). */
function project(azDeg: number, elDeg: number) {
  const r = ((90 - Math.max(0, elDeg)) / 90) * R;
  const a = (azDeg * Math.PI) / 180;
  return { x: C + r * Math.sin(a), y: C - r * Math.cos(a) };
}

export function SkyMap() {
  const location = useStore((s) => s.location);
  const time = useStore((s) => s.time);
  const satStates = useStore((s) => s.satStates);
  const selectedId = useStore((s) => s.selectedNoradId);
  const passes = usePasses();

  const epoch = time.kind === "fixed" ? time.epochMs : Date.now();
  const bucket = time.kind === "fixed" ? time.epochMs : Math.floor(epoch / 30_000);

  const { bodies, sunAlt } = useMemo(() => {
    const date = new Date(epoch);
    return {
      bodies: skyBodies(location, date),
      sunAlt: sunAltitude(location, date),
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.lat, location.lon, bucket]);

  const phase = twilightPhase(sunAlt);
  const skyFill =
    phase === "day"
      ? "rgba(56,140,255,0.18)"
      : phase === "civil"
        ? "rgba(80,90,180,0.16)"
        : "rgba(10,18,40,0.5)";

  const selected = satStates.find((s) => s.noradId === selectedId);
  const pass = passes.find((p) => p.visible) ?? passes[0];
  const arc = pass
    ? pass.samples
        .filter((s) => s.elevationDeg > 0)
        .map((s) => project(s.azimuthDeg, s.elevationDeg))
    : [];

  return (
    <Panel
      title="Sky Map"
      action={
        <span className="text-[0.62rem] capitalize text-[color:var(--color-ink-faint)]">
          {phase === "day" ? "daylight" : phase}
        </span>
      }
    >
      <svg viewBox="0 0 240 240" className="mx-auto block w-full max-w-[280px]">
        <defs>
          <radialGradient id="skyGrad" cx="50%" cy="42%" r="60%">
            <stop offset="0%" stopColor={skyFill} />
            <stop offset="100%" stopColor="rgba(4,6,13,0.85)" />
          </radialGradient>
        </defs>

        {/* Sky disc + elevation rings */}
        <circle cx={C} cy={C} r={R} fill="url(#skyGrad)" stroke="var(--color-space-edge)" />
        <circle cx={C} cy={C} r={(R * 2) / 3} fill="none" stroke="var(--color-space-line)" strokeDasharray="2 4" />
        <circle cx={C} cy={C} r={R / 3} fill="none" stroke="var(--color-space-line)" strokeDasharray="2 4" />
        <line x1={C} y1={C - R} x2={C} y2={C + R} stroke="var(--color-space-line)" strokeWidth="0.5" />
        <line x1={C - R} y1={C} x2={C + R} y2={C} stroke="var(--color-space-line)" strokeWidth="0.5" />

        {/* Cardinal labels */}
        {[
          ["N", C, C - R - 4],
          ["E", C + R + 5, C + 1],
          ["S", C, C + R + 11],
          ["W", C - R - 9, C + 1],
        ].map(([t, x, y]) => (
          <text key={t as string} x={x as number} y={y as number} textAnchor="middle" className="fill-[color:var(--color-ink-faint)]" fontSize="9" fontWeight="700">
            {t}
          </text>
        ))}

        {/* Selected satellite pass arc */}
        {arc.length > 1 && (
          <polyline
            points={arc.map((p) => `${p.x},${p.y}`).join(" ")}
            fill="none"
            stroke="var(--color-solar)"
            strokeWidth="1.5"
            strokeDasharray="3 2"
            opacity="0.85"
          />
        )}

        {/* Celestial bodies above the horizon */}
        {bodies
          .filter((b) => b.aboveHorizon)
          .map((b) => {
            const p = project(b.azimuthDeg, b.elevationDeg);
            const color = BODY_COLOR[b.name] ?? "#cdd6e6";
            const size = b.kind === "sun" ? 5 : b.kind === "moon" ? 4.5 : 3;
            return (
              <g key={b.name}>
                <circle cx={p.x} cy={p.y} r={size} fill={color} stroke="rgba(0,0,0,0.4)" strokeWidth="0.5">
                  {b.kind === "sun" && <animate attributeName="opacity" values="1;0.7;1" dur="3s" repeatCount="indefinite" />}
                </circle>
                <text x={p.x + size + 2} y={p.y + 3} fontSize="7.5" className="fill-[color:var(--color-ink-dim)]">
                  {b.name}
                </text>
              </g>
            );
          })}

        {/* Current selected satellite position */}
        {selected && (selected.elevationDeg ?? -1) > 0 && (
          <g>
            <circle
              {...projectXY(selected.azimuthDeg ?? 0, selected.elevationDeg ?? 0)}
              r="3.5"
              fill="var(--color-zenith)"
              stroke="white"
              strokeWidth="1"
            />
          </g>
        )}
      </svg>

      <SkyLegend bodies={bodies} hasArc={arc.length > 1} hasSat={Boolean(selected && (selected.elevationDeg ?? -1) > 0)} />
    </Panel>
  );
}

function projectXY(az: number, el: number) {
  const p = project(az, el);
  return { cx: p.x, cy: p.y };
}

function SkyLegend({
  bodies,
  hasArc,
  hasSat,
}: {
  bodies: SkyBody[];
  hasArc: boolean;
  hasSat: boolean;
}) {
  const up = bodies.filter((b) => b.aboveHorizon).map((b) => b.name);
  return (
    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-[color:var(--color-space-line)] pt-2 text-[0.62rem] text-[color:var(--color-ink-faint)]">
      <span>Up now: {up.length ? up.join(", ") : "none"}</span>
      {hasSat && (
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-[color:var(--color-zenith)]" /> satellite
        </span>
      )}
      {hasArc && (
        <span className="flex items-center gap-1">
          <span className="h-px w-3 bg-[color:var(--color-solar)]" /> pass arc
        </span>
      )}
    </div>
  );
}
