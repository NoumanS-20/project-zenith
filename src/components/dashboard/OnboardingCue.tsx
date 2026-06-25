"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";

/** First-run cue. Shows once until the user dismisses it or moves the observer
 *  for the first time. Dismissal persists via the store (localStorage). */
export function OnboardingCue() {
  const dismissed = useStore((s) => s.onboardingDismissed);
  const dismiss = useStore((s) => s.dismissOnboarding);
  const location = useStore((s) => s.location);

  // Auto-dismiss the first time the observer location changes after mount.
  const firstLocation = useRef(location);
  useEffect(() => {
    if (location !== firstLocation.current) dismiss();
  }, [location, dismiss]);

  if (dismissed) return null;

  return (
    <div className="reveal pointer-events-auto absolute left-1/2 top-20 z-20 -translate-x-1/2">
      <button
        onClick={dismiss}
        className="press flex items-center gap-2 rounded-full border border-[color:var(--color-zenith)]/40 bg-[color:var(--color-space-panel)]/90 px-4 py-2 text-sm text-[color:var(--color-ink)] backdrop-blur"
      >
        <span className="size-1.5 animate-pulse rounded-full bg-[color:var(--color-zenith)]" />
        Click anywhere to set your observatory
        <span className="text-[color:var(--color-ink-faint)]">×</span>
      </button>
    </div>
  );
}
