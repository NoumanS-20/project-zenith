"use client";

import { Panel } from "@/components/ui/primitives";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/cn";

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      onClick={onChange}
      className="flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm text-[color:var(--color-ink-dim)] transition-colors hover:bg-[color:var(--color-space-panel-2)]"
    >
      <span>{label}</span>
      <span
        className={cn(
          "relative h-4 w-7 rounded-full transition-colors",
          checked
            ? "bg-[color:var(--color-zenith)]"
            : "bg-[color:var(--color-space-line)]",
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 size-3 rounded-full bg-white transition-all",
            checked ? "left-3.5" : "left-0.5",
          )}
        />
      </span>
    </button>
  );
}

export function SettingsPanel() {
  const reducedMotion = useStore((s) => s.reducedMotion);
  const setReducedMotion = useStore((s) => s.setReducedMotion);
  const presentationMode = useStore((s) => s.presentationMode);
  const togglePresentation = useStore((s) => s.togglePresentation);

  return (
    <Panel title="Settings">
      <div className="flex flex-col gap-0.5">
        <Toggle
          label="Reduced motion"
          checked={reducedMotion}
          onChange={() => setReducedMotion(!reducedMotion)}
        />
        <Toggle
          label="Presentation mode"
          checked={presentationMode}
          onChange={togglePresentation}
        />
      </div>
      <p className="mt-2 border-t border-[color:var(--color-space-line)] pt-2 text-[0.6rem] leading-relaxed text-[color:var(--color-ink-faint)]">
        Project Zenith · Team IDSCC · data labelled live / predicted / cached /
        fallback. Keys proxied server-side.
      </p>
    </Panel>
  );
}
