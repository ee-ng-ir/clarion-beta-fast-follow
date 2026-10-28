import { useEffect, useState } from "react"
import { CornerDownLeft, X } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

// well-formed email check (MVP: format only, email-only channel)
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Seed so the page opens in the populated + saved state.
// TODO(api): GET tenancy routing config; this is the source of truth for the
// widget (IROS-147) and the Alerts flow.
const INITIAL_RECIPIENTS: string[] = ["lisa.p@acme.com", "david.s@acme.com", "emily.r@acme.com"]

/**
 * One routing purpose: a chip-style multi-email field.
 * - Enter / comma / the ↵ button commits the typed address(es) to a chip.
 * - Rejects malformed emails and duplicates within this list (inline error).
 * - Only committed chips are part of the saved config — uncommitted text in the
 *   box is transient and is cleared on Save/Cancel (via `resetSignal`).
 */
function EmailChips({
  label, description, value, onChange, resetSignal,
}: {
  label: string
  description: string
  value: string[]
  onChange: (emails: string[]) => void
  resetSignal: number
}) {
  const [text, setText] = useState("")
  const [error, setError] = useState<string | null>(null)

  // Save/Cancel clears any half-typed, uncommitted input.
  useEffect(() => { setText(""); setError(null) }, [resetSignal])

  const commit = (raw: string) => {
    const parts = raw.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean)
    if (!parts.length) return
    let next = [...value]
    for (const part of parts) {
      const email = part.toLowerCase()
      if (!EMAIL_RE.test(email)) { setError("Enter a valid email address"); return }
      if (next.includes(email)) { setError("Email already exists"); return }
      next = [...next, email]
    }
    onChange(next)
    setText("")
    setError(null)
  }

  const remove = (email: string) => onChange(value.filter((e) => e !== email))

  return (
    <div className="flex flex-col gap-3 py-5 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
      <div className="flex flex-col sm:max-w-sm">
        <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{label}</span>
        <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{description}</span>
      </div>

      <div className="flex w-full flex-col gap-2 sm:w-96 sm:shrink-0">
        <div
          className="flex h-9 items-center gap-1.5 rounded-lg px-2.5"
          style={{ background: "var(--bg-input-default)", border: `1px solid ${error ? "var(--border-danger-emphasis)" : "var(--border-input-default)"}` }}
        >
          <input
            value={text}
            onChange={(e) => { setText(e.target.value); if (error) setError(null) }}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); commit(text) } }}
            placeholder="Enter email"
            aria-invalid={!!error}
            aria-label={`${label} recipient email`}
            className="min-w-px flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--fg-neutral-muted)]"
            style={{ color: "var(--fg-neutral-emphasis)" }}
          />
          <button
            type="button" aria-label="Add email" onClick={() => commit(text)}
            className="flex size-5 shrink-0 items-center justify-center rounded-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
            style={{ color: "var(--fg-neutral-muted)" }}
          >
            <CornerDownLeft className="size-3.5" />
          </button>
        </div>

        {error && (
          <span className="text-xs font-medium" style={{ color: "var(--fg-danger-emphasis)" }}>{error}</span>
        )}

        {value.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {value.map((email) => (
              <span
                key={email}
                className="inline-flex items-center gap-1.5 rounded-md py-1 pl-2.5 pr-1.5 text-sm"
                style={{ background: "var(--bg-neutral-subtle)", border: "1px solid var(--border-neutral-subtle)", color: "var(--fg-neutral-emphasis)" }}
              >
                {email}
                <button
                  type="button" aria-label={`Remove ${email}`} onClick={() => remove(email)}
                  className="flex size-4 items-center justify-center rounded-sm transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
                  style={{ color: "var(--fg-neutral-muted)" }}
                >
                  <X className="size-3" />
                </button>
              </span>
            ))}
          </div>
        ) : (
          <span className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>No recipients added</span>
        )}
      </div>
    </div>
  )
}

/**
 * Alert routing — tenancy-level, email-only (MVP). For now this routes just the
 * worker-submitted "Send report to IT" emails. Edits stay in a draft until Save
 * (consistent with the threshold sliders); Cancel reverts to the last-saved list.
 */
export function AlertRouting() {
  const [saved, setSaved] = useState<string[]>(() => [...INITIAL_RECIPIENTS])
  const [draft, setDraft] = useState<string[]>(() => [...INITIAL_RECIPIENTS])
  const [saving, setSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)
  const [resetSignal, setResetSignal] = useState(0)

  const dirty = JSON.stringify(draft) !== JSON.stringify(saved)

  // TODO(api): PUT routing config; map the response → saved/error. Takes effect
  // on the next alert firing (no restart).
  const save = () => {
    setSaving(true)
    window.setTimeout(() => {
      setSaved([...draft])
      setSaving(false)
      setJustSaved(true)
      setResetSignal((n) => n + 1) // drop any uncommitted input text
      window.setTimeout(() => setJustSaved(false), 3000)
    }, 700) // mock backend round-trip
  }
  const cancel = () => {
    setDraft([...saved])
    setResetSignal((n) => n + 1)
    setJustSaved(false)
  }

  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      <div className="flex flex-wrap items-start justify-between gap-3 px-5 py-4" style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
        <div className="flex flex-col">
          <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Alert routing</h2>
          <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>Choose who gets notified when issues are detected.</span>
        </div>
        <div className="flex items-center gap-2">
          {saving ? (
            <Button size="sm" loading>Saving…</Button>
          ) : dirty ? (
            <>
              <Button variant="ghost" size="sm" onClick={cancel}>Cancel</Button>
              <Button size="sm" onClick={save}>Save changes</Button>
            </>
          ) : justSaved ? (
            <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-muted)" }}>All changes saved.</span>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col px-5">
        <EmailChips
          label="IT issues"
          description="Email addresses that receive issue reports sent by widget users. When a user hits a problem, they can send a diagnostic report straight to these recipients."
          value={draft}
          onChange={setDraft}
          resetSignal={resetSignal}
        />
      </div>
    </Card>
  )
}
