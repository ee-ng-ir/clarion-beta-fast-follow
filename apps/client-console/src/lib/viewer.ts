import { useSyncExternalStore } from "react"
import { access, me, permissionsOf } from "@ir/mock-data/access"

const KEY = "iris:view-as"

/** The signed-in person and what they may do. Re-renders when either changes. */
export function useViewer() {
  useSyncExternalStore(access.subscribe, access.version)
  const id = me()
  return { id, person: access.person(id)!, perm: permissionsOf(id) }
}

/** Prototype only: switch who is signed in, and remember it in this browser. */
export function setViewAs(id: string) {
  access.setMe(id)
  try { window.localStorage.setItem(KEY, id) } catch { /* storage off: still switches */ }
}

/** Restore the last "View as" choice. */
export function restoreViewAs() {
  try { const id = window.localStorage.getItem(KEY); if (id) access.setMe(id) } catch { /* ignore */ }
}
