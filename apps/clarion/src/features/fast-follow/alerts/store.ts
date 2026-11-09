import { useSyncExternalStore } from "react"

// Which alert group is open. Shared so Overview's Top issues can open a group on the Alerts page.
let openId: string | null = null
const subs = new Set<() => void>()
export const openGroup = (id: string | null) => { openId = id; subs.forEach((f) => f()) }
export const useOpenGroup = () =>
  useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f) } }, () => openId)
