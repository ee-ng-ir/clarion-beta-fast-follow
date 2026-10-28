import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./App.tsx"
import { CLIENT_CONSOLE_URL } from "./lib/apps"

// SSO setup links belong to the Iris client console now.
if (window.location.pathname.startsWith("/setup/sso")) {
  window.location.replace(`${CLIENT_CONSOLE_URL}${window.location.pathname}${window.location.search}`)
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
