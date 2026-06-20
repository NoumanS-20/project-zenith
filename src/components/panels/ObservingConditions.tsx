"use client";

import { Panel, Stat, ConfidenceBadge } from "@/components/ui/primitives";
import { useWeather } from "@/hooks/useWeather";

/** Current observing conditions (cloud / visibility) for the observer site. */
export function ObservingConditions() {
  const { data, isLoading } = useWeather();
  return (
    <Panel
      title="Observing Conditions"
      action={data ? <ConfidenceBadge value={data.provenance.confidence} /> : undefined}
    >
      {isLoading || !data ? (
        <p className="py-2 text-xs text-[color:var(--color-ink-faint)]">Loading…</p>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-x-3 gap-y-2.5">
            <Stat label="Cloud cover" value={`${data.cloudCoverPct.toFixed(0)}%`} />
            <Stat
              label="Visibility"
              value={data.visibilityKm !== undefined ? data.visibilityKm.toFixed(0) : "—"}
              unit={data.visibilityKm !== undefined ? "km" : undefined}
            />
          </div>
          <div className="mt-2 text-xs capitalize text-[color:var(--color-ink-dim)]">
            {data.description}
          </div>
        </>
      )}
    </Panel>
  );
}
