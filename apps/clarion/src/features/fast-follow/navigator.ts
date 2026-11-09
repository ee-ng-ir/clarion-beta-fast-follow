import type { PageId } from "@/nav"

// Lets Fast Follow pieces outside the page tree (drawers, Iris) change page.
let go: ((p: PageId) => void) | null = null
export const setNavigator = (fn: (p: PageId) => void) => { go = fn }
export const goTo = (p: PageId) => go?.(p)
