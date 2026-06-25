"use client";

import { useEffect, useState } from "react";

/** True when the viewport is below the lg breakpoint (1024px) — i.e. the
 *  mobile/tablet bottom-sheet layout, not the desktop dock layout.
 *  SSR-safe: returns false on the server and on first client render, then
 *  syncs to the real match after mount (the desktop layout is the safe default
 *  — it never double-mounts; if anything the mobile stack mounts one frame late). */
export function useIsMobileLayout(): boolean {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 1023px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isMobile;
}
