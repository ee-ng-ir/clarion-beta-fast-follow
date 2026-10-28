import { useEffect, useRef, useState, type ReactNode } from "react"
import { Plus, Trash2, ShieldCheck, KeyRound, Users, Send, ExternalLink, ChevronDown } from "lucide-react"
import {
  Badge, Button,
  Card, CardContent, CardFooter, CardHeader,
  Checkbox, Field, FieldControl, FieldDescription, FieldLabel, FieldOption,
  FileUpload, FileUploadItem, Input, Loader, PasswordInput,
  Radio, RadioGroup, SegmentedControl, SegmentedControlItem,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Textarea,
} from "@ir/ui"
import { toast } from "@/components/ui/toast"
import { cnPicasso as cn } from "@/lib/utils"
import { users } from "@ir/mock-data/users"
import { access, accessLine, assignmentLabel, groupsOf, me } from "@ir/mock-data/access"
import {
  providers, providerById, connectMethodLabel, activeMembers, setupSteps,
  type ProviderId, type ConnectMethod,
} from "@/data/sso"
import { Rich, CopyField, Callout, SetupStepper, TipCard, DetailList, SectionTitle } from "./parts"
import { CertificateUpload, EXAMPLE_CERT, type CertInfo } from "./CertificateUpload"

// ---- Types shared with the page ---------------------------------------------

export type SsoMode = "optional" | "required"
export type NewUserRule = "invited" | "anyone"

/** An IdP group, and the Iris group it puts people in. The Iris group carries the access:
 *  tenant roles, Clarion, Vantage, any product. "" = not chosen yet. */
export interface GroupRule { id: string; value: string; label?: string; group: string }

export interface SsoDraft {
  step: number
  providerId: ProviderId | null
  addConfirmed: boolean
  connectMethod: ConnectMethod | "oidc" | null
  connected: boolean
  attributes: { email: string; firstName: string; lastName: string; groups: string }
  groupRules: GroupRule[]
  groupsEnabled: boolean
  newUsers: NewUserRule
  tested: boolean
  mode: SsoMode
}

export const emptyDraft: SsoDraft = {
  step: 0,
  providerId: null,
  addConfirmed: false,
  connectMethod: null,
  connected: false,
  attributes: { email: "", firstName: "", lastName: "", groups: "" },
  groupRules: [],
  groupsEnabled: false,
  newUsers: "invited",
  tested: false,
  mode: "optional",
}

type Provider = ReturnType<typeof providerById>

const TURN_ON = setupSteps.length // index of the final "Turn on SSO" screen
const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms))
let ruleSeq = 0
const newRuleId = () => `g${++ruleSeq}`

/** Fresh provider-specific defaults, applied when the provider changes. */
function forProvider(d: SsoDraft, id: ProviderId): SsoDraft {
  const p = providerById(id)
  return {
    ...d,
    providerId: id,
    addConfirmed: false,
    connectMethod: p.connectDefault,
    connected: false,
    tested: false,
    attributes: {
      email: p.attributes.email,
      firstName: p.attributes.firstName,
      lastName: p.attributes.lastName,
      groups: p.attributes.groups ?? "",
    },
    groupsEnabled: p.groupMode !== "limited",
    groupRules: p.groupExamples.map((g) => ({ id: newRuleId(), ...g })),
  }
}

/** A choice drawn as a card (provider, sign-in mode). */
function ChoiceCard({ selected, onSelect, dashed, children }: { selected: boolean; onSelect: () => void; dashed?: boolean; children: ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className={cn(
        "flex min-h-28 flex-col items-start gap-3 rounded-lg border p-4 text-start transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-line-focused focus-visible:ring-offset-2 focus-visible:ring-offset-surface-app",
        selected
          ? "border-line-primary-emphasis bg-surface-primary-subtle ring-1 ring-line-primary-emphasis"
          : cn("border-line-neutral-emphasis bg-surface-card hover:bg-surface-neutral-subtle-hovered", dashed && "border-dashed"),
      )}
    >
      {children}
    </button>
  )
}

// ---- Wizard -------------------------------------------------------------------

export function SsoWizard({
  initial,
  onExit,
  onComplete,
  onChange,
  onSendLink,
  delegate,
}: {
  initial: SsoDraft
  /** Save and exit — the page keeps the draft so setup can resume. */
  onExit: (draft: SsoDraft) => void
  /** Admin: turn SSO on. Delegate: hand the tested setup back to the Admin. */
  onComplete: (draft: SsoDraft) => void
  /** Called on every change, so a shared setup's progress is visible to the Admin. */
  onChange?: (draft: SsoDraft) => void
  /** Admin only: hand setup to someone else. Hidden when absent. */
  onSendLink?: (draft: SsoDraft) => void
  /**
   * Set when someone outside Iris (usually IT) is filling this in from a setup
   * link. They can connect and test, but turning SSO on stays with an Admin.
   */
  delegate?: { adminName: string }
}) {
  const [d, setD] = useState<SsoDraft>(initial)
  const onChangeRef = useRef(onChange)
  onChangeRef.current = onChange
  useEffect(() => { onChangeRef.current?.(d) }, [d])
  const set = (patch: Partial<SsoDraft>) => setD((x) => ({ ...x, ...patch }))
  const provider = d.providerId ? providerById(d.providerId) : null
  const topRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    topRef.current?.scrollIntoView({ block: "start", behavior: "smooth" })
  }, [d.step])

  const canContinue = [
    d.providerId !== null,
    d.addConfirmed,
    d.connected,
    d.attributes.email.trim() !== "",
    d.tested,
  ][d.step] ?? true

  const goto = (step: number) => set({ step })
  const lastSetupStep = setupSteps.length - 1

  // One tip per step, about the step in front of you.
  const tip: ReactNode =
    d.step === 0 ? (
      <TipCard title="Why we ask">
        Each provider names the same settings differently. Choosing yours means the next steps use the words you'll see on its screens.
      </TipCard>
    ) : provider && d.step === 1 ? <TipCard title={provider.addTip.title}><Rich text={provider.addTip.body} /></TipCard>
    : provider && d.step === 2 ? <TipCard title={provider.connectTip.title}><Rich text={provider.connectTip.body} /></TipCard>
    : provider && d.step === 3 ? <TipCard title={provider.mapTip.title}><Rich text={provider.mapTip.body} /></TipCard>
    : d.step === 4 ? (
      delegate ? (
        <TipCard title={`${delegate.adminName} turns it on`}>
          Once the test passes, hand the setup back. An Iris Admin reviews it and chooses whether SSO is optional or required.
        </TipCard>
      ) : (
        <TipCard title="The test is safe">
          It only signs in the person running it, doesn't create a session, and doesn't change anything for other Members.
        </TipCard>
      )
    ) : d.step === TURN_ON ? (
      <TipCard title="Start with Optional">
        Let people try SSO alongside their passwords for a week, then switch to Required from the SSO page.
      </TipCard>
    ) : null

  // Layout: the task is the card; help sits beside it, outside the card, from
  // xl up. Narrower than that there's no room for a rail, so the tip drops
  // into the card under the step it explains. "Send setup link" applies to
  // the whole setup, so it lives in the card header, not in a tip.
  return (
    <div ref={topRef} className="flex scroll-mt-4 flex-col items-start gap-gutter xl:flex-row">
    <Card className="w-full min-w-0 flex-1 overflow-hidden">
      <CardHeader className="flex-col gap-3 border-b border-line-neutral-muted px-5 pt-4 pb-4">
        <div className="flex w-full flex-wrap items-center gap-2">
          <KeyRound aria-hidden className="size-4 text-content-neutral-muted" />
          <span className="text-label-md text-content-neutral-emphasis">
            {d.step === TURN_ON ? "Turn on single sign-on" : "Set up single sign-on"}
          </span>
          {provider && d.step > 0 && <Badge className="ms-1">{provider.name}</Badge>}
          {!delegate && onSendLink && d.step < TURN_ON && (
            <Button variant="ghost" size="sm" className="ms-auto" onClick={() => onSendLink(d)}>
              <Send aria-hidden /> Send to someone else
            </Button>
          )}
        </div>
        {d.step < TURN_ON && <SetupStepper steps={setupSteps} current={d.step} />}
      </CardHeader>

      <CardContent className="p-5">
        <section className="flex min-w-0 flex-col gap-5">
          {d.step === 0 && <StepProvider value={d.providerId} onChange={(id) => setD((x) => forProvider(x, id))} />}
          {d.step === 1 && provider && <StepAdd p={provider} confirmed={d.addConfirmed} onConfirm={(v) => set({ addConfirmed: v })} />}
          {d.step === 2 && provider && (
            <StepConnect
              p={provider}
              method={d.connectMethod ?? provider.connectDefault}
              onMethod={(m) => set({ connectMethod: m, connected: false })}
              connected={d.connected}
              onConnected={(v) => set({ connected: v, tested: false })}
            />
          )}
          {d.step === 3 && provider && <StepMap p={provider} d={d} set={set} />}
          {d.step === 4 && provider && <StepTest p={provider} d={d} passed={d.tested} onResult={(ok) => set({ tested: ok })} onFix={goto} />}
          {d.step === TURN_ON && provider && <StepTurnOn p={provider} mode={d.mode} onMode={(m) => set({ mode: m })} />}
          {tip && <div className="xl:hidden">{tip}</div>}
        </section>
      </CardContent>

      <CardFooter className="flex-wrap justify-between gap-3 border-t border-line-neutral-muted px-5 pt-4 pb-4">
        {d.step === 0 && delegate ? <span /> : (
          <Button variant="ghost" onClick={() => (d.step === 0 ? onExit(d) : goto(d.step - 1))}>
            {d.step === 0 ? "Cancel" : "Back"}
          </Button>
        )}
        <div className="flex flex-wrap items-center gap-2">
          {d.step < TURN_ON && <span className="hidden pe-1 text-body-xs text-content-neutral-muted md:inline">Progress saves automatically</span>}
          {d.step < TURN_ON && <Button variant="outline" onClick={() => onExit(d)}>{delegate ? "Save for later" : "Save and exit"}</Button>}
          {delegate && d.step === lastSetupStep ? (
            <Button disabled={!canContinue} onClick={() => onComplete(d)}>
              <Send aria-hidden /> Hand back to {delegate.adminName}
            </Button>
          ) : d.step < TURN_ON ? (
            <Button disabled={!canContinue} onClick={() => goto(d.step + 1)}>
              {d.step === 4 ? "Continue to turn on" : d.step === 3 ? "Continue to test" : "Continue"}
            </Button>
          ) : (
            <Button onClick={() => onComplete(d)}>
              <ShieldCheck aria-hidden /> Turn on SSO{d.mode === "required" ? " (required)" : ""}
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
    {tip && <aside aria-label="Help for this step" className="hidden w-72 shrink-0 xl:sticky xl:top-0 xl:block">{tip}</aside>}
    </div>
  )
}

// ---- Step 2: choose provider --------------------------------------------------

function StepProvider({ value, onChange }: { value: ProviderId | null; onChange: (id: ProviderId) => void }) {
  return (
    <>
      <SectionTitle sub="It's the system your staff use to sign in to their work apps. We'll word the next steps to match its screens.">
        Which identity provider do you use?
      </SectionTitle>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {providers.map((p) => (
          <ChoiceCard key={p.id} selected={p.id === value} onSelect={() => onChange(p.id)} dashed={p.generic}>
            <span className="flex w-full items-center justify-between gap-2">
              <span aria-hidden className="flex size-9 items-center justify-center rounded-md border border-line-neutral-muted bg-surface-neutral-subtle text-label-sm text-content-neutral-muted">
                {p.generic ? <KeyRound className="size-4" /> : p.short.slice(0, 2)}
              </span>
              {p.mostCommon && <Badge color="info">Most common</Badge>}
            </span>
            <span className="flex flex-col gap-0.5">
              <span className="text-label-md text-content-neutral-emphasis">{p.name}</span>
              <span className="text-body-xs text-content-neutral-muted">{p.blurb} · {p.protocol}</span>
            </span>
          </ChoiceCard>
        ))}
      </div>
      <Callout tone="info" title="Not sure which one?">
        Ask whoever manages staff sign-in, usually IT or the identity team, or send them the setup link.
      </Callout>
    </>
  )
}

// ---- Step 3: add Iris to the provider ----------------------------------------

function OrderedSteps({ items, start = 1 }: { items: string[]; start?: number }) {
  if (!items.length) return null
  return (
    <ol start={start} className="flex list-decimal flex-col gap-1.5 ps-5 text-body-md text-content-neutral-muted">
      {items.map((s) => <li key={s} className="ps-1"><Rich text={s} /></li>)}
    </ol>
  )
}

function StepAdd({ p, confirmed, onConfirm }: { p: Provider; confirmed: boolean; onConfirm: (v: boolean) => void }) {
  const callout = p.addCallout && (
    <Callout tone={p.addCallout.tone} title={p.addCallout.title}><Rich text={p.addCallout.body} /></Callout>
  )
  const calloutFirst = !!p.addStepsAfter // Google: download metadata before pasting ours

  return (
    <>
      <SectionTitle sub={p.addIntro}>Add Iris to {p.short}</SectionTitle>
      <OrderedSteps items={p.addSteps} />
      {calloutFirst && callout}
      {p.addStepsAfter && <OrderedSteps items={p.addStepsAfter} start={p.addSteps.length + 1} />}

      <Card size="sm" className="shadow-none">
        <CardContent>
          {p.offerSpMetadata && (
            <div className="flex flex-col gap-3 border-b border-line-neutral-muted pb-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-body-sm text-content-neutral-muted">
                <strong className="font-medium text-content-neutral-emphasis">Quickest:</strong> if your provider can import an app from a link or file, give it Iris's metadata.
              </p>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" onClick={() => toast({ title: "Metadata link copied", variant: "success" })}>Copy metadata link</Button>
                <Button variant="outline" size="sm" onClick={() => toast({ title: "iris-metadata.xml downloaded", description: "Stubbed in prototype.", variant: "info" })}>Download XML</Button>
              </div>
            </div>
          )}
          {p.spFields.map((f) => (
            <CopyField key={f.label} label={f.label} hint={f.irisName} aka={f.aka} value={f.value} />
          ))}
          {p.spSettings && (
            <div className="flex flex-wrap gap-x-6 gap-y-1 text-body-sm">
              {p.spSettings.map(([k, v]) => (
                <span key={k}><span className="text-content-neutral-muted">{k}:</span> <span className="font-medium text-content-neutral-emphasis">{v}</span></span>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {p.addTable && (
        <div className="flex flex-col gap-2">
          <p className="text-body-md text-content-neutral-muted"><Rich text={p.addTable.intro} /></p>
          <div className="overflow-hidden rounded-lg border border-line-neutral-muted">
            <Table size="sm">
              <TableHeader>
                <TableRow>
                  <TableHead align="start" className="border-t-0">{p.addTable.head[0]}</TableHead>
                  <TableHead align="start" className="border-t-0">{p.addTable.head[1]}</TableHead>
                  <TableHead align="start" className="w-28 border-t-0"><span className="sr-only">Requirement</span></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {p.addTable.rows.map(([a, b, req]) => (
                  <TableRow key={a + b} className="last:border-b-0">
                    <TableCell className="font-mono text-code-sm">{a}</TableCell>
                    <TableCell>{b}</TableCell>
                    <TableCell className="text-content-neutral-muted">{req}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {p.addTable.foot && <p className="text-body-md text-content-neutral-muted"><Rich text={p.addTable.foot} /></p>}
        </div>
      )}

      {!calloutFirst && callout}

      <FieldOption control={<Checkbox checked={confirmed} onCheckedChange={(v) => onConfirm(v === true)} />}>
        {p.addConfirm}
      </FieldOption>
    </>
  )
}

// ---- Step 4: connect the provider -------------------------------------------

function StepConnect({
  p, method, onMethod, connected, onConnected,
}: {
  p: Provider
  method: ConnectMethod | "oidc"
  onMethod: (m: ConnectMethod) => void
  connected: boolean
  onConnected: (v: boolean) => void
}) {
  const [busy, setBusy] = useState(false)
  const [showErrors, setShowErrors] = useState(false)
  const [url, setUrl] = useState(p.urlExample ?? "")
  const [file, setFile] = useState<{ name: string; size: number } | null>(connected && method === "file" ? { name: p.fileName ?? "metadata.xml", size: 4180 } : null)
  const [manual, setManual] = useState({ sso: "", issuer: "", cert: "" })
  const [certFile, setCertFile] = useState<CertInfo | null>(null)
  const certMeta = p.cert ?? { fileName: "certificate.cer", where: "", subject: `${p.name} signing certificate` }
  const [oidc, setOidc] = useState({ issuer: "https://login.acme.com", clientId: "", secret: "" })

  const run = async () => {
    setBusy(true)
    await wait(1000)
    setBusy(false)
    onConnected(true)
  }

  const ready =
    method === "url" ? url.trim().startsWith("https://")
      : method === "file" ? !!file
      : method === "manual" ? manual.sso.startsWith("https://") && !!manual.issuer && manual.cert.includes("BEGIN CERTIFICATE")
      : !!oidc.issuer && !!oidc.clientId && !!oidc.secret

  const pickFile = async (f: { name: string; size: number }) => { setFile(f); await run() }

  return (
    <>
      <SectionTitle sub={`Give Iris ${p.short}'s sign-in details so it can send your staff there and trust what comes back.`}>
        Connect {p.short} to Iris
      </SectionTitle>

      {method !== "oidc" && (
        <div className="flex flex-col gap-1.5">
          <SegmentedControl
            aria-label={`How to add ${p.short}'s details`}
            value={method}
            onValueChange={(m) => { onMethod(m as ConnectMethod); setShowErrors(false) }}
          >
            {p.connectMethods.map((m) => (
              <SegmentedControlItem key={m} value={m}>{connectMethodLabel[m]}</SegmentedControlItem>
            ))}
          </SegmentedControl>
          {p.id === "google" && method === "file" && (
            <span className="text-body-xs text-content-neutral-subtle">Selected for you: Google Workspace gives a file, not a link.</span>
          )}
        </div>
      )}

      {method === "url" && (
        <Field>
          <FieldLabel>{p.urlLabel ?? "Metadata URL"}</FieldLabel>
          <div className="flex gap-2">
            <FieldControl>
              <Input value={url} onChange={(e) => { setUrl(e.target.value); onConnected(false) }} placeholder="https://" className="font-mono text-code-sm" />
            </FieldControl>
            <Button variant="outline" disabled={!ready} loading={busy} onClick={run}>Fetch</Button>
          </div>
          {p.urlWhere && <FieldDescription><Rich text={p.urlWhere} /></FieldDescription>}
        </Field>
      )}

      {method === "file" && (
        <div className="flex flex-col gap-2">
          <Field>
            <FieldLabel>Metadata file</FieldLabel>
            <FieldControl>
              <FileUpload accept=".xml,application/xml,text/xml" placeholder="Choose the .xml file you downloaded" onFilesChange={(fs) => fs[0] && pickFile({ name: fs[0].name, size: fs[0].size })} />
            </FieldControl>
            <FieldDescription>
              {p.fileWhere && <><Rich text={p.fileWhere} />. </>}
              No file to hand?{" "}
              <Button variant="link" size="xs" className="h-auto p-0" onClick={() => pickFile({ name: p.fileName ?? "metadata.xml", size: 4180 })}>Use the example file</Button>
            </FieldDescription>
          </Field>
          {file && (
            <FileUploadItem name={file.name} size={file.size} onRemove={() => { setFile(null); onConnected(false) }} />
          )}
          {busy && <span className="flex items-center gap-2 text-body-sm text-content-neutral-muted"><Loader size="4" /> Reading file…</span>}
        </div>
      )}

      {method === "manual" && (
        <Card size="sm" className="shadow-none">
          <CardContent>
            <Field>
              <FieldLabel>Sign-in URL</FieldLabel>
              <FieldControl>
                <Input value={manual.sso} placeholder="https://" onChange={(e) => { setManual({ ...manual, sso: e.target.value }); onConnected(false) }} className="font-mono text-code-sm" />
              </FieldControl>
              <FieldDescription>Also called: SSO URL · Login URL · Single Sign-On Service URL</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Issuer</FieldLabel>
              <FieldControl>
                <Input value={manual.issuer} onChange={(e) => { setManual({ ...manual, issuer: e.target.value }); onConnected(false) }} className="font-mono text-code-sm" />
              </FieldControl>
              <FieldDescription>Also called: IdP Entity ID · Identity Provider Issuer · Identifier</FieldDescription>
            </Field>
            <div className="flex flex-col gap-2">
              <span className="text-label-md text-content-neutral-emphasis">Signing certificate</span>
              <span className="text-body-xs text-content-neutral-muted">Also called: X.509 certificate · Token signing certificate. Upload the file, or paste its contents.</span>
              <CertificateUpload
                value={certFile}
                subject={certMeta.subject}
                fileName={certMeta.fileName}
                where={certMeta.where || undefined}
                onChange={(c) => { setCertFile(c); setManual((m) => ({ ...m, cert: c?.text ?? "" })); onConnected(false) }}
              />
              {!certFile && (
                <Field>
                  <FieldLabel>Or paste it</FieldLabel>
                  <FieldControl>
                    <Textarea rows={3} value={manual.cert} placeholder="-----BEGIN CERTIFICATE-----" onChange={(e) => { setManual({ ...manual, cert: e.target.value }); onConnected(false) }} className="font-mono text-code-sm" />
                  </FieldControl>
                </Field>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={!ready} loading={busy} onClick={run}>Check details</Button>
              <Button variant="ghost" onClick={() => { setManual({ sso: p.parsed[0][1], issuer: p.parsed[1][1], cert: EXAMPLE_CERT }); setCertFile({ name: certMeta.fileName, size: 1672, subject: certMeta.subject, expires: "14 Mar 2029", text: EXAMPLE_CERT }) }}>Fill example values</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {method === "oidc" && (
        <Card size="sm" className="shadow-none">
          <CardContent>
            <Field>
              <FieldLabel>Issuer URL</FieldLabel>
              <FieldControl>
                <Input value={oidc.issuer} onChange={(e) => { setOidc({ ...oidc, issuer: e.target.value }); onConnected(false) }} className="font-mono text-code-sm" />
              </FieldControl>
              <FieldDescription>Also called: Discovery URL · Authority · Domain. The address before /.well-known/openid-configuration.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Client ID</FieldLabel>
              <FieldControl>
                <Input value={oidc.clientId} placeholder="Paste from your provider" onChange={(e) => { setOidc({ ...oidc, clientId: e.target.value }); onConnected(false) }} className="font-mono text-code-sm" />
              </FieldControl>
              <FieldDescription>Also called: Application ID · App ID</FieldDescription>
            </Field>
            <Field>
              <FieldLabel>Client secret</FieldLabel>
              <FieldControl>
                <PasswordInput value={oidc.secret} onChange={(e) => { setOidc({ ...oidc, secret: e.target.value }); onConnected(false) }} className="font-mono text-code-sm" />
              </FieldControl>
              <FieldDescription>Stored encrypted. After you save, Iris only shows the last 4 characters.</FieldDescription>
            </Field>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={!ready} loading={busy} onClick={run}>Check details</Button>
              <Button variant="ghost" onClick={() => setOidc({ ...oidc, clientId: "0oa7f2k9xQ", secret: "s3cr3t-example-value" })}>Fill example values</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {connected && (
        <div className="flex flex-col gap-2">
          <Callout tone="success" title={`Connected to ${p.short}`}>
            {method === "url" || method === "oidc"
              ? "Iris re-reads these settings, so certificate and key changes are picked up automatically."
              : "Check these match the app you created."}
          </Callout>
          <div className="rounded-lg border border-line-neutral-muted px-4 py-1">
            <DetailList
              rows={[
                ...p.parsed,
                ...(p.protocol === "SAML 2.0"
                  ? [["Signing certificate", <span className="flex flex-wrap items-center gap-2 font-sans text-body-sm">Valid until 14 Mar 2029 <Badge color="success" dot>Valid</Badge></span>] as [string, ReactNode]]
                  : []),
              ]}
            />
          </div>
        </div>
      )}

      <div className="flex flex-col gap-2">
        <Button variant="link" size="xs" className="h-auto w-fit p-0" onClick={() => setShowErrors((v) => !v)}>
          {showErrors ? "Hide" : "Prototype: preview"} error states
        </Button>
        {showErrors && p.connectErrors.map((e) => (
          <Callout key={e.title} tone={e.tone === "danger" ? "destructive" : "warning"} title={e.title}><Rich text={e.body} /></Callout>
        ))}
      </div>
    </>
  )
}

// ---- Step 5: map user details ------------------------------------------------

function StepMap({ p, d, set }: { p: Provider; d: SsoDraft; set: (patch: Partial<SsoDraft>) => void }) {
  const rows: { key: keyof SsoDraft["attributes"]; label: string; req?: string }[] = [
    { key: "email", label: "Email", req: "Required" },
    { key: "firstName", label: "First name" },
    { key: "lastName", label: "Last name" },
    ...(p.groupMode !== "limited" || d.groupsEnabled ? [{ key: "groups" as const, label: "Groups", req: "Optional" }] : []),
  ]
  const setAttr = (k: keyof SsoDraft["attributes"], v: string) => set({ attributes: { ...d.attributes, [k]: v } })
  const setRule = (id: string, patch: Partial<GroupRule>) =>
    set({ groupRules: d.groupRules.map((r) => (r.id === id ? { ...r, ...patch } : r)) })
  const valueLabel = p.groupMode === "ids" ? "Entra group Object ID" : p.groupMode === "names" ? `${p.short} group name` : "Group value"
  const grid = p.groupMode === "ids" ? "sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)_minmax(0,1.2fr)_auto]" : "sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)_auto]"

  return (
    <>
      <SectionTitle sub={p.mapIntro}>Map user details from {p.short}</SectionTitle>

      <div className="overflow-hidden rounded-lg border border-line-neutral-muted">
        <Table size="sm">
          <TableHeader>
            <TableRow>
              <TableHead align="start" className="w-36 border-t-0">Clarion field</TableHead>
              <TableHead align="start" className="border-t-0">{p.mapColumn}</TableHead>
              <TableHead align="start" className="w-32 border-t-0"><span className="sr-only">Source</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const isDefault = d.attributes[r.key] === (p.attributes[r.key] ?? "")
              const id = `attr-${r.key}`
              return (
                <TableRow key={r.key} className="last:border-b-0 hover:bg-transparent">
                  <TableCell>
                    <label htmlFor={id} className="text-label-md">{r.label}</label>
                    {r.req && <span className="ms-1.5 text-body-xs text-content-neutral-muted">{r.req}</span>}
                  </TableCell>
                  <TableCell>
                    <Input
                      id={id}
                      size="sm"
                      value={d.attributes[r.key]}
                      aria-invalid={r.key === "email" && !d.attributes.email.trim() ? true : undefined}
                      onChange={(e) => setAttr(r.key, e.target.value)}
                      className="font-mono text-code-sm"
                    />
                  </TableCell>
                  <TableCell>
                    {isDefault ? <Badge>{p.mapBadge}</Badge> : <Badge variant="outline">Changed</Badge>}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>

      {/* Roles from groups */}
      <Card size="sm" className="shadow-none">
        <CardContent>
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col gap-1">
              <h3 className="text-heading-xs text-content-neutral-emphasis">Give access from {p.short} groups</h3>
              <p className="max-w-content-reading text-body-sm text-content-neutral-muted"><Rich text={p.groupIntro} /></p>
            </div>
            {p.groupMode === "limited" && !d.groupsEnabled && <Badge>Not set up</Badge>}
          </div>

          {p.groupMode === "limited" && !d.groupsEnabled ? (
            <div className="flex flex-wrap items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => set({ groupsEnabled: true })}>Set up group mapping</Button>
              <span className="text-body-xs text-content-neutral-muted">or keep giving access on the Users page</span>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <div className={cn("hidden gap-2 text-label-sm text-content-neutral-muted sm:grid", grid)}>
                  <span>{valueLabel}</span>
                  {p.groupMode === "ids" && <span>Name in Iris</span>}
                  <span>Iris group</span>
                  <span className="sr-only">Remove</span>
                </div>
                {d.groupRules.map((r, i) => (
                  <div key={r.id} className={cn("grid grid-cols-1 items-center gap-2", grid)}>
                    <Input size="sm" aria-label={`${valueLabel}, row ${i + 1}`} value={r.value} onChange={(e) => setRule(r.id, { value: e.target.value })} className={cn(p.groupMode === "ids" && "font-mono text-code-sm")} />
                    {p.groupMode === "ids" && (
                      <Input size="sm" aria-label={`Name in Iris, row ${i + 1}`} value={r.label ?? ""} placeholder="e.g. Contact centre managers" onChange={(e) => setRule(r.id, { label: e.target.value })} />
                    )}
                    <IrisGroupPicker value={r.group} label={`Iris group, row ${i + 1}`} onChange={(g) => setRule(r.id, { group: g })} />
                    <Button variant="ghost" size="icon-sm" aria-label={`Remove row ${i + 1}`} onClick={() => set({ groupRules: d.groupRules.filter((x) => x.id !== r.id) })}>
                      <Trash2 aria-hidden />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => set({ groupRules: [...d.groupRules, { id: newRuleId(), value: "", label: p.groupMode === "ids" ? "" : undefined, group: "" }] })}
              >
                <Plus aria-hidden /> Add group
              </Button>
              <p className="text-body-xs text-content-neutral-muted">
                Each Iris group carries its own access: tenant roles, Clarion, Vantage. Someone in several mapped groups gets all of it; someone in none gets no access. The Iris group is then linked, so its members come from {p.short}.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-2 text-heading-xs text-content-neutral-emphasis">Who can sign in with SSO</legend>
        <RadioGroup value={d.newUsers} onValueChange={(v) => set({ newUsers: v as NewUserRule })}>
          <FieldOption control={<Radio value="invited" />} description="Recommended. Everyone else is turned away at sign-in.">
            Only people already invited to Iris
          </FieldOption>
          <FieldOption control={<Radio value="anyone" />} description="They get an Iris account on first sign-in, with no access until a mapped group gives them some.">
            Anyone assigned to Iris in {p.short}
          </FieldOption>
        </RadioGroup>
      </fieldset>
    </>
  )
}

// ---- Step 6: test sign-in ----------------------------------------------------

function StepTest({
  p, d, passed, onResult, onFix,
}: {
  p: Provider
  d: SsoDraft
  passed: boolean
  onResult: (ok: boolean) => void
  onFix: (step: number) => void
}) {
  const [state, setState] = useState<"idle" | "running" | "passed" | "failed">(passed ? "passed" : "idle")
  // The person running the test: whoever is signed in.
  const tester = access.person(me())!
  const testerGroups = groupsOf(tester.id).map((g) => g.id)

  const run = async (fail = false) => {
    setState("running")
    onResult(false)
    await wait(1600)
    if (fail) { setState("failed"); return }
    setState("passed")
    onResult(true)
  }

  const groupsSent = d.groupsEnabled && d.attributes.groups
    ? d.groupRules.filter((r) => r.group && testerGroups.includes(r.group)).map((r) => r.value).filter(Boolean)
    : []
  const matchedRule = groupsSent.length ? d.groupRules.find((r) => r.value === groupsSent[0]) : undefined
  const [first, ...rest] = tester.name.split(" ")
  const received: [string, ReactNode][] = [
    [d.attributes.email || "email", tester.email],
    [d.attributes.firstName || "first name", first],
    [d.attributes.lastName || "last name", rest.join(" ")],
    ...(groupsSent.length ? [[d.attributes.groups, groupsSent.join(", ")] as [string, ReactNode]] : []),
  ]

  return (
    <>
      <SectionTitle sub={`Sign in once through ${p.short} to check everything lines up before anyone else uses it.`}>
        Test sign-in
      </SectionTitle>

      {state === "idle" && (
        <Card size="sm" className="shadow-none">
          <CardContent className="items-start">
            <p className="text-body-md text-content-neutral-muted">
              We'll open {p.short} in a new tab. Sign in as yourself, and you'll come straight back here with the result.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Button onClick={() => run()}><ExternalLink aria-hidden /> Run test</Button>
              <Button variant="link" size="xs" className="h-auto p-0" onClick={() => run(true)}>Prototype: preview a failed test</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {state === "running" && (
        <Card size="sm" className="shadow-none" role="status">
          <CardContent className="flex-row items-center gap-3">
            <Loader size="5" />
            <span className="text-body-md text-content-neutral-emphasis">Waiting for you to sign in to {p.short}…</span>
          </CardContent>
        </Card>
      )}

      {state === "passed" && (
        <div className="flex flex-col gap-2">
          <Callout tone="success" title="Test passed">
            {p.short} signed in {tester.name} and sent everything Clarion needs.
          </Callout>
          <Card size="sm" className="shadow-none">
            <CardContent className="gap-3">
              <span className="text-label-sm text-content-neutral-muted">What {p.short} sent</span>
              <DetailList rows={received} />
              <div className="flex flex-wrap items-center gap-2 text-body-sm text-content-neutral-muted">
                <Users aria-hidden className="size-4" />
                Matched Member <span className="font-medium text-content-neutral-emphasis">{tester.name}</span> ·
                <Badge>{accessLine(tester.id)}</Badge>
                {matchedRule && <span>from {matchedRule.label || matchedRule.value} → {access.group(matchedRule.group)?.name}</span>}
              </div>
              <Button variant="outline" size="sm" className="w-fit" onClick={() => run()}>Run test again</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {state === "failed" && (
        <>
          <Callout
            tone="destructive"
            title="Test failed: the signature didn't match"
            action={<Button size="xs" variant="outline" onClick={() => onFix(2)}>Back to step 3</Button>}
          >
            {p.short} signed the response with a different certificate from the one Iris has. This usually means the certificate was rotated. Reconnect in step 4 to pick up the new one.
          </Callout>
          <Button variant="outline" className="w-fit" onClick={() => run()}>Run test again</Button>
        </>
      )}
    </>
  )
}

// ---- Turn on -----------------------------------------------------------------

function StepTurnOn({ p, mode, onMode }: { p: Provider; mode: SsoMode; onMode: (m: SsoMode) => void }) {
  const members = activeMembers()
  const admins = users.filter((u) => u.role === "admin" && u.status === "active").length

  return (
    <>
      <Callout tone="success" title="Your connection is tested and ready">
        Choose how Members sign in. You can change this at any time.
      </Callout>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ChoiceCard selected={mode === "optional"} onSelect={() => onMode("optional")}>
          <span className="flex items-center gap-2 text-label-md text-content-neutral-emphasis">Optional <Badge>Suggested first</Badge></span>
          <span className="text-body-sm text-content-neutral-muted">Members can sign in with {p.short} or their Clarion password.</span>
        </ChoiceCard>
        <ChoiceCard selected={mode === "required"} onSelect={() => onMode("required")}>
          <span className="text-label-md text-content-neutral-emphasis">Required</span>
          <span className="text-body-sm text-content-neutral-muted">Every Member must sign in with {p.short}. Admins keep an emergency way in.</span>
        </ChoiceCard>
      </div>

      {mode === "required" && (
        <Callout tone="warning" title="What changes when you turn this on">
          <ul className="mt-1 flex list-disc flex-col gap-1.5 ps-5">
            <li><strong className="font-medium text-content-neutral-emphasis">{members.length} Members</strong> will sign in through {p.short}. Their Clarion passwords stop working.</li>
            <li>Anyone not assigned to the Iris app in {p.short} can't sign in. Check everyone who needs Clarion is assigned.</li>
            <li>People already signed in stay signed in until their session ends.</li>
            <li><strong className="font-medium text-content-neutral-emphasis">Emergency access:</strong> {admins === 1 ? "your Admin" : `your ${admins} Admins`} can still sign in with password and MFA if {p.short} is down.</li>
          </ul>
        </Callout>
      )}
    </>
  )
}

// ---- Iris group picker ------------------------------------------------------------

/** Pick the Iris group an IdP group maps to. Each option says what access it gives. */
function IrisGroupPicker({ value, label, onChange }: { value: string; label: string; onChange: (id: string) => void }) {
  const chosen = value ? access.group(value) : undefined
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" aria-label={label} className="w-full justify-between font-normal">
          <span className={cn("truncate", !chosen && "text-content-neutral-subtle")}>{chosen?.name ?? "Choose a group"}</span>
          <ChevronDown aria-hidden />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="max-h-80 w-80 overflow-y-auto">
        {access.groups().map((g) => (
          <DropdownMenuItem key={g.id} onSelect={() => onChange(g.id)} className="h-auto items-start py-1.5">
            <span className="flex min-w-0 flex-col">
              <span>{g.name}</span>
              <span className="truncate text-body-xs text-content-neutral-muted">
                {g.assignments.length ? g.assignments.map((x) => assignmentLabel(x)).join(" · ") : "No access yet"}
              </span>
            </span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
