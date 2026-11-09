import { Badge } from "@ir/ui"

/**
 * Marks anything still TBC in the epics (e.g. Iris Investigate, energy saver
 * detection). Committed Fast Follow items carry no tag.
 */
export function ExploringTag({ className }: { className?: string }) {
  return (
    <Badge color="info" className={className} title="Still being explored. Not committed for Fast Follow.">
      Exploring
    </Badge>
  )
}

/** "New" marker for nav items and sections introduced by Fast Follow. */
export function NewTag({ className }: { className?: string }) {
  return <Badge color="info" className={className}>New</Badge>
}

/** Quiet "new" marker for tabs, sections and controls: a blue dot. The sidebar keeps the "New" badge. */
export function NewDot({ className }: { className?: string }) {
  return (
    <span className={className}>
      <span className="inline-block size-2 rounded-full bg-status-info align-middle" aria-hidden />
      <span className="sr-only">New</span>
    </span>
  )
}
