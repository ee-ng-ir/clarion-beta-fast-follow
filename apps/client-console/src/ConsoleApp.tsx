import { useEffect, useState } from "react"
import { AdminApp } from "@/AdminApp"
import { CLARION_URL } from "@/lib/apps"
import { defaultPageFor, experienceOf, pageFromPath, pagePath, type Experience, type PageId } from "@/nav"

/**
 * The Iris client console (Client Admin). One shell — AdminApp — with its own
 * routes under /admin/*. Product apps (Clarion) are separate deployments: their
 * routes, and the account menu's "Back to Clarion", go to CLARION_URL.
 */
const startPage = (): PageId => {
  const path = window.location.pathname.replace(/\/+$/, "") || "/"
  const p = pageFromPath(path)
  if (experienceOf(p) === "admin") return p
  // A Clarion route that isn't "/" belongs to the Clarion app.
  if (path !== "/" && Object.values(pagePath).includes(path)) window.location.replace(`${CLARION_URL}${path}${window.location.search}`)
  return defaultPageFor.admin
}

export function ConsoleApp() {
  const [page, setPage] = useState<PageId>(startPage)
  const [dark, setDark] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(true)

  useEffect(() => { document.documentElement.classList.toggle("dark", dark) }, [dark])

  // Keep the URL in sync; Back/Forward rebuild the page from it.
  useEffect(() => {
    const url = pagePath[page]
    if (window.location.pathname !== url) window.history.pushState(null, "", url)
  }, [page])
  useEffect(() => {
    const onPop = () => setPage(startPage())
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  const switchExperience = (e: Experience) => {
    if (e === "fleet") window.location.assign(CLARION_URL)
    else setPage(defaultPageFor.admin)
  }

  return (
    <AdminApp
      page={page}
      onNavigate={setPage}
      dark={dark}
      onToggleTheme={() => setDark((v) => !v)}
      sidebarOpen={sidebarOpen}
      onToggleSidebar={() => setSidebarOpen((v) => !v)}
      onSwitchExperience={switchExperience}
    />
  )
}
