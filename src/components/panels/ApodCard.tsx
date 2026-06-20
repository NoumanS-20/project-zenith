"use client";

/* eslint-disable @next/next/no-img-element */
import { Panel } from "@/components/ui/primitives";
import { useApod } from "@/hooks/useApod";

/** NASA Astronomy Picture of the Day — a polish card. */
export function ApodCard() {
  const { data, isLoading } = useApod();

  return (
    <Panel title="Astronomy Picture of the Day">
      {isLoading ? (
        <p className="py-2 text-xs text-[color:var(--color-ink-faint)]">Loading APOD…</p>
      ) : !data ? (
        <p className="py-2 text-xs text-[color:var(--color-ink-faint)]">
          APOD temporarily unavailable.
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {data.mediaType === "image" ? (
            <img
              src={data.url}
              alt={data.title}
              loading="lazy"
              className="aspect-video w-full rounded-md object-cover"
            />
          ) : (
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md border border-[color:var(--color-space-line)] px-2.5 py-2 text-xs text-[color:var(--color-zenith)]"
            >
              View today&apos;s media ↗
            </a>
          )}
          <div>
            <div className="text-sm font-semibold text-[color:var(--color-ink)]">
              {data.title}
            </div>
            <div className="text-[0.6rem] text-[color:var(--color-ink-faint)]">
              {data.date}
              {data.copyright ? ` · © ${data.copyright}` : ""}
            </div>
          </div>
          <p className="line-clamp-4 text-xs leading-relaxed text-[color:var(--color-ink-dim)]">
            {data.explanation}
          </p>
        </div>
      )}
    </Panel>
  );
}
