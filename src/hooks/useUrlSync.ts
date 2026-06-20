"use client";

import { useEffect, useRef } from "react";
import { useStore } from "@/store/useStore";
import { parseObserveParams, buildObserveQuery } from "@/lib/url-state";

/**
 * Two-way sync between the URL and the observatory state, enabling shareable
 * links like /observe?lat=13.08&lon=80.27&sat=25544. Reads params on mount,
 * then keeps the query string updated (replaceState) as the user explores.
 */
export function useUrlSync() {
  const hydrated = useRef(false);

  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const params = parseObserveParams(window.location.search);
    const { setLocation, selectObject } = useStore.getState();
    if (params.lat !== undefined && params.lon !== undefined) {
      setLocation({
        lat: params.lat,
        lon: params.lon,
        alt: 0,
        label: params.label ?? "Shared coordinate",
      });
    }
    if (params.sat !== undefined) selectObject(params.sat);
  }, []);

  useEffect(() => {
    let raf = 0;
    const write = () => {
      const { location, selectedNoradId } = useStore.getState();
      const q = buildObserveQuery(location, selectedNoradId);
      const url = `${window.location.pathname}?${q}`;
      window.history.replaceState(null, "", url);
    };
    // Reflect the initial state (defaults or hydrated params) in the URL.
    write();
    const unsub = useStore.subscribe((s, prev) => {
      if (
        s.location !== prev.location ||
        s.selectedNoradId !== prev.selectedNoradId
      ) {
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(write);
      }
    });
    return () => {
      cancelAnimationFrame(raf);
      unsub();
    };
  }, []);
}
