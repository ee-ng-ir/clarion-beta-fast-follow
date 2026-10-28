"use client";

import { motion, useAnimation, type Variants } from "motion/react";
import { forwardRef, useCallback, useImperativeHandle, useRef, type ReactNode } from "react";

import { cn } from "@/lib/utils";
import type { AnimatedIconHandle, AnimatedIconProps } from "./MotionIcon";

/**
 * Hand-crafted animated icons for the contact-centre glyphs that lucide-animated
 * doesn't ship (headphones, headset, camera, memory, disk, app window, dashboard,
 * monitor-play). Same Motion approach + `startAnimation` / `stopAnimation` handle
 * as the rest, so they drop into the icon maps identically — but each has a motion
 * tailored to what it represents (data pins blink, the lens slides in, etc.).
 */
type Controls = ReturnType<typeof useAnimation>;

function craft(name: string, render: (controls: Controls, size: number) => ReactNode) {
  const Component = forwardRef<AnimatedIconHandle, AnimatedIconProps>(
    ({ onMouseEnter, onMouseLeave, className, size = 28, ...props }, ref) => {
      const controls = useAnimation();
      const controlled = useRef(false);

      useImperativeHandle(ref, () => {
        controlled.current = true;
        return {
          startAnimation: () => controls.start("animate"),
          stopAnimation: () => controls.start("normal"),
        };
      });

      const enter = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
          if (controlled.current) onMouseEnter?.(e);
          else controls.start("animate");
        },
        [controls, onMouseEnter]
      );
      const leave = useCallback(
        (e: React.MouseEvent<HTMLDivElement>) => {
          if (controlled.current) onMouseLeave?.(e);
          else controls.start("normal");
        },
        [controls, onMouseLeave]
      );

      return (
        <div className={cn("inline-flex", className)} onMouseEnter={enter} onMouseLeave={leave} {...props}>
          {render(controls, size)}
        </div>
      );
    }
  );
  Component.displayName = name;
  return Component;
}

const svgAttrs = (size: number) => ({
  width: size,
  height: size,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  xmlns: "http://www.w3.org/2000/svg",
});

const centre = { transformBox: "fill-box" as const, transformOrigin: "center" as const };

// A whole-glyph "settle" bounce (headphones / headset).
const bounce: Variants = {
  normal: { y: 0, scale: 1 },
  animate: { y: [0, -1.5, 0], scale: [1, 1.06, 1], transition: { duration: 0.5, ease: "easeInOut" } },
};

// A staggered blink for "activity" marks (disk dots, memory pins).
const blink = (delay: number): Variants => ({
  normal: { opacity: 1 },
  animate: { opacity: [1, 0.15, 1], transition: { duration: 0.7, delay, ease: "easeInOut" } },
});

export const HeadphonesIcon = craft("HeadphonesIcon", (c, s) => (
  <svg {...svgAttrs(s)}>
    <motion.g animate={c} initial="normal" variants={bounce} style={centre}>
      <path d="M3 14h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H4a1 1 0 0 1-1-1v-4a9 9 0 0 1 18 0v4a1 1 0 0 1-1 1h-2a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
    </motion.g>
  </svg>
));

export const HeadsetIcon = craft("HeadsetIcon", (c, s) => (
  <svg {...svgAttrs(s)}>
    <motion.g animate={c} initial="normal" variants={bounce} style={centre}>
      <path d="M3 11h3a2 2 0 0 1 2 2v3a2 2 0 0 1-2 2H3a1 1 0 0 1-1-1v-4a10 10 0 0 1 20 0v4a1 1 0 0 1-1 1h-3a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3" />
      <path d="M21 16v2a4 4 0 0 1-4 4h-5" />
    </motion.g>
  </svg>
));

export const VideoIcon = craft("VideoIcon", (c, s) => (
  <svg {...svgAttrs(s)}>
    <motion.path
      d="m22 8-6 4 6 4V8Z"
      animate={c}
      initial="normal"
      variants={{ normal: { x: 0, opacity: 1 }, animate: { x: [-3, 0], opacity: [0, 1], transition: { duration: 0.4, ease: "easeOut" } } }}
    />
    <rect x="2" y="6" width="14" height="12" rx="2" />
  </svg>
));

export const MemoryStickIcon = craft("MemoryStickIcon", (c, s) => (
  <svg {...svgAttrs(s)}>
    <path d="M2 15h20" />
    <path d="M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v1.1a2 2 0 0 0 0 3.837V17a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-5.1a2 2 0 0 0 0-3.837Z" />
    <path d="M8 11V9" />
    <path d="M12 11V9" />
    <path d="M16 11V9" />
    <motion.path d="M6 19v-3" animate={c} initial="normal" variants={blink(0)} />
    <motion.path d="M10 19v-3" animate={c} initial="normal" variants={blink(0.1)} />
    <motion.path d="M14 19v-3" animate={c} initial="normal" variants={blink(0.2)} />
    <motion.path d="M18 19v-3" animate={c} initial="normal" variants={blink(0.3)} />
  </svg>
));

export const HardDriveIcon = craft("HardDriveIcon", (c, s) => (
  <svg {...svgAttrs(s)}>
    <line x1="22" y1="12" x2="2" y2="12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
    <motion.line x1="6" y1="16" x2="6.01" y2="16" animate={c} initial="normal" variants={blink(0)} />
    <motion.line x1="10" y1="16" x2="10.01" y2="16" animate={c} initial="normal" variants={blink(0.15)} />
  </svg>
));

export const AppWindowIcon = craft("AppWindowIcon", (c, s) => (
  <svg {...svgAttrs(s)}>
    <motion.g
      animate={c}
      initial="normal"
      variants={{ normal: { scale: 1 }, animate: { scale: [0.9, 1], transition: { type: "spring", stiffness: 320, damping: 18 } } }}
      style={centre}
    >
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="M2 8h20" />
      <path d="M6 4v4" />
      <path d="M10 4v4" />
    </motion.g>
  </svg>
));

export const LayoutDashboardIcon = craft("LayoutDashboardIcon", (c, s) => {
  const tiles = [
    { x: 3, y: 3, w: 7, h: 9, delay: 0 },
    { x: 14, y: 3, w: 7, h: 5, delay: 0.08 },
    { x: 14, y: 12, w: 7, h: 9, delay: 0.16 },
    { x: 3, y: 16, w: 7, h: 5, delay: 0.24 },
  ];
  return (
    <svg {...svgAttrs(s)}>
      {tiles.map((t, i) => (
        <motion.rect
          key={i}
          x={t.x}
          y={t.y}
          width={t.w}
          height={t.h}
          rx={1}
          animate={c}
          initial="normal"
          variants={{ normal: { scale: 1, opacity: 1 }, animate: { scale: [0.5, 1], opacity: [0, 1], transition: { duration: 0.35, delay: t.delay, ease: "easeOut" } } }}
          style={centre}
        />
      ))}
    </svg>
  );
});

export const MonitorPlayIcon = craft("MonitorPlayIcon", (c, s) => (
  <svg {...svgAttrs(s)}>
    <path d="M8 21h8" />
    <path d="M12 17v4" />
    <rect x="2" y="3" width="20" height="12" rx="2" />
    <motion.path
      d="m10 7 5 2.5-5 2.5V7Z"
      animate={c}
      initial="normal"
      variants={{ normal: { scale: 1 }, animate: { scale: [1, 1.25, 1], transition: { duration: 0.45, ease: "easeInOut" } } }}
      style={centre}
    />
  </svg>
));
