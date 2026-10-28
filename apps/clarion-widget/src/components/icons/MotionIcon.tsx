"use client";

import type { Variants } from "motion/react";
import { motion, useAnimation } from "motion/react";
import type { HTMLAttributes } from "react";
import { forwardRef, useCallback, useImperativeHandle, useRef } from "react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";

export interface AnimatedIconHandle {
  startAnimation: () => void;
  stopAnimation: () => void;
}

export interface AnimatedIconProps extends HTMLAttributes<HTMLDivElement> {
  size?: number;
}

/**
 * Uniform "press" micro-interaction (borrowed from motion-icons-react): a quick
 * scale down and back, like a tactile button press. Every icon shares it, so the
 * whole set feels consistent; triggered via the same start/stop handle on hover.
 */
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
