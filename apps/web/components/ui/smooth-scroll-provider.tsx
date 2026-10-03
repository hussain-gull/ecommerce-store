"use client";

import { ReactLenis } from "lenis/react";
import type { ReactNode } from "react";

export { useLenis } from "lenis/react";

const LENIS_OPTIONS = {
  // touchMultiplier: 2 → intentional override (default is 1); improves mobile feel
  touchMultiplier: 2,
  // anchors: true → without this Lenis blocks <a href="#section"> clicks during scroll
  anchors: true,
  // stopInertiaOnNavigate: true → stops scroll momentum on Next.js route changes
  stopInertiaOnNavigate: true,
  // autoToggle: true → pauses Lenis automatically when overflow:hidden is applied
  // (e.g. when a modal is open); requires lenis.css which is imported in globals.css
  autoToggle: true,
  // allowNestedScroll: true → inner overflow containers (shop sidebar) scroll
  // natively and hand the wheel back to the page once they hit an edge
  allowNestedScroll: true,
} as const;

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  return (
    <ReactLenis root options={LENIS_OPTIONS}>
      {children}
    </ReactLenis>
  );
}
