// The tenant itself, as the Iris admin portal shows it: identity, contact,
// plans, and the Account Admins who run it. Mirrors the live portal
// (admin.<env>.ir.com/t_<tenantId>), with the dummy tenant's names.

import { useSyncExternalStore } from "react"

export const tenant = {
  name: "Acme Contact Centre",
  id: "5jjgAFEkycj",
  region: "AU (Sydney)",
  contact: { name: "Ava Thornton", email: "ava.thornton@acme.com" },
}

export interface ProductPlan {
  product: "clarion" | "vantage"
  productName: string
  plan: string
  cycle: "Annual" | "Monthly"
  expires: string
  licenses: number
  blurb: string
}

export const plans: ProductPlan[] = [
  {
    product: "clarion",
    productName: "Clarion",
    plan: "Clarion Enterprise",
    cycle: "Annual",
    expires: "17 Sep 2027",
    licenses: 500,
    blurb:
      "Clarion combines endpoint monitoring and hosted analytics to provide real-time visibility into employee and agent experience, including communication platform connectivity, network quality, audio device health, endpoint performance, and other factors that may impact productivity and call quality.",
  },
  {
    // Placeholder: Vantage has no plan or spec yet.
    product: "vantage",
    productName: "Vantage",
    plan: "Vantage Standard",
    cycle: "Annual",
    expires: "30 Jun 2027",
    licenses: 50,
    blurb:
      "Vantage monitors the voice and contact-centre infrastructure behind your sites: session border controllers, call managers, gateways, the contact-centre platform and call recording.",
  },
]

// ------------------------------------------------------------ account admins --

export type AdminStatus = "active" | "invited" | "deactivated"

export interface AccountAdmin {
  id: string
  name: string
  email: string
  /** ISO timestamp of their last sign-in; null until an invite is accepted. */
  lastLogin: string | null
  status: AdminStatus
}

/** Account Admin seats on the tenant's contract. */
export const ACCOUNT_ADMIN_LIMIT = 6

/** The admin using the prototype (Marcus, as in @ir/mock-data/access). */
export const ME_ADMIN = "aa-marcus"

const seed: AccountAdmin[] = [
  { id: "aa-ava", name: "Ava Thornton", email: "ava.thornton@acme.com", lastLogin: "2026-10-07T09:12:00+11:00", status: "active" },
  { id: "aa-daniel", name: "Daniel Okafor", email: "daniel.okafor@acme.com", lastLogin: "2026-10-26T14:40:00+11:00", status: "active" },
  { id: "aa-grace", name: "Grace Mwangi", email: "grace.mwangi@acme.com", lastLogin: "2026-10-24T08:05:00+11:00", status: "active" },
  { id: "aa-kofi", name: "Kofi Mensah", email: "kofi.mensah@acme.com", lastLogin: "2026-10-22T16:30:00+11:00", status: "active" },
  { id: "aa-marcus", name: "Marcus Reyes", email: "marcus.reyes@acme.com", lastLogin: "2026-10-27T11:20:00+11:00", status: "active" },
  { id: "aa-hannah", name: "Hannah Schmidt", email: "hannah.schmidt@acme.com", lastLogin: "2026-09-28T10:00:00+10:00", status: "active" },
]

let admins = seed.map((a) => ({ ...a }))
let version = 0
const listeners = new Set<() => void>()
const bump = () => { version++; listeners.forEach((l) => l()) }

/** Seats in use: everyone not deactivated (an invite holds a seat). */
const seatsUsed = () => admins.filter((a) => a.status !== "deactivated").length

export const accountAdmins = {
  subscribe(l: () => void) { listeners.add(l); return () => { listeners.delete(l) } },
  version: () => version,
  all: () => admins,
  seatsUsed,
  seatsLeft: () => Math.max(0, ACCOUNT_ADMIN_LIMIT - seatsUsed()),
  invite(input: { name: string; email: string }): { ok: true } | { ok: false; error: string } {
    const email = input.email.trim().toLowerCase()
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, error: "Enter a valid email address." }
    if (admins.some((a) => a.email === email && a.status !== "deactivated")) return { ok: false, error: "That person is already an Account Admin." }
    if (seatsUsed() >= ACCOUNT_ADMIN_LIMIT) return { ok: false, error: "No Account Admin licenses left." }
    admins = [...admins, { id: `aa-${Math.random().toString(36).slice(2, 8)}`, name: input.name.trim() || email, email, lastLogin: null, status: "invited" }]
    bump()
    return { ok: true }
  },
  setStatus(id: string, status: AdminStatus) {
    admins = admins.map((a) => (a.id === id ? { ...a, status } : a))
    bump()
  },
  reset() { admins = seed.map((a) => ({ ...a })); bump() },
}

/** Re-render when the Account Admins list changes. */
export const useAccountAdmins = () => {
  useSyncExternalStore(accountAdmins.subscribe, accountAdmins.version)
  return accountAdmins.all()
}
