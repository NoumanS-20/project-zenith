import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/** Wraps children in the CSS reveal (fade + rise). Honors reduced motion via
 *  the global utility rules. Use for panels/cards that mount on interaction. */
export function Reveal({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cn("reveal", className)}>{children}</div>;
}
