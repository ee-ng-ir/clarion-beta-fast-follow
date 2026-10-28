import { useSyncExternalStore } from "react"

/**
 * Tiny path router. The real console routes on the path (/tenants,
 * /tenants/:id?tab=products, /feature-flags …), so the prototype does too —
 * every screen and tab is a shareable link. vercel.json rewrites to index.html.
 */
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

if (typeof window !== "undefined") window.addEventListener("popstate", emit)

const subscribe = (l: () => void) => {
  listeners.add(l)
  return () => listeners.delete(l)
}
const snapshot = () => window.location.pathname + window.location.search

export function useLocation() {
  const href = useSyncExternalStore(subscribe, snapshot)
  const url = new URL(href, window.location.origin)
  return { path: url.pathname.replace(/\/+$/, "") || "/", query: url.searchParams }
}

export function navigate(to: string, opts: { replace?: boolean } = {}) {
  if (to === snapshot()) return
  if (opts.replace) window.history.replaceState(null, "", to)
  else window.history.pushState(null, "", to)
  emit()
  // A new page starts at the top; a tab switch (same path) keeps its place.
  const main = document.querySelector("[data-slot=app-shell-content]")
  if (main && !opts.replace) main.scrollTop = 0
}

export type Route =
  | { page: "tenants" }
  | { page: "tenant-new" }
  | { page: "tenant"; id: string }
  | { page: "product-plans" }
  | { page: "services" }
  | { page: "email-activity" }
  | { page: "tofu-modules" }
  | { page: "feature-flags" }
  | { page: "not-found" }

export function matchRoute(path: string): Route {
  if (path === "/" || path === "/tenants") return { page: "tenants" }
  if (path === "/tenants/new") return { page: "tenant-new" }
  const t = path.match(/^\/tenants\/([^/]+)$/)
  if (t) return { page: "tenant", id: t[1] }
  const simple = ["product-plans", "services", "email-activity", "tofu-modules", "feature-flags"] as const
  const hit = simple.find((p) => path === `/${p}`)
  return hit ? { page: hit } : { page: "not-found" }
}
