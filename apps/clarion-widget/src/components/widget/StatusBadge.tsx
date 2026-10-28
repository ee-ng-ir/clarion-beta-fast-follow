import type { Status } from "@/data/widget"

/**
 * Readiness badge for the Clarion logo / tray icon — matches the Figma "Brand"
 * component (node 1386:73651) exactly:
 *   healthy  → green circle + check      (#079455)
 *   warning  → amber circle + exclamation (#DC6803)
 *   critical → red triangle + exclamation (#D92D20)
 * A white ring keeps it legible on the gradient tile. (Figma also has a 4th
 * "syncing" state, #9AA4B2 with a sync glyph, used only while status is unknown.)
 */
export function StatusBadge({ status, size = 15, className }: { status: Status; size?: number; className?: string }) {
  if (status === "unknown") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <circle cx="12" cy="12" r="10.5" fill="var(--status-unknown)" stroke="#FFFFFF" strokeWidth="2" />
        <circle cx="12" cy="7.6" r="1.3" fill="#FFFFFF" />
        <path d="M12 10.8 v6" stroke="#FFFFFF" strokeWidth="2.1" strokeLinecap="round" />
      </svg>
    )
  }
  if (status === "syncing") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <circle cx="12" cy="12" r="10.5" fill="var(--status-unknown)" stroke="#FFFFFF" strokeWidth="2" />
        <g stroke="#FFFFFF" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" fill="none">
          <path d="M7.5 10 H16 M13.8 7.6 16.2 10 13.8 12.4" />
          <path d="M16.5 14 H8 M10.2 11.6 7.8 14 10.2 16.4" />
        </g>
      </svg>
    )
  }
  if (status === "critical") {
    return (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
        <path d="M12 2.5 22.5 21 H1.5 Z" fill="var(--status-critical)" stroke="#FFFFFF" strokeWidth="2" strokeLinejoin="round" />
        <path d="M12 10 v4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
        <circle cx="12" cy="17.4" r="1.2" fill="#FFFFFF" />
      </svg>
    )
  }
  const healthy = status === "healthy"
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="10.5" fill={healthy ? "var(--status-healthy)" : "var(--status-warning)"} stroke="#FFFFFF" strokeWidth="2" />
      {healthy ? (
        <path d="M7 12.6 10.4 16 17 8.6" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      ) : (
        <>
          <path d="M12 6.8 v5.4" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1.2" fill="#FFFFFF" />
        </>
      )}
    </svg>
  )
}
