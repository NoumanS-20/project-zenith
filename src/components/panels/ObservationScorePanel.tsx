"use client";

import { Panel } from "@/components/ui/primitives";
import { useObservation } from "@/hooks/useObservation";
import { cn } from "@/lib/cn";

const GRADE_COLOR: Record<string, string> = {
  Excellent: "var(--color-aurora)",
  Good: "var(--color-zenith)",
  Fair: "var(--color-solar)",
  Poor: "var(--color-flare)",
};

export function ObservationScorePanel() {
  const obs = useObservation();
  const color = GRADE_COLOR[obs.grade];
  const pct = obs.score;

  return (
    <Panel title="Observation Score">
      <div className="flex items-center gap-3">
        <div className="relative grid size-16 shrink-0 place-items-center">
          <svg viewBox="0 0 36 36" className="size-16 -rotate-90">
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke="var(--color-space-line)"
              strokeWidth="3"
            />
            <circle
              cx="18"
              cy="18"
              r="15.5"
              fill="none"
              stroke={color}
              strokeWidth="3"
              strokeLinecap="round"
              strokeDasharray={`${(pct / 100) * 97.4} 97.4`}
            />
          </svg>
          <span className="absolute mono text-lg font-bold" style={{ color }}>
            {pct}
          </span>
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold" style={{ color }}>
            {obs.grade}
          </div>
          <p className="text-xs leading-relaxed text-[color:var(--color-ink-dim)]">
            {obs.summary}
          </p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1.5 border-t border-[color:var(--color-space-line)] pt-2 text-xs">
        <Factor label="Sky" value={cap(obs.twilight)} />
        <Factor
          label="Cloud"
          value={
            obs.factors.cloudCover !== undefined
              ? `${obs.factors.cloudCover.toFixed(0)}%`
              : "n/a"
          }
        />
        <Factor label="Moon" value={obs.moonPhase} />
        <Factor
          label="Best pass"
          value={`${obs.factors.bestElevationDeg.toFixed(0)}°`}
        />
      </div>
      <div className="mt-1.5 text-[0.6rem] text-[color:var(--color-ink-faint)]">
        Cloud: {obs.cloudSource}
      </div>
    </Panel>
  );
}

function Factor({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[color:var(--color-ink-faint)]">{label}</span>
      <span className={cn("mono text-[color:var(--color-ink)]")}>{value}</span>
    </div>
  );
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
