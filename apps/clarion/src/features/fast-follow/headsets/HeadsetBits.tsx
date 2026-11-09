import { Alert, AlertDescription, AlertTitle, Badge, Select } from "@ir/ui"
import { complianceLabel, type Compliance } from "@ir/telemetry"
import type { Endpoint } from "@/data/endpoints"
import { complianceBadge, complianceFor, headsetFor } from "./headsets"

const filterOptions: { value: Compliance; label: string }[] = [
  { value: "approved", label: "Approved" },
  { value: "not-approved", label: "Not approved" },
  { value: "not-checked", label: "Not checked (Bluetooth)" },
  { value: "none", label: "No headset" },
]

/** Endpoints toolbar: filter by headset compliance. Only offered once an approved list exists. */
export function HeadsetFilter({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return <Select label="Headset" options={filterOptions} value={value} onValueChange={onChange} className="w-44" />
}

/** Endpoints table cell: the model, and whether it's approved. */
export function HeadsetCell({ e, approved }: { e: Endpoint; approved: string[] }) {
  const h = headsetFor(e)
  const c = complianceFor(e, approved)
  return (
    <div className="flex min-w-0 flex-col gap-1">
      {c !== "no-list" && <Badge color={complianceBadge[c]} className="self-start">{complianceLabel[c]}</Badge>}
      <span className="truncate text-body-xs text-content-neutral-muted">{h ? `${h.model} · ${h.connection}` : "No headset connected"}</span>
    </div>
  )
}

/**
 * Endpoint › Devices: the headset and its compliance, in words. Advisory only:
 * it never changes the endpoint's status (D4).
 */
export function HeadsetCompliance({ e, approved }: { e: Endpoint; approved: string[] }) {
  const h = headsetFor(e)
  const c = complianceFor(e, approved)
  if (c === "no-list") return null
  const copy: Record<Exclude<Compliance, "no-list">, { variant: "success" | "warning" | "info"; title: string; body: string }> = {
    approved: { variant: "success", title: `${h?.model} is approved`, body: `Matched to your IT team's approved list by its USB ID (${h?.vidPid}).` },
    "not-approved": { variant: "warning", title: `${h?.model} isn't on your approved list`,
      body: `${h?.onIrList ? "It's on IR's headset list, but your IT team hasn't approved it." : "It isn't on IR's headset list either."} The agent sees a note in the widget. The headset keeps working, and the endpoint's status doesn't change.` },
    "not-checked": { variant: "info", title: `${h?.model} can't be checked`, body: "Bluetooth headsets don't report a USB ID, so Clarion can't match them to the list. The agent sees no note." },
    none: { variant: "info", title: "No headset connected", body: "Nothing to check. A missing headset is its own alert, separate from compliance." },
  }
  const t = copy[c]
  return (
    <Alert variant={t.variant} className="mb-4">
      <AlertTitle>{t.title}</AlertTitle>
      <AlertDescription>{t.body}</AlertDescription>
    </Alert>
  )
}
