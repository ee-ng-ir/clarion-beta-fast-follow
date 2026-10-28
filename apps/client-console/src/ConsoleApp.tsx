import { useEffect, useState } from "react"
import { AdminApp } from "@/AdminApp"
import { CLARION_URL } from "@/lib/apps"
import { buildPath, pageFromPath, readUserTab, type PageId, type UserTab } from "@/nav"
import { restoreViewAs } from "@/lib/viewer"

// Prototype: sign back in as whoever "View as" was last set to.
restoreViewAs()

/** Fleet routes that belong to the Clarion app, not here. */
const clarionPaths = ["/endpoints", "/issues", "/thresholds", "/glossary", "/devices-model", "/issues-model", "/scope", "/components"]

interface Route { page: PageId; tab: UserTab }

const readRoute = (): Route => {
  const path = window.location.pathname.replace(/\/+$/, "") || "/"
  if (clarionPaths.includes(path)) window.location.replace(`${CLARION_URL}${path}${window.location.search}`)
  return { page: pageFromPath(path) ?? "home", tab: readUserTab(window.location.search) }
}

/**
 * The Iris admin portal (client console). One shell, AdminApp. Clarion is a
 * separate deployment: "Go to Fleet dashboard" and the account menu go to
 * CLARION_URL.
 */
export function ConsoleApp() {
  const [route, setRoute] = useState<Route>(readRoute)
  const [dark, setDark] = useState(false)

  useEffect(() => { document.documentElement.classList.toggle("dark", dark) }, [dark])

  // Keep the URL in sync; Back/Forward rebuild the page from it.
  useEffect(() => {
    const url = buildPath(route.page, route.tab)
    if (window.location.pathname + window.location.search !== url) window.history.pushState(null, "", url)
  }, [route])
  useEffect(() => {
    const onPop = () => setRoute(readRoute())
    window.addEventListener("popstate", onPop)
    return () => window.removeEventListener("popstate", onPop)
  }, [])

  return (
    <AdminApp
      page={route.page}
      userTab={route.tab}
      onNavigate={(page, tab = "admins") => setRoute({ page, tab })}
      dark={dark}
      onToggleTheme={() => setDark((v) => !v)}
    />
  )
}
