// Where the other prototypes live. Each app is its own Vercel project.
// Order: a VITE_*_URL env var if set (Vercel → Settings → Environment Variables),
// else the local dev port when running `npm run dev`, else the production URL.
const pick = (env: string | undefined, devPort: number, prod: string) =>
  (env ?? (import.meta.env.DEV ? `http://localhost:${devPort}` : prod)).replace(/\/$/, "")

export const CLARION_URL = pick(import.meta.env.VITE_CLARION_URL, 5173, "https://ir-clarion.vercel.app")
export const CLIENT_CONSOLE_URL = pick(import.meta.env.VITE_CLIENT_CONSOLE_URL, 5174, "https://ir-client-console.vercel.app")
export const OPS_CONSOLE_URL = pick(import.meta.env.VITE_OPS_CONSOLE_URL, 5175, "https://ir-ops-console.vercel.app")
