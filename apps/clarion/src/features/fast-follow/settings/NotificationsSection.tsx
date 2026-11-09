import { useEffect, useMemo, useState } from "react"
import { Mail } from "lucide-react"
import {
  Alert, AlertDescription, Button, Card, CardContent, CardDescription, CardHeader, CardHeaderText, CardTitle,
  Checkbox, Field, FieldControl, FieldDescription, FieldLabel, FieldOption, Input, NumberInput, TagsInput,
} from "@ir/ui"
import { useViewer } from "@/lib/viewer"
import { activeGroups } from "../alerts/groups"
import { IR_DEFAULT_NOTIFY, saveNotify, savedLine, useSettings, type NotifySettings } from "./store"
import { SectionFooter } from "./SectionFooter"
import { EmailPreview } from "./EmailPreview"

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)
const clock = (minAgo: number) => new Date(Date.now() - minAgo * 60000).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })

/**
 * Settings › Notifications. Send to IT routing (unchanged) and proactive
 * notifications (new): opt-in, a recipient list, rules for what's significant
 * enough to email, and a cooldown. Works for Telemetry-only tenants too.
 */
export function NotificationsSection({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const settings = useSettings()
  const { person } = useViewer()
  const [draft, setDraft] = useState<NotifySettings>(settings.notify)
  const [itReports, setItReports] = useState(settings.itReports)
  const [preview, setPreview] = useState(false)
  const [testSent, setTestSent] = useState<string | null>(null)
  const dirty = JSON.stringify(draft) !== JSON.stringify(settings.notify) || itReports !== settings.itReports
  const set = (patch: Partial<NotifySettings>) => { setDraft((d) => ({ ...d, ...patch })); setTestSent(null); setConfirmation(null) }
  const [confirmation, setConfirmation] = useState<string | null>(null)
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])

  // what these rules would have done today — the rule made concrete
  const example = useMemo(() => {
    const crit = activeGroups().filter((g) => g.severity === "critical")
    const hits = crit.filter((g) => g.endpoints.length >= draft.minEndpoints || g.firstSeenMinAgo > draft.minMinutes)
    const biggest = [...crit].sort((a, b) => b.endpoints.length - a.endpoints.length)[0] ?? null
    return { hits, biggest }
  }, [draft.minEndpoints, draft.minMinutes])
  const noRecipients = draft.recipients.length === 0

  return (
    <div className="flex w-full max-w-content-reading flex-col gap-gutter">
      <Card size="sm">
        <CardHeader>
          <CardHeaderText>
            <CardTitle>Send to IT reports</CardTitle>
            <CardDescription>Where reports go when an agent uses Send to IT in the widget. Unchanged.</CardDescription>
          </CardHeaderText>
        </CardHeader>
        <CardContent>
          <Field invalid={!!itReports && !isEmail(itReports)}>
            <FieldLabel>Report address</FieldLabel>
            <FieldControl><Input type="email" value={itReports} onChange={(e) => { setItReports(e.target.value); setConfirmation(null) }} /></FieldControl>
            <FieldDescription>One address, usually your service desk's.</FieldDescription>
          </Field>
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardHeaderText>
            <CardTitle>Proactive notifications</CardTitle>
            <CardDescription>Clarion emails these addresses when an alert group is significant, so your team hears about it without watching Fleet-view. Works for Telemetry-only tenants too.</CardDescription>
          </CardHeaderText>
        </CardHeader>
        <CardContent className="flex flex-col gap-gutter">
          <FieldOption control={<Checkbox checked={draft.enabled} onCheckedChange={(v) => set({ enabled: v === true })} />}
            description="Nothing is emailed until at least one recipient is added.">
            Send proactive notifications
          </FieldOption>

          <Field disabled={!draft.enabled}>
            <FieldLabel>Recipients</FieldLabel>
            <FieldControl>
              <TagsInput value={draft.recipients} onValueChange={(v) => set({ recipients: v })} validate={isEmail} placeholder="Add an email address and press Enter" />
            </FieldControl>
            <FieldDescription>Counts and locations only. Agent and machine names stay in Clarion, behind sign-in.</FieldDescription>
          </Field>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" disabled={!draft.enabled || noRecipients}
              onClick={() => setTestSent(draft.recipients.join(", "))}>
              <Mail aria-hidden /> Send test email
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setPreview(true)}>Preview the email</Button>
          </div>
          {testSent && (
            <Alert variant="success" onDismiss={() => setTestSent(null)} dismissLabel="Dismiss">
              <AlertDescription>Test email sent to {testSent}. It can take a minute to arrive.</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card size="sm">
        <CardHeader>
          <CardHeaderText>
            <CardTitle>When to email</CardTitle>
            <CardDescription>A Critical alert group triggers an email when it meets either rule. Critical groups only in this release.</CardDescription>
          </CardHeaderText>
        </CardHeader>
        <CardContent className="@container flex flex-col gap-gutter">
          <div className="grid gap-gutter @xl:grid-cols-2">
            <Field disabled={!draft.enabled}>
              <FieldLabel>Endpoints affected, at least</FieldLabel>
              <FieldControl><NumberInput min={1} max={5000} value={draft.minEndpoints} onValueChange={(v) => set({ minEndpoints: v ?? 1 })} /></FieldControl>
              <FieldDescription>A widespread problem.</FieldDescription>
            </Field>
            <Field disabled={!draft.enabled}>
              <FieldLabel>Or Critical for longer than (minutes)</FieldLabel>
              <FieldControl><NumberInput min={1} max={1440} value={draft.minMinutes} onValueChange={(v) => set({ minMinutes: v ?? 1 })} /></FieldControl>
              <FieldDescription>A problem that isn't going away.</FieldDescription>
            </Field>
          </div>
          <Field disabled={!draft.enabled}>
            <FieldLabel>Don't email the same group again for (minutes)</FieldLabel>
            <FieldControl><NumberInput min={5} max={1440} step={5} value={draft.cooldownMin} onValueChange={(v) => set({ cooldownMin: v ?? 60 })} /></FieldControl>
            <FieldDescription>The cooldown stops a growing group from emailing again and again.</FieldDescription>
          </Field>
          <Alert variant="info">
            <AlertDescription>
              {!draft.enabled || noRecipients
                ? "With notifications off, nothing would be emailed."
                : example.hits.length === 0
                  ? "With these rules, none of today's Critical groups would have emailed."
                  : `With these rules, today's ${example.hits.map((g) => `${g.title} (${clock(Math.max(1, g.firstSeenMinAgo - 7))})`).join(", ")} would have emailed, once each.`}
            </AlertDescription>
          </Alert>
          <Button variant="link" size="xs" className="self-start" onClick={() => set({ ...IR_DEFAULT_NOTIFY, recipients: draft.recipients, enabled: draft.enabled })}>
            Reset rules to IR defaults
          </Button>
        </CardContent>
      </Card>

      <SectionFooter
        saved={savedLine(settings.saved.notify)}
        dirty={dirty}
        onDiscard={() => { setDraft(settings.notify); setItReports(settings.itReports) }}
        onSave={() => {
          saveNotify(draft, itReports, person.name)
          setConfirmation(draft.enabled && draft.recipients.length
            ? `Saved. Critical groups that meet these rules will email ${draft.recipients.length} recipient${draft.recipients.length === 1 ? "" : "s"}.`
            : "Saved. Proactive notifications are off; nothing will be emailed.")
        }}
        saveLabel="Save notifications"
        confirmation={confirmation}
      />

      <EmailPreview group={example.biggest} rules={draft} open={preview} onOpenChange={setPreview} />
    </div>
  )
}
