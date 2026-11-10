import { useEffect, useMemo, useState } from "react"
import { X } from "lucide-react"
import {
  Alert, AlertDescription, Badge, Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardHeaderText, CardTitle,
  EmptyState, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import { approvedHeadsets, headsetById, HEADSET_CATALOGUE, useApprovedHeadsets } from "@ir/telemetry"
import { endpoints } from "@/data/endpoints"
import { useViewer } from "@/lib/viewer"
import { headsetFor } from "../headsets/headsets"
import { markHeadsetsSaved, savedLine, useSettings } from "./store"
import { SectionFooter } from "./SectionFooter"

/**
 * Settings › Approved headsets. IT picks the models the company approves from
 * IR's headset list; the list syncs to every widget. Endpoints on other headsets
 * are flagged for review, never blocked (D4). A form with Save (D9).
 */
export function ApprovedHeadsetsSection({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const saved = useApprovedHeadsets()
  const settings = useSettings()
  const { person } = useViewer()
  const [draft, setDraft] = useState<string[]>(saved)
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [requested, setRequested] = useState(false)
  const dirty = draft.slice().sort().join() !== saved.slice().sort().join()
  useEffect(() => { onDirtyChange?.(dirty) }, [dirty, onDirtyChange])

  // endpoints using each model right now
  const usage = useMemo(() => {
    const m = new Map<string, number>()
    for (const e of endpoints) { const h = headsetFor(e); if (h) m.set(h.id, (m.get(h.id) ?? 0) + 1) }
    return m
  }, [])

  const options = HEADSET_CATALOGUE.filter((h) => h.onIrList && !draft.includes(h.id))
    .map((h) => ({ value: h.id, label: h.model, group: h.vendor, detail: h.connection }))
  const add = (ids: string[]) => { if (ids.length) { setConfirmation(null); setDraft((d) => [...d, ...ids.filter((id) => !d.includes(id))]) } }
  const remove = (id: string) => { setConfirmation(null); setDraft((d) => d.filter((x) => x !== id)) }
  const models = draft.map((id) => headsetById(id)).filter((h): h is NonNullable<typeof h> => !!h)
    .sort((a, b) => a.vendor.localeCompare(b.vendor) || a.model.localeCompare(b.model))

  const save = () => {
    approvedHeadsets.set(draft)
    markHeadsetsSaved(person.name)
    setConfirmation(draft.length
      ? `Saved. ${draft.length} approved model${draft.length === 1 ? "" : "s"}. Every endpoint is checked against this list within a few minutes, and widgets show their agents a note if they're on another headset.`
      : "Saved. No approved list: headsets aren't checked or flagged.")
  }

  return (
    <div className="flex w-full max-w-content-reading flex-col gap-gutter">
      <p className="text-body-md text-content-neutral-muted">
        Endpoints using a headset not on this list are flagged for review. Agents aren't blocked: their headset keeps working, and their status doesn't change.
      </p>

      <Card size="sm">
        <CardHeader>
          <CardHeaderText>
            <CardTitle>Approved models · {models.length}</CardTitle>
            <CardDescription>IR provides the models to choose from. Only the models you add here are approved; being on IR's list doesn't approve a model.</CardDescription>
          </CardHeaderText>
          {models.length > 0 && (
            <CardAction><Button variant="link" size="xs" onClick={() => { setConfirmation(null); setDraft([]) }}>Clear all</Button></CardAction>
          )}
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <Select label="Add models from IR's headset list" options={options} value={[]} onValueChange={add} showDetail searchPlaceholder="Search models" emptyText="Every model on IR's list is already approved" className="w-80" />
            <Button variant="link" size="xs" onClick={() => setRequested(true)}>Can't find a model? Request it from IR</Button>
          </div>
          {requested && (
            <Alert variant="info" onDismiss={() => setRequested(false)} dismissLabel="Dismiss">
              <AlertDescription>IR Support adds models to the headset list, usually within two working days. Tell them the make and model; Clarion matches on the USB ID, so the name Windows shows doesn't matter.</AlertDescription>
            </Alert>
          )}

          {models.length === 0 && (
            <EmptyState size="sm" illustration="call-readiness" title="No approved headsets"
              description="Without a list, headsets aren't checked and nothing is flagged. Add the models your company approves." />
          )}
        </CardContent>
        {/* the table sits straight in the card so it runs edge to edge, like every table-in-a-card */}
        {models.length > 0 && (
            <Table size="sm">
              <TableHeader>
                <TableRow>
                  <TableHead align="start">Model</TableHead>
                  <TableHead align="start">Connection</TableHead>
                  <TableHead numeric>In use</TableHead>
                  <TableHead><span className="sr-only">Remove</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((h) => (
                  <TableRow key={h.id}>
                    <TableCell align="start">
                      <div className="flex flex-col gap-1">
                        <span className="text-label-md text-content-neutral-emphasis">{h.model}</span>
                        <span className="flex flex-wrap gap-1">
                          <span className="text-body-xs text-content-neutral-muted">{h.vendor}</span>
                          {h.retired && <Badge color="warning">No longer on IR's headset list</Badge>}
                          {!h.vidPid && <Badge>Can't be checked over Bluetooth</Badge>}
                          {!saved.includes(h.id) && <Badge color="info">Added, not saved yet</Badge>}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell align="start" className="text-content-neutral-muted">{h.connection}</TableCell>
                    <TableCell numeric>{usage.get(h.id) ?? 0}</TableCell>
                    <TableCell align="end">
                      <Button variant="ghost" size="icon-sm" aria-label={`Remove ${h.model}`} onClick={() => remove(h.id)}><X /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
        )}
      </Card>

      <SectionFooter
        saved={savedLine(settings.saved.headsets)}
        dirty={dirty}
        onDiscard={() => { setDraft(saved); setConfirmation(null) }}
        onSave={save}
        saveLabel="Save approved headsets"
        confirmation={confirmation}
      />
    </div>
  )
}
