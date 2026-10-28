# Animated icons — drop-in integration guide

This is the animated-icon system from the Clarion widget: any [Lucide](https://lucide.dev) icon wrapped in a shared **"press"** micro-interaction (a quick scale-down-and-back), triggered on hover. It's ~2 files, MIT-friendly, and doesn't require our repo — copy the code below into your own project.

## 1. Install dependencies

```bash
npm install motion lucide-react
```

- **`motion`** ≥ 12 — the animation runtime (imported from `motion/react`; the successor to Framer Motion).
- **`lucide-react`** — the icon paths.

You also need a `cn()` class-merge helper. If you already use shadcn/ui you have `@/lib/utils`. If not, either install one:

```bash
npm install clsx tailwind-merge
```

```ts
// lib/utils.ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export const cn = (...i: ClassValue[]) => twMerge(clsx(i));
```

…or just replace every `cn(a, b)` in the file below with a plain template string — the helper is only used for className merging.

## 2. Copy this one file

`components/icons/MotionIcon.tsx`

```tsx
"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils"; // or your own class-merge helper

export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

export interface AnimatedIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

// The shared "press" micro-interaction: a quick scale down and back.
// Change these values once and every icon updates.
const PRESS: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [1, 0.84, 1],
    transition: { duration: 0.26, ease: "easeOut" },
  },
};

export function makeMotionIcon(Icon: LucideIcon) {
  const Component = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
    ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
      const controls = useAnimation();
      const isControlledRef = useRef(false);

      // If a parent grabs the ref, hover on the icon itself is disabled and the
      // parent drives it via startAnimation()/stopAnimation() instead.
      useImperativeHandle(ref, () => {
        isControlledRef.current = true;
        return {
          startAnimation: () => controls.start("animate"),
          stopAnimation: () => controls.start("normal"),
        };
      });

      const handleMouseEnter = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
          if (isControlledRef.current) onMouseEnter?.(e);
          else controls.start("animate");
        },
        [controls, onMouseEnter]
      );

      const handleMouseLeave = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
          if (isControlledRef.current) onMouseLeave?.(e);
          else controls.start("normal");
        },
        [controls, onMouseLeave]
      );

      return (
        <div
          className={cn("inline-flex", className)}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          {...props}
        >
          <motion.span
            animate={controls}
            initial="normal"
            variants={PRESS}
            style={{ display: "inline-flex", transformOrigin: "center" }}
          >
            <Icon size={size} />
          </motion.span>
        </div>
      );
    }
  );
  Component.displayName = `Motion(${Icon.displayName ?? "Icon"})`;
  return Component;
}
```

## 3. Use it

### A. Self-contained (animates on its own hover)

The simplest case — wrap a Lucide icon and drop it in. It presses whenever *the icon* is hovered.

```tsx
import { Wifi } from "lucide-react";
import { makeMotionIcon } from "@/components/icons/MotionIcon";

const WifiIcon = makeMotionIcon(Wifi);

export function Example() {
  return <WifiIcon size={16} className="text-slate-600" />;
}
```

### B. Controlled (animate when a *parent row* is hovered)

Grab a ref and call `startAnimation()` / `stopAnimation()` from the row's hover handlers — this is how the Clarion list rows do it, so the whole row is the hit target, not just the 16px icon.

```tsx
import { useRef } from "react";
import { HardDrive } from "lucide-react";
import { makeMotionIcon, type AnimatedIconHandle } from "@/components/icons/MotionIcon";

const DiskIcon = makeMotionIcon(HardDrive);

export function Row() {
  const icon = useRef<AnimatedIconHandle>(null);
  return (
    <div
      onMouseEnter={() => icon.current?.startAnimation()}
      onMouseLeave={() => icon.current?.stopAnimation()}
      className="flex items-center gap-3 p-3"
    >
      <DiskIcon ref={icon} size={16} />
      <span>Disk</span>
    </div>
  );
}
```

## 4. Optional: a lookup map

If you have many icons keyed by a domain id, build one map (as Clarion does):

```tsx
import { Wifi, Headphones, Cpu, HardDrive } from "lucide-react";
import { makeMotionIcon, type AnimatedIconHandle, type AnimatedIconProps } from "@/components/icons/MotionIcon";

type AnimatedIcon = React.ForwardRefExoticComponent<
  AnimatedIconProps & React.RefAttributes<AnimatedIconHandle>
>;

export const icons: Record<string, AnimatedIcon> = {
  wifi: makeMotionIcon(Wifi),
  headphones: makeMotionIcon(Headphones),
  cpu: makeMotionIcon(Cpu),
  disk: makeMotionIcon(HardDrive),
};

// const Icon = icons[id]; <Icon ref={ref} size={16} />
```

## 5. Change the animation

Everything shares the one `PRESS` variant. To retune the whole set, edit those numbers:

```tsx
const PRESS: Variants = {
  normal: { scale: 1 },
  animate: { scale: [1, 0.84, 1], transition: { duration: 0.26, ease: "easeOut" } },
};
```

Want per-icon animations instead of one shared press? Give each icon its own `<motion.path>` variants rather than wrapping the whole glyph — or pull ready-made ones from [lucide-animated.com](https://lucide-animated.com) (they expose the same `startAnimation/stopAnimation` handle, so they slot into the map above unchanged).

## Notes

- **Accessibility:** wrap in a button / add `aria-hidden` on decorative icons as appropriate; respect `prefers-reduced-motion` if you ship this widely (guard the `controls.start(...)` calls).
- **SSR / Next.js:** the `"use client"` directive at the top handles the app router.
