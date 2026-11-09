import type { PageId } from "@/nav"

// Lets Fast Follow pieces outside the page tree (drawers, Iris) change page.
let go: ((p: PageId) => void) | null = null
export const setNavigator = (fn: (p: PageId) => void) => { go = fn }
export const goTo = (p: PageId) => go?.(p)

// A page with unsaved changes can hold a page change: the guard gets the
// navigation to run later and returns true if it's holding it (e.g. showing a
// "Discard unsaved changes?" dialog). Settings uses this (D9).
type LeaveGuard = (proceed: () => void) => boolean
let guard: LeaveGuard | null = null
export const setLeaveGuard = (g: LeaveGuard | null) => { guard = g }
export const guarded = (navigate: () => void) => { if (guard?.(navigate)) return; navigate() }

// Fast Follow: open Settings on a given tab (e.g. Dashboards → Approved headsets)
let settingsTab: string | null = null
export const goToSettings = (tab: string) => { settingsTab = tab; goTo("settings") }
/** On page load (a ?tab= link), without navigating. */
export const goToSettingsOnLoad = (tab: string) => { settingsTab = tab }
export const takeSettingsTab = () => settingsTab
export const clearSettingsTab = () => { settingsTab = null }
