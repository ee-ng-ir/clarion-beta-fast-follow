import { useEffect, useState } from "react"
import type { SsoDraft } from "@/components/admin/sso/SsoWizard"

/**
 * A setup link: an Admin hands SSO setup to someone outside Iris (usually IT).
 *
 * In the real product this lives on the server. The prototype keeps it in
 * localStorage so the Admin's tab and the IT person's tab (opened with
 * "Open their view") see the same invite, and the Admin page updates live
 * as IT works through the steps.
 */
export type InviteStatus = "sent" | "verified" | "completed" | "revoked"

export interface SetupInvite {
  id: string
  email: string
  note: string
  from: { name: string; email: string }
  sentAt: number
  expiresAt: number
  status: InviteStatus
  /** Where the setup is up to. Starts from the Admin's own draft, if any. */
  draft: SsoDraft
  finishedAt?: number
}

const KEY = "iris:sso-setup-invite"
const EVENT = "iris:sso-setup-invite"
export const INVITE_DAYS = 7

export function readInvite(): SetupInvite | null {
  try {
    const raw = window.localStorage.getItem(KEY)
    return raw ? (JSON.parse(raw) as SetupInvite) : null
  } catch {
    return null
  }
}

export function writeInvite(invite: SetupInvite | null) {
  try {
    if (invite) window.localStorage.setItem(KEY, JSON.stringify(invite))
    else window.localStorage.removeItem(KEY)
  } catch {
    /* Storage blocked (private window): the prototype just won't sync tabs. */
  }
  window.dispatchEvent(new Event(EVENT))
}

export const updateInvite = (patch: Partial<SetupInvite>) => {
  const current = readInvite()
  if (current) writeInvite({ ...current, ...patch })
}

/** The current invite, kept in sync across tabs. */
export function useInvite(): SetupInvite | null {
  const [invite, setInvite] = useState<SetupInvite | null>(() => readInvite())
  useEffect(() => {
    const sync = () => setInvite(readInvite())
    const onStorage = (e: StorageEvent) => { if (e.key === KEY) sync() }
    window.addEventListener(EVENT, sync)
    window.addEventListener("storage", onStorage)
    return () => {
      window.removeEventListener(EVENT, sync)
      window.removeEventListener("storage", onStorage)
    }
  }, [])
  return invite
}

export const isOpen = (i: SetupInvite | null): i is SetupInvite =>
  !!i && i.status !== "revoked" && i.expiresAt > Date.now()

export const newInviteId = () => Math.random().toString(36).slice(2, 10)

export const inviteUrl = (i: SetupInvite) => `/setup/sso?invite=${i.id}`

export const shortDate = (ms: number) =>
  new Intl.DateTimeFormat(undefined, { day: "numeric", month: "short" }).format(ms)
