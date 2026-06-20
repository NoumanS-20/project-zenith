"use client";

import { globe } from "@/lib/globeControls";
import { useStore } from "@/store/useStore";
import { cn } from "@/lib/cn";

function CtrlButton({
  label,
  onClick,
  children,
  className,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <button
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "grid size-9 place-items-center rounded-lg border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/85 text-[color:var(--color-ink-dim)] backdrop-blur transition-colors hover:border-[color:var(--color-zenith)]/50 hover:text-[color:var(--color-ink)] active:scale-95",
        className,
      )}
    >
      {children}
    </button>
  );
}

/** Google-Earth-style navigation cluster, bottom-right of the globe. */
export function NavControls() {
  const heading = useStore((s) => s.cameraHeadingDeg);
  const sceneMode = useStore((s) => s.sceneMode);

  return (
    <div className="pointer-events-auto flex flex-col items-center gap-2">
      {/* Compass — click to reset north; rotates with camera heading */}
      <button
        aria-label="Reset north"
        title="Reset north"
        onClick={() => globe.resetNorth()}
        className="group relative grid size-11 place-items-center rounded-full border border-[color:var(--color-space-edge)] bg-[color:var(--color-space-panel)]/85 backdrop-blur transition-colors hover:border-[color:var(--color-zenith)]/50 active:scale-95"
      >
        <span
          className="relative block size-7"
          style={{ transform: `rotate(${-heading}deg)` }}
        >
          <span className="absolute left-1/2 top-0 -translate-x-1/2 text-[0.6rem] font-bold text-[color:var(--color-flare)]">
            N
          </span>
          <svg viewBox="0 0 24 24" className="size-7" fill="none">
            <path d="M12 3 L15 12 L12 11 L9 12 Z" fill="var(--color-flare)" />
            <path d="M12 21 L9 12 L12 13 L15 12 Z" fill="var(--color-ink-faint)" />
          </svg>
        </span>
      </button>

      <div className="flex flex-col overflow-hidden rounded-lg border border-[color:var(--color-space-edge)]">
        <button
          aria-label="Zoom in"
          title="Zoom in"
          onClick={() => globe.zoomIn()}
          className="grid size-9 place-items-center bg-[color:var(--color-space-panel)]/85 text-lg text-[color:var(--color-ink-dim)] backdrop-blur transition-colors hover:text-[color:var(--color-ink)] active:scale-95"
        >
          +
        </button>
        <span className="h-px bg-[color:var(--color-space-edge)]" />
        <button
          aria-label="Zoom out"
          title="Zoom out"
          onClick={() => globe.zoomOut()}
          className="grid size-9 place-items-center bg-[color:var(--color-space-panel)]/85 text-lg text-[color:var(--color-ink-dim)] backdrop-blur transition-colors hover:text-[color:var(--color-ink)] active:scale-95"
        >
          −
        </button>
      </div>

      <CtrlButton label="Tilt view" onClick={() => globe.tiltToggle()}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 17 L12 7 L21 17" />
          <ellipse cx="12" cy="18" rx="9" ry="2.5" />
        </svg>
      </CtrlButton>

      <CtrlButton
        label={sceneMode === "3d" ? "Switch to 2D" : "Switch to 3D"}
        onClick={() => globe.toggle2D3D()}
        className="text-[0.62rem] font-bold tracking-tight"
      >
        {sceneMode === "3d" ? "2D" : "3D"}
      </CtrlButton>

      <CtrlButton label="Fly to observer" onClick={() => globe.flyHome()}>
        <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
          <path d="M3 11 L12 4 L21 11" />
          <path d="M6 10 V19 H18 V10" />
        </svg>
      </CtrlButton>
    </div>
  );
}
