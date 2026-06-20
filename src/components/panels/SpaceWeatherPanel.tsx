"use client";

import { Panel, ConfidenceBadge } from "@/components/ui/primitives";
import { useSpaceWeather } from "@/hooks/useSpaceWeather";
import type { SpaceWeatherEvent } from "@/lib/types";

const KIND_META: Record<
  SpaceWeatherEvent["kind"],
  { label: string; color: string; icon: string }
> = {
  flare: { label: "Flare", color: "var(--color-solar)", icon: "✦" },
  cme: { label: "CME", color: "var(--color-plasma)", icon: "◐" },
  geostorm: { label: "Storm", color: "var(--color-flare)", icon: "⚡" },
  other: { label: "Event", color: "var(--color-ink-faint)", icon: "•" },
};

const AURORA_COLOR = {
  low: "var(--color-ink-faint)",
  moderate: "var(--color-solar)",
  high: "var(--color-aurora)",
} as const;

function fmt(ms: number) {
  return new Date(ms).toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function SpaceWeatherPanel() {
  const { data, isLoading } = useSpaceWeather();

  return (
    <Panel
      title="Space Weather"
      action={data ? <ConfidenceBadge value={data.provenance.confidence} /> : undefined}
    >
      {isLoading || !data ? (
        <p className="py-2 text-xs text-[color:var(--color-ink-faint)]">
          Loading NASA DONKI…
        </p>
      ) : (
        <>
          <div className="mb-2 flex items-center gap-3">
            <div>
              <div className="text-[0.6rem] uppercase tracking-wider text-[color:var(--color-ink-faint)]">
                Aurora
              </div>
              <div
                className="text-sm font-semibold capitalize"
                style={{ color: AURORA_COLOR[data.auroraLikelihood] }}
              >
                {data.auroraLikelihood}
              </div>
            </div>
            {data.kpIndex !== undefined && (
              <div>
                <div className="text-[0.6rem] uppercase tracking-wider text-[color:var(--color-ink-faint)]">
                  Max Kp
                </div>
                <div className="mono text-sm text-[color:var(--color-ink)]">
                  {data.kpIndex}
                </div>
              </div>
            )}
          </div>

          <p className="rounded-md border border-[color:var(--color-space-line)] bg-[color:var(--color-space-deep)] px-2.5 py-2 text-xs leading-relaxed text-[color:var(--color-ink-dim)]">
            {data.observingImpact}
          </p>

          <div className="mt-2 flex flex-col gap-1">
            {data.events.length === 0 ? (
              <p className="py-1 text-xs text-[color:var(--color-ink-faint)]">
                No flares, CMEs, or storms in the last 7 days.
              </p>
            ) : (
              data.events.slice(0, 6).map((e) => {
                const m = KIND_META[e.kind];
                return (
                  <div
                    key={e.id}
                    className="flex items-center justify-between gap-2 rounded-md px-1.5 py-1"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span style={{ color: m.color }}>{m.icon}</span>
                      <span className="truncate text-xs text-[color:var(--color-ink)]">
                        {e.note}
                        {e.intensity ? ` · ${e.intensity}` : ""}
                      </span>
                    </span>
                    <span className="mono shrink-0 text-[0.6rem] text-[color:var(--color-ink-faint)]">
                      {fmt(e.time)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
          <div className="mt-1.5 text-[0.6rem] text-[color:var(--color-ink-faint)]">
            Source: {data.provenance.source}
          </div>
        </>
      )}
    </Panel>
  );
}
