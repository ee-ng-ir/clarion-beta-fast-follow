import { useSyncExternalStore } from "react"
import { Eye } from "lucide-react"
import { access, me } from "@ir/mock-data/access"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { thresholdAccess } from "@/data/thresholdRules"

/** People worth switching between on Thresholds — one per kind of access. */
const PEOPLE = ["p2", "p14", "p9", "p3"]

/** Re-renders when the signed-in person (or any access data) changes. */
export function useMe() {
  useSyncExternalStore(access.subscribe, access.version)
  return me()
}

/** Prototype only: switch who is signed in to see how RBAC shapes Thresholds. */
export function ViewAsBar() {
  const id = useMe()
  const acc = thresholdAccess(id)
  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl px-4 py-2.5 text-sm"
      style={{ background: "var(--bg-neutral-subtle)", border: "1px dashed var(--border-neutral-emphasis)" }}>
      <span className="inline-flex items-center gap-1.5 font-medium" style={{ color: "var(--fg-neutral-muted)" }}>
        <Eye className="size-4" /> Prototype · viewing as
      </span>
      <Select value={id} onValueChange={(v) => access.setMe(v)}>
        <SelectTrigger className="h-8 w-48" aria-label="View as"><SelectValue /></SelectTrigger>
        <SelectContent>
          {PEOPLE.map((p) => <SelectItem key={p} value={p}>{access.person(p)?.name ?? p}</SelectItem>)}
        </SelectContent>
      </Select>
      <span style={{ color: "var(--fg-neutral-muted)" }}>{acc.summary}</span>
    </div>
  )
}
