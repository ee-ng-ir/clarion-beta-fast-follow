import { Badge, Button, Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@ir/ui"
import type { AlertGroup } from "../alerts/groups"
import type { NotifySettings } from "./store"

/**
 * What the service desk receives when a group meets a significance rule.
 * Counts and locations, never agent or machine names (epic rule 7); the same
 * evidence summary as Fleet-view. Shown here for review — the real template
 * belongs in clarion-emails.
 */
export function EmailPreview({ group, rules, open, onOpenChange }: {
  group: AlertGroup | null; rules: NotifySettings; open: boolean; onOpenChange: (o: boolean) => void
}) {
  const g = group
  const n = g?.endpoints.length ?? 0
  const where = g ? g.locations.slice(0, 3).map((l) => `${l.name} (${l.count})`).join(", ") : ""
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Notification email preview</DialogTitle>
          <DialogDescription>Built from today's largest Critical group, with the rules you've set.</DialogDescription>
        </DialogHeader>
        <DialogBody className="flex flex-col gap-3">
          {!g ? (
            <p className="text-body-md text-content-neutral-muted">No Critical group meets these rules right now, so there's nothing to preview.</p>
          ) : (
            <>
              <dl className="flex flex-col gap-1 text-body-sm">
                {[
                  ["From", "Clarion <alerts@clarion.ir.com> (sender to confirm)"],
                  ["To", rules.recipients.join(", ") || "—"],
                  ["Subject", `Clarion · Critical: ${g.title} affecting ${n} endpoints – ${where}`],
                ].map(([k, v]) => (
                  <div key={k} className="flex gap-3"><dt className="w-16 shrink-0 text-content-neutral-muted">{k}</dt><dd className="min-w-0 text-content-neutral-emphasis">{v}</dd></div>
                ))}
              </dl>
              <div className="flex flex-col gap-3 rounded-xl border border-line-neutral-muted bg-surface-app p-4">
                <span className="text-wordmark text-content-neutral-emphasis">Clarion</span>
                <Badge color="danger" className="self-start">Critical</Badge>
                <p className="text-heading-sm text-content-neutral-emphasis">{g.title} is affecting {n} endpoints</p>
                <dl className="flex flex-col gap-2">
                  <div><dt className="text-label-sm text-content-neutral-muted">Where</dt><dd className="text-body-md text-content-neutral-emphasis">{where}{g.locations.length > 3 ? ` and ${g.locations.length - 3} more` : ""}</dd></div>
                  <div><dt className="text-label-sm text-content-neutral-muted">Why you got this</dt><dd className="text-body-md text-content-neutral-emphasis">{g.notifiedReason ?? `${rules.minEndpoints} or more endpoints affected`}</dd></div>
                  <div><dt className="text-label-sm text-content-neutral-muted">What the evidence shows</dt><dd className="text-body-md text-content-neutral-emphasis">{g.evidence}</dd></div>
                </dl>
                <Button size="sm" className="self-start" tabIndex={-1}>View in Clarion</Button>
                <p className="text-body-xs text-content-neutral-muted">
                  Opens this alert group after you sign in. You won't get another email about this group for {rules.cooldownMin} minutes, however much it grows. Agent and machine names aren't included in this email. Same email for Interactive and Telemetry-only tenants.
                </p>
              </div>
            </>
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
