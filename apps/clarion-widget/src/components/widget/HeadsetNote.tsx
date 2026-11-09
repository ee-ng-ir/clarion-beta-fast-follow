import { useState } from "react"
import { Info, X } from "lucide-react"

const key = (agentId: string, headsetId: string) => `ff:headset-note-dismissed:${agentId}:${headsetId}`

/**
 * Fast Follow — approved headsets. A friendly note under Headphones when the
 * agent's headset isn't on their IT team's approved list. Advisory, never
 * policing: the headset keeps working and the overall status stays as it is.
 * Dismissed for this session; it comes back at the next sign-in.
 */
export function HeadsetNote({ agentId, headsetId }: { agentId: string; headsetId: string }) {
  const [dismissed, setDismissed] = useState(() => { try { return sessionStorage.getItem(key(agentId, headsetId)) === "1" } catch { return false } })
  if (dismissed) return null
  const dismiss = () => { try { sessionStorage.setItem(key(agentId, headsetId), "1") } catch { /* still hides */ } setDismissed(true) }
  return (
    <div className="mt-1 rounded-lg py-2 pl-2.5 pr-2" style={{ background: "var(--bg-info-subtle)", border: "1px solid var(--status-info)" }} role="note">
      <div className="flex items-start gap-2">
        <Info className="mt-px size-4 shrink-0" style={{ color: "var(--fg-neutral-emphasis)" }} aria-hidden />
        <div className="min-w-px flex-1 text-xs font-semibold" style={{ color: "var(--fg-neutral-emphasis)" }}>This headset isn't on your IT team's approved list.</div>
        <button type="button" onClick={dismiss} aria-label="Dismiss"
          className="-my-0.5 flex size-5 shrink-0 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-info-subtle-hovered)]"
          style={{ color: "var(--fg-neutral-muted)" }}>
          <X className="size-3.5" />
        </button>
      </div>
      <div className="mt-1 text-xs leading-snug" style={{ color: "var(--fg-neutral-muted)" }}>
        It'll still work, but your IT team recommends an approved headset for the best call quality.
      </div>
    </div>
  )
}
