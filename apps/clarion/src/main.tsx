import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { PreviewFrame } from "./features/fast-follow/PreviewMarker"
import { EmailPage } from "./features/fast-follow/email/EmailPage"
import { openGroup } from "./features/fast-follow/alerts/store"
import { goToSettingsOnLoad } from "./features/fast-follow/navigator"
import { CLIENT_CONSOLE_URL } from "./lib/apps"
import { restoreViewAs } from "./lib/viewer"

// Prototype: sign back in as whoever "View as" was last set to.
restoreViewAs()

// SSO setup links belong to the Iris client console now.
if (window.location.pathname.startsWith("/setup/sso")) {
  window.location.replace(`${CLIENT_CONSOLE_URL}${window.location.pathname}${window.location.search}`)
}

// Fast Follow deep links: the notification email's "View in Clarion" and settings links
const params = new URLSearchParams(window.location.search)
if (window.location.pathname.startsWith("/issues") && params.get("group")) openGroup(params.get("group")!)
if (window.location.pathname.startsWith("/settings") && params.get("tab")) goToSettingsOnLoad(params.get("tab")!)

// Fast Follow: /email is the notification email on its own page, like /widget
const isEmail = window.location.pathname.replace(/\/$/, "") === "/email"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {isEmail ? <PreviewFrame><EmailPage /></PreviewFrame> : <App />}
  </StrictMode>
)
