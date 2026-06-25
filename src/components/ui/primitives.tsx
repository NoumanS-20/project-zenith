import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { Confidence } from "@/lib/types";

/** Glass panel surface with optional heading. */
export function Panel({
  title,
  action,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section className={cn("panel reveal flex flex-col", className)}>
      {title && (
        <header className="flex items-center justify-between gap-2 px-3.5 pt-3 pb-2">
          <h2 className="panel-heading">{title}</h2>
          {action}
        </header>
      )}
      <div className={cn("px-3.5 pb-3.5", title ? "pt-0" : "pt-3.5", bodyClassName)}>
        {children}
      </div>
    </section>
  );
}

const CONFIDENCE_STYLE: Record<Confidence, string> = {
  live: "bg-[color:var(--color-aurora)]/15 text-[color:var(--color-aurora)] ring-[color:var(--color-aurora)]/30",
  predicted:
    "bg-[color:var(--color-zenith)]/15 text-[color:var(--color-zenith)] ring-[color:var(--color-zenith)]/30",
  cached:
    "bg-[color:var(--color-solar)]/15 text-[color:var(--color-solar)] ring-[color:var(--color-solar)]/30",
  fallback:
    "bg-[color:var(--color-flare)]/15 text-[color:var(--color-flare)] ring-[color:var(--color-flare)]/30",
};

/** Confidence badge — distinguishes live / predicted / cached / fallback data. */
export function ConfidenceBadge({ value }: { value: Confidence }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[0.62rem] font-semibold uppercase tracking-wider ring-1",
        CONFIDENCE_STYLE[value],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" />
      {value}
    </span>
  );
}

export function StatusDot({
  status,
}: {
  status: "ok" | "degraded" | "fallback" | "down";
}) {
  const color =
    status === "ok"
      ? "var(--color-aurora)"
      : status === "degraded"
        ? "var(--color-solar)"
        : status === "fallback"
          ? "var(--color-zenith)"
          : "var(--color-flare)";
  return (
    <span
      className="inline-block size-2 rounded-full"
      style={{ background: color, boxShadow: `0 0 8px ${color}` }}
      aria-label={status}
    />
  );
}

/** Telemetry stat: small label over a mono value. */
export function Stat({
  label,
  value,
  unit,
  className,
}: {
  label: string;
  value: ReactNode;
  unit?: string;
  className?: string;
}) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <span className="text-[0.6rem] uppercase tracking-wider text-[color:var(--color-ink-faint)]">
        {label}
      </span>
      <span className="mono text-sm text-[color:var(--color-ink)]">
        {value}
        {unit && (
          <span className="ml-1 text-xs text-[color:var(--color-ink-dim)]">
            {unit}
          </span>
        )}
      </span>
    </div>
  );
}
