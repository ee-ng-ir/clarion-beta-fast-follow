import type { ComponentProps } from "react"

/**
 * Skeleton — shadcn-style loading placeholder. Two animations:
 *   - "shimmer" (default): a light band sweeps across the block (@keyframes clarion-shimmer).
 *   - "pulse": the block fades in/out (Tailwind `animate-pulse`).
 * Pass width / height / shape via className (e.g. `h-3 w-40`, `size-2.5 rounded-full`).
 */
export function Skeleton({
  className = "",
  style,
  variant = "shimmer",
  ...props
}: ComponentProps<"div"> & { variant?: "pulse" | "shimmer" }) {
  if (variant === "shimmer") {
    return (
      <div
        data-slot="skeleton"
        className={`rounded-md ${className}`}
        style={{
          backgroundColor: "var(--bg-neutral-subtle-pressed)",
          backgroundImage: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.65) 50%, transparent 100%)",
          backgroundRepeat: "no-repeat",
          backgroundSize: "50% 100%",
          animation: "clarion-shimmer 1.4s ease-in-out infinite",
          ...style,
        }}
        {...props}
      />
    )
  }
  return (
    <div
      data-slot="skeleton"
      className={`animate-pulse rounded-md ${className}`}
      style={{ background: "var(--bg-neutral-subtle-pressed)", ...style }}
      {...props}
    />
  )
}
