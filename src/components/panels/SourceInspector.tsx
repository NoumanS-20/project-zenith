"use client";

import { Panel, StatusDot } from "@/components/ui/primitives";
import { useHealth } from "@/hooks/useHealth";

function fmtInterval(sec?: number) {
  if (!sec) return "—";
  if (sec >= 3600) return `${(sec / 3600).toFixed(0)}h`;
  if (sec >= 60) return `${(sec / 60).toFixed(0)}m`;
  return `${sec}s`;
}

/** Technical panel: which APIs are active, refresh cadence, fallback status. */
export function SourceInspector() {
  const { data } = useHealth();
  const sources = data?.sources ?? [];

  return (
    <Panel
      title="Source Inspector"
      action={
        <span className="text-[0.62rem] text-[color:var(--color-ink-faint)]">
          {sources.length} sources
        </span>
      }
    >
      <ul className="flex flex-col gap-1.5">
        {sources.map((s) => (
          <li
            key={s.id}
            className="flex items-center justify-between gap-2 rounded-md border border-[color:var(--color-space-line)] bg-[color:var(--color-space-deep)] px-2.5 py-1.5"
          >
            <span className="flex min-w-0 items-center gap-2">
              <StatusDot status={s.status} />
              <span className="min-w-0">
                <span className="block truncate text-sm text-[color:var(--color-ink)]">
                  {s.label}
                </span>
                <span className="block truncate text-[0.62rem] text-[color:var(--color-ink-faint)]">
                  {s.detail}
                </span>
              </span>
            </span>
            <span className="mono shrink-0 text-[0.62rem] text-[color:var(--color-ink-dim)]">
              {fmtInterval(s.updateIntervalSec)}
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[0.6rem] leading-relaxed text-[color:var(--color-ink-faint)]">
        Positions: client-side SGP4 · CelesTrak cached 2h · keys proxied
        server-side, never exposed to the browser.
      </p>
    </Panel>
  );
}
