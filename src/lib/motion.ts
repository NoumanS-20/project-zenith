/** Shared motion tokens. Mirror the CSS vars in globals.css so JS-driven
 *  (framer-motion / inline style) motion matches CSS-driven motion. */
export const EASE_OUT = "cubic-bezier(0.23, 1, 0.32, 1)";
export const EASE_IN_OUT = "cubic-bezier(0.77, 0, 0.175, 1)";
export const EASE_DRAWER = "cubic-bezier(0.32, 0.72, 0, 1)";

/** Durations in milliseconds. Exit is intentionally faster than enter. */
export const DUR = { press: 140, enter: 220, exit: 160, dock: 250 } as const;
