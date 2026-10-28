/** The prototype's clock. Fixed so relative dates in the dummy data read the same every day. */
export const NOW = new Date("2026-10-28T12:00:00+11:00")

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]

/** 28 Oct 2026 — day-first and unambiguous, unlike the 10/28/2026 the live console shows. */
export function fmtDate(iso: string | Date | null | undefined) {
  if (!iso) return "—"
  const d = typeof iso === "string" ? new Date(iso) : iso
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`
}

export function fmtDateTime(iso: string) {
  const d = new Date(iso)
  const hh = String(d.getHours()).padStart(2, "0")
  const mm = String(d.getMinutes()).padStart(2, "0")
  const ss = String(d.getSeconds()).padStart(2, "0")
  return `${fmtDate(d)}, ${hh}:${mm}:${ss}`
}

export function ago(iso: string | null | undefined) {
  if (!iso) return "Never"
  const s = Math.max(0, (NOW.getTime() - new Date(iso).getTime()) / 1000)
  if (s < 60) return "Just now"
  const m = s / 60
  if (m < 60) return `${Math.floor(m)}m ago`
  const h = m / 60
  if (h < 24) return `${Math.floor(h)}h ago`
  const d = h / 24
  if (d < 30) return `${Math.floor(d)}d ago`
  const mo = d / 30
  if (mo < 12) return `${Math.floor(mo)}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}

/** "10 months", "12 days", "Expired" — what the product cards show under the plan. */
export function remaining(iso: string) {
  const days = Math.round((new Date(iso).getTime() - NOW.getTime()) / 86_400_000)
  if (days < 0) return "Expired"
  if (days < 45) return `${days} day${days === 1 ? "" : "s"}`
  const months = Math.round(days / 30.4)
  if (months < 24) return `${months} months`
  return `${Math.round(months / 12)} years`
}

export const daysUntil = (iso: string) => Math.round((new Date(iso).getTime() - NOW.getTime()) / 86_400_000)

export const isoDay = (d: Date) => new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString()

export const initials = (name: string) =>
  name.split(/\s+/).filter(Boolean).map((p) => p[0]).slice(0, 2).join("").toUpperCase()

export const cx = (...xs: (string | false | null | undefined)[]) => xs.filter(Boolean).join(" ")

/** 11-character tenant ids, the shape the platform issues (t_Fp4gp7oL4zb). */
export function newTenantId() {
  const a = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789"
  return Array.from({ length: 11 }, () => a[Math.floor(Math.random() * a.length)]).join("")
}

export const emailOk = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim())
export const domainOk = (d: string) => /^(?!-)[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(d.trim())
