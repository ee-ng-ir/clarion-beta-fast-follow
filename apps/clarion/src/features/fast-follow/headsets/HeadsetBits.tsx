import { Badge, Select } from "@ir/ui"
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
  return <Select showDetail={false} label="Headset" options={filterOptions} value={value} onValueChange={onChange} className="w-44" />
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
 * Endpoint › Devices: a badge on the headset's own row saying whether it's
 * approved. Advisory only: it never changes the endpoint's status (D4).
 * Returns nothing when there's no approved list, or for any other device.
 */
export function HeadsetComplianceBadge({ e, approved, deviceName }: { e: Endpoint; approved: string[]; deviceName: string }) {
  const h = headsetFor(e)
  const c = complianceFor(e, approved)
  if (!h || h.model !== deviceName || c === "no-list" || c === "none") return null
  return <Badge color={complianceBadge[c]} className="shrink-0">{complianceLabel[c]}</Badge>
}
