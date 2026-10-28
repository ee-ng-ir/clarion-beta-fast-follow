import { useState } from "react"
import {
  Alert, AlertDescription, Button,
  Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
  FieldOption, Radio, RadioGroup,
} from "@ir/ui"
import { access, whoSees, widgetUsersIn } from "@ir/mock-data/access"
import type { Target } from "@/components/admin/widget-users/dialogs"

/**
 * Proposed (RBAC): put widget users in an Iris location. People whose Clarion role is
 * limited to locations only see users — and their endpoints — in those locations.
 */
export function SetLocationDialog({
  target, onClose, onConfirm, allowed = null,
}: {
  /** RBAC: locations the signed-in person may use. null = all, plus No location. */
  allowed?: string[] | null
  target: Target | null
  onClose: () => void
  onConfirm: (t: Target, locationId: string | null) => void
}) {
  const [value, setValue] = useState<string>("")
  const [lastTarget, setLastTarget] = useState<Target | null>(null)
  if (target !== lastTarget) {
    setLastTarget(target)
    const ids = new Set(target?.users.map((u) => u.locationId ?? "none"))
    setValue(ids.size === 1 ? [...ids][0] : "")
  }
  const locs = access.locations().filter((l) => allowed === null || allowed.includes(l.id))
  const n = target?.count ?? 0
  const chosen = value === "none" ? null : value
  const who = chosen ? whoSees(chosen) : null

  return (
    <Dialog open={!!target} onOpenChange={(o) => { if (!o) onClose() }}>
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>Set location for {target?.label}</DialogTitle>
          <DialogDescription>Decides who can see {n === 1 ? "them and their endpoints" : "these users and their endpoints"} in Clarion.</DialogDescription>
        </DialogHeader>
        <DialogBody className="max-h-[60vh] gap-4 overflow-y-auto">
          <RadioGroup value={value} onValueChange={setValue} className="gap-2">
            {locs.map((l) => (
              <FieldOption key={l.id} control={<Radio value={l.id} />} description={`${widgetUsersIn(l.id).toLocaleString()} widget users`}>{l.name}</FieldOption>
            ))}
            {allowed === null && <FieldOption control={<Radio value="none" />} description="Only people with access to all locations see them.">No location</FieldOption>}
          </RadioGroup>
          {who && (
            <Alert variant="info">
              <AlertDescription>
                {who.groups.length || who.people.length
                  ? `Also visible to ${[...who.groups.map((g) => g.name), ...(who.people.length ? [`${who.people.length} ${who.people.length === 1 ? "person" : "people"} directly`] : [])].join(", ")}.`
                  : "Nobody is limited to this location yet, so only people with access to all locations will see them."}
              </AlertDescription>
            </Alert>
          )}
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button disabled={!value} onClick={() => target && onConfirm(target, chosen)}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
