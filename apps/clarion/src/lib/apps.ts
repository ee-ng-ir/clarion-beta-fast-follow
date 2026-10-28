// Where the other prototypes live. Each app is its own Vercel project; set these
// per environment (Vercel → Settings → Environment Variables). Locally, the
// monorepo's dev ports are the defaults.
export const CLARION_URL = (import.meta.env.VITE_CLARION_URL ?? "http://localhost:5173").replace(/\/$/, "")
export const CLIENT_CONSOLE_URL = (import.meta.env.VITE_CLIENT_CONSOLE_URL ?? "http://localhost:5174").replace(/\/$/, "")
export const OPS_CONSOLE_URL = (import.meta.env.VITE_OPS_CONSOLE_URL ?? "http://localhost:5175").replace(/\/$/, "")
