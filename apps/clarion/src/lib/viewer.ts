import { useSyncExternalStore } from "react"
import { access, clarionAccess, me } from "@ir/mock-data/access"
import { thresholdAccess } from "@/data/thresholdRules"
import type { PageId } from "@/nav"

// Mirrors the client console's lib/viewer.ts. Each app is its own origin, so the
// "View as" choice is remembered per app.
const KEY = "iris:view-as"

/** People to switch between in Clarion: everyone in the shared list who holds a Clarion role. */
export const clarionViewAsPeople = () =>
  ["p2", "p14", "p8", "p5", "p3", "p6"].filter((id) => access.person(id) && clarionAccess(id).role)

/** The signed-in person and what they may do in Clarion. Re-renders when either changes. */
export function useViewer() {
  useSyncExternalStore(access.subscribe, access.version)
  const id = me()
  return { id, person: access.person(id)!, thresholds: thresholdAccess(id) }
}

/** Can this person open the page? Only Settings (which holds Thresholds) is gated so far. */
export const canOpen = (page: PageId, viewer: ReturnType<typeof useViewer>) =>
  (page !== "thresholds" && page !== "settings") || viewer.thresholds.mode !== "none"

/** Prototype only: switch who is signed in, and remember it in this browser. */
export function setViewAs(id: string) {
  access.setMe(id)
  try { window.localStorage.setItem(KEY, id) } catch { /* storage off: still switches */ }
}

/** Restore the last "View as" choice. */
export function restoreViewAs() {
  try { const id = window.localStorage.getItem(KEY); if (id) access.setMe(id) } catch { /* ignore */ }
}
