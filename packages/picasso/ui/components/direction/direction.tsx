// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import {
  DirectionProvider as RadixDirectionProvider,
  useDirection as useRadixDirection,
} from "@radix-ui/react-direction";

/**
 * Direction — tells every component which way the page reads.
 *
 * Figma: none. Direction is not a component in the library; it is a property
 * of the page a design is drawn on.
 *
 * ⚠️ `dir="rtl"` on `<html>` is necessary and not sufficient. CSS reads the
 * attribute — logical properties, `.rtl-mirror`, the `rtl:` variant — but
 * Radix does not look at the DOM. It reads direction from this provider, and
 * without it the arrow keys in Tabs, Radio group, Slider and every menu stay
 * left-to-right, and a submenu opens on the wrong side. Set both, once, at
 * the root:
 *
 *   <html lang="ar" dir="rtl">
 *     <DirectionProvider direction="rtl">…</DirectionProvider>
 *
 * The prop is `direction`, as shadcn names it, so code moved across reads the
 * same. Radix's own provider calls it `dir`.
 *
 * `useDirection()` is for the few components that do their own geometry —
 * Threshold slider's pointer maths, Toast's swipe, Calendar's grid. A
 * component that only needs to look right should use a logical class and not
 * ask.
 */
export type Direction = "ltr" | "rtl";

export interface DirectionProviderProps {
  /** Which way the page reads. Match the `dir` attribute on `<html>`. */
  direction: Direction;
  children?: React.ReactNode;
}

export function DirectionProvider({
  direction,
  children,
}: DirectionProviderProps) {
  return (
    <RadixDirectionProvider dir={direction}>{children}</RadixDirectionProvider>
  );
}

/**
 * The direction from the nearest provider; `ltr` when there is none.
 * Pass a component's own `dir` prop to let it win, as Radix does.
 */
export function useDirection(local?: Direction): Direction {
  return useRadixDirection(local);
}
