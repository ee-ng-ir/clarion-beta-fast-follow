import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import { OpsApp } from "./OpsApp"

// The whole Ops console is Picasso, so switch it on at the root.
document.documentElement.setAttribute("data-picasso", "")

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OpsApp />
  </StrictMode>
)
