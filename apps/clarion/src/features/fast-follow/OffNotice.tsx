import { Alert, AlertDescription } from "@ir/ui"
import { alertType } from "./alerts/catalogue"
import { alertName } from "./alerts/names"
import { useSettings } from "./settings/store"

const when = (d: Date) => new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" }).format(d)

/**
 * D10: an alert that's off isn't evaluated, so nothing is recorded while it's
 * off. Wherever history shows, say so, so a drop to zero isn't read as a fix.
 * `types`: the alerts in view (empty = all of them).
 */
export function OffNotice({ types = [], className }: { types?: string[]; className?: string }) {
  const { disabledTypes, offSince } = useSettings()
  const off = disabledTypes.filter((id) => !types.length || types.includes(id))
  if (!off.length) return null
  const names = off.map((id) => alertName(alertType(id)))
  const list = names.length > 2 ? `${names.slice(0, -1).join(", ")} and ${names.at(-1)}` : names.join(" and ")
  const since = off.map((id) => offSince[id]).filter(Boolean).sort((a, b) => a!.getTime() - b!.getTime())[0]
  return (
    <Alert variant="info" className={className}>
      <AlertDescription>
        {list} {off.length === 1 ? "alerts are" : "alerts are"} off{since ? ` since ${when(since)}` : ""}. Nothing is recorded while they're off, so counts from then on aren't a sign of improvement.
      </AlertDescription>
    </Alert>
  )
}
