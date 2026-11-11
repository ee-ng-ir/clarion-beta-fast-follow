import { useEffect } from "react"
import { Badge, Card, CardContent, Switch } from "@ir/ui"
import { toast } from "@/components/ui/toast"
import { cn } from "@/lib/utils"
import { useViewer } from "@/lib/viewer"
import { ALERT_TYPES, categoryLabel, type AlertCategory, type AlertType } from "../alerts/catalogue"
import { alertName } from "../alerts/names"
import { saveTypes, useSettings } from "./store"

const categories: AlertCategory[] = ["network", "system", "platform", "devices"]

/** What each alert watches, in a line: what it is, not what goes wrong. */
const WATCHES: Record<string, string> = {
  "call-quality": "Network quality for calls, from latency, jitter and packet loss.",
  wifi: "How strong the endpoint's Wi-Fi connection is.",
  cpu: "How hard the computer's processor is working.",
  memory: "How much of the computer's memory is in use.",
  storage: "How much free space is left on the disk.",
  battery: "How much charge is left on a laptop.",
  "audio-device": "Whether a headset or speaker is connected and working.",
}
const watches = (t: AlertType) =>
  t.category === "platform" ? `Call quality on ${alertName(t)}, and whether it can be reached.` : WATCHES[t.id] ?? ""

/**
 * Settings › Alerts: a tile per alert with a switch, for every endpoint (canvas
 * option F, after the PO's 11 Nov feedback). On/off only: no counts, no
 * thresholds (they keep their own tab, where admins expect them).
 * A switch applies straight away with an Undo toast, so this tab has no Save bar:
 * the one exception to D9, logged. Off isn't evaluated (D10).
 * `focus` (from Thresholds' "Turn on in Alerts") scrolls to that alert's tile,
 * highlights it and puts focus on its switch.
 * An alert that's off isn't shown greyed out, so it's never mistaken for one
 * you can't change; an "Off" label beside its switch marks it (Ee, 11 Nov).
 * On needs no label: the switch says it, as in most settings UIs.
 */
export function AlertsSection({ focus, onFocused }: { focus?: string | null; onFocused?: () => void }) {
  const settings = useSettings()
  const { person } = useViewer()
  // the tile stays highlighted while `focus` is set; the parent clears it after a moment
  useEffect(() => {
    if (!focus) return
    const tile = document.getElementById(`alert-tile-${focus}`)
    tile?.scrollIntoView({ block: "center" })
    tile?.querySelector<HTMLElement>('[role="switch"]')?.focus({ preventScroll: true })
    const t = window.setTimeout(() => onFocused?.(), 2400)
    return () => window.clearTimeout(t)
  }, [focus, onFocused])

  const toggle = (t: AlertType, on: boolean) => {
    const before = settings.disabledTypes
    const next = on ? before.filter((x) => x !== t.id) : [...before, t.id]
    saveTypes(next, person.name)
    toast({
      variant: on ? "success" : "info",
      title: `${alertName(t)} alerts ${on ? "on" : "off"}`,
      description: on ? "Clarion raises it again from now." : "Agents won't see it in the widget, and no one is emailed about it.",
      action: { label: "Undo", onClick: () => saveTypes(before, person.name) },
    })
  }

  return (
    <div className="@container flex w-full flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-heading-sm text-content-neutral-emphasis">Alerts</h2>
        <p className="text-body-md text-content-neutral-muted">Turn an alert on or off for every endpoint.</p>
      </div>

      {categories.map((c) => (
        <section key={c} aria-labelledby={`alert-cat-${c}`} className="flex flex-col gap-3">
          <h3 id={`alert-cat-${c}`} className="text-label-md text-content-neutral-emphasis">{categoryLabel[c]}</h3>
          <div className="grid grid-cols-1 gap-3 @xl:grid-cols-2 @4xl:grid-cols-3">
            {ALERT_TYPES.filter((t) => t.category === c).map((t) => {
              const on = !settings.disabledTypes.includes(t.id)
              const id = `alert-switch-${t.id}`
              return (
                <Card key={t.id} size="sm" id={`alert-tile-${t.id}`}
                  className={cn("transition-shadow", focus === t.id && "ring-2 ring-line-focused")}>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex items-start justify-between gap-3">
                      <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-line-neutral-subtle bg-surface-primary-subtle text-content-primary-emphasis">
                        <t.icon className="size-4" aria-hidden />
                      </span>
                      <span className="flex items-center gap-2">
                        {/* only the exception is labelled: an alert that's off. On is the switch alone */}
                        {!on && <Badge aria-hidden>Off</Badge>}
                        <Switch id={id} checked={on} onCheckedChange={(v) => toggle(t, v)} aria-describedby={`${id}-desc`} />
                      </span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor={id} className="text-label-lg text-content-neutral-emphasis">{alertName(t)}</label>
                      <p id={`${id}-desc`} className="text-body-sm text-content-neutral-muted">{watches(t)}</p>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>
      ))}
    </div>
  )
}
