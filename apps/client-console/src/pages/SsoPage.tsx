import { useState, type ReactNode } from "react"
import { KeyRound, ShieldCheck, Send, Check, ExternalLink } from "lucide-react"
import {
  Badge, Button, EmptyState,
  Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardHeaderText, CardTitle,
  KpiTile,
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@ir/ui"
import { toast } from "@/components/ui/toast"
import { useViewer } from "@/lib/viewer"
import { roleLabel } from "@ir/mock-data/users"
import { providers, providerById, activeMembers, sampleEmailDomain, signInPage, setupSteps, recentSignIns, connectMethodLabel } from "@/data/sso"
import { SsoWizard, emptyDraft, type SsoDraft, type SsoMode } from "@/components/admin/sso/SsoWizard"
import { Callout, DetailList } from "@/components/admin/sso/parts"
import { SendSetupLinkDialog } from "@/components/admin/sso/SendSetupLinkDialog"
import { ReplaceCertificateDialog } from "@/components/admin/sso/ReplaceCertificateDialog"
import { inviteUrl, isOpen, shortDate, useInvite, writeInvite, type SetupInvite } from "@/data/ssoDelegate"

type View = "overview" | "setup" | "active"

// Kept at module level so the prototype remembers SSO state while you move
// between Administration pages (the page component unmounts on navigation).
let memory: { view: View; draft: SsoDraft | null; live: SsoDraft | null } = { view: "overview", draft: null, live: null }

export function SsoPage() {
  const [view, setViewState] = useState<View>(memory.view)
  const [draft, setDraftState] = useState<SsoDraft | null>(memory.draft)
  const [live, setLiveState] = useState<SsoDraft | null>(memory.live)

  const save = (next: Partial<typeof memory>) => {
    memory = { ...memory, ...next }
    if (next.view !== undefined) setViewState(next.view)
    if ("draft" in next) setDraftState(next.draft ?? null)
    if ("live" in next) setLiveState(next.live ?? null)
  }

  const readOnly = !useViewer().perm.manageSso
  const start = (from: SsoDraft = draft ?? emptyDraft) => save({ view: "setup", draft: from })

  // ---- Setup link (hand setup to IT) ----
  const invite = useInvite()
  const shared = isOpen(invite) ? invite : null
  const [sendFrom, setSendFrom] = useState<SsoDraft | null>(null)
  const sendDialog = (
    <SendSetupLinkDialog
      open={sendFrom !== null}
      onOpenChange={(o) => { if (!o) setSendFrom(null) }}
      draft={sendFrom ?? emptyDraft}
      onSent={(i) => {
        writeInvite(i)
        save({ view: live ? "active" : "overview", draft: null })
        toast({ title: `Setup link sent to ${i.email}`, description: "Email stubbed in prototype. Use “Open their view” to see what they get.", variant: "success" })
      }}
    />
  )
  const banner = shared && (
    <InviteBanner
      invite={shared}
      onRevoke={() => {
        writeInvite({ ...shared, status: "revoked" })
        toast({ title: "Setup link cancelled", description: `${shared.email} can no longer open it.`, variant: "info" })
      }}
      onReview={() => {
        writeInvite(null)
        start({ ...shared.draft, step: setupSteps.length })
      }}
    />
  )

  // Auditors read the settings; only Tenant Admins change them.
  if (readOnly) {
    return live
      ? <ActiveView live={live} readOnly onMode={() => {}} onEdit={() => {}} onTurnOff={() => {}} />
      : (
        <Card className="w-full">
          <CardContent className="py-6">
            <EmptyState size="sm" icon={<KeyRound />} title="Single sign-on isn't set up"
              description="Members sign in with their Iris password. Only a Tenant Admin can set up single sign-on." />
          </CardContent>
        </Card>
      )
  }

  if (view === "setup") {
    return (
      <>
      {sendDialog}
      <SsoWizard
        onSendLink={(d) => setSendFrom(d)}
        initial={draft ?? emptyDraft}
        onExit={(d) => {
          // An untouched wizard isn't worth resuming.
          const touched = d.providerId !== null
          save({ view: live ? "active" : "overview", draft: touched ? d : null })
          if (touched) toast({ title: "Setup saved", description: `Paused at "${setupSteps[Math.min(d.step, setupSteps.length - 1)]}".`, variant: "info" })
        }}
        onComplete={(d) => {
          save({ view: "active", live: d, draft: null })
          toast({
            title: `SSO is on (${d.mode})`,
            description: d.mode === "required" ? `Members now sign in with ${providerById(d.providerId!).short}.` : "Members can choose SSO or their password.",
            variant: "success",
          })
        }}
      />
      </>
    )
  }

  if (view === "active" && live) {
    return (
      <ActiveView
        live={live}
        onMode={(mode) => {
          save({ live: { ...live, mode } })
          toast({ title: mode === "required" ? "SSO is now required" : "SSO is now optional", variant: "success" })
        }}
        onEdit={() => start({ ...live, step: 2, connected: false, tested: false })}
        onTurnOff={() => {
          save({ view: "overview", live: null, draft: null })
          toast({ title: "SSO turned off", description: "Members sign in with their Clarion passwords. Anyone without one gets a reset email. (Stubbed)", variant: "danger" })
        }}
      />
    )
  }

  return (
    <>
      {sendDialog}
      <EmptyView
        draft={draft}
        banner={banner}
        delegated={!!shared}
        onStart={() => start()}
        onStartOver={() => start(emptyDraft)}
        onSendLink={() => setSendFrom(draft ?? emptyDraft)}
      />
    </>
  )
}

// ---- Not set up ----------------------------------------------------------------

function IconTile({ tone, children }: { tone: "primary" | "success"; children: ReactNode }) {
  return (
    <span
      aria-hidden
      className={tone === "primary"
        ? "flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-primary-subtle text-content-primary-emphasis [&>svg]:size-5"
        : "flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-success-subtle text-content-success-emphasis [&>svg]:size-5"}
    >
      {children}
    </span>
  )
}

function EmptyView({
  draft, banner, delegated, onStart, onStartOver, onSendLink,
}: {
  draft: SsoDraft | null
  banner: ReactNode
  delegated: boolean
  onStart: () => void
  onStartOver: () => void
  onSendLink: () => void
}) {
  const at = draft ? Math.min(draft.step, setupSteps.length - 1) : 0

  return (
    <div className="flex flex-col gap-4">
      {banner}
      {draft && !delegated && (
        <Callout
          tone="info"
          title={`Setup paused at step ${at + 1}: ${setupSteps[at]}`}
          action={
            <div className="flex gap-2">
              <Button size="xs" variant="ghost" onClick={onStartOver}>Start over</Button>
              <Button size="xs" onClick={onStart}>Resume</Button>
            </div>
          }
        >
          {draft.providerId ? `Connecting ${providerById(draft.providerId).name}.` : "Provider not chosen yet."}
        </Callout>
      )}

      <Card className="w-full">
        <CardHeader>
          <IconTile tone="primary"><KeyRound /></IconTile>
          <CardHeaderText>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Single sign-on</CardTitle>
              <Badge>Not set up</Badge>
            </div>
            <CardDescription className="max-w-content-reading">
              Let Members sign in to Clarion with the company account they already use for work, instead of a separate Clarion password.
            </CardDescription>
          </CardHeaderText>
        </CardHeader>
        <CardContent className="gap-4">
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["One less password", "Members sign in the way they do every morning, with your company's MFA."],
              ["Access ends when they leave", "Turn someone off in your identity provider and they lose Clarion too."],
              ["Tested before it's live", "You run a test sign-in first, and Admins keep an emergency way in."],
            ].map(([t, b]) => (
              <li key={t} className="flex flex-col gap-1 rounded-lg bg-surface-neutral-subtle p-3.5">
                <span className="flex items-center gap-1.5 text-label-md text-content-neutral-emphasis">
                  <Check aria-hidden className="size-4 text-content-success-emphasis" /> {t}
                </span>
                <span className="text-body-sm text-content-neutral-muted">{b}</span>
              </li>
            ))}
          </ul>
          <p className="text-body-xs text-content-neutral-muted">
            Works with {providers.filter((p) => !p.generic).map((p) => p.name).join(", ")}, and any SAML 2.0 or OIDC provider. Takes about 15 minutes with access to your identity provider.
          </p>
        </CardContent>
        {!delegated && (
          <CardFooter className="flex-wrap border-t border-line-neutral-muted pt-4">
            {!draft && <Button onClick={onStart}><KeyRound aria-hidden /> Set up SSO</Button>}
            <Button variant="outline" onClick={onSendLink}><Send aria-hidden /> Send setup link to your IT team</Button>
          </CardFooter>
        )}
      </Card>
    </div>
  )
}

// ---- Setup link status -----------------------------------------------------------

function InviteBanner({ invite, onRevoke, onReview }: { invite: SetupInvite; onRevoke: () => void; onReview: () => void }) {
  if (invite.status === "completed") {
    return (
      <Callout tone="success" title={`${invite.email} finished setup and the test passed`} action={<Button size="xs" onClick={onReview}><ShieldCheck aria-hidden /> Review and turn on</Button>}>
        Only an Admin can turn single sign-on on. Review the connection, then choose Optional or Required.
      </Callout>
    )
  }
  const step = Math.min(invite.draft.step, setupSteps.length - 1)
  const provider = invite.draft.providerId ? providerById(invite.draft.providerId).name : null
  const actions = (
    <div className="flex gap-2">
      <Button size="xs" variant="ghost" onClick={onRevoke}>Cancel link</Button>
      <Button size="xs" variant="outline" asChild>
        <a href={inviteUrl(invite)} target="_blank" rel="noreferrer"><ExternalLink aria-hidden /> Open their view</a>
      </Button>
    </div>
  )
  return invite.status === "verified" ? (
    <Callout tone="info" title={`${invite.email} is setting up single sign-on`} action={actions}>
      On step {step + 1} of {setupSteps.length}: {setupSteps[step]}{provider ? ` · ${provider}` : ""}. You'll be emailed when the test passes. Link expires {shortDate(invite.expiresAt)}.
    </Callout>
  ) : (
    <Callout tone="info" title={`Setup link sent to ${invite.email}`} action={actions}>
      Not opened yet. Expires {shortDate(invite.expiresAt)}.
    </Callout>
  )
}

// ---- Active --------------------------------------------------------------------

function ActiveView({
  live, onMode, onEdit, onTurnOff, readOnly = false,
}: {
  /** Auditor: settings shown, no controls. */
  readOnly?: boolean
  live: SsoDraft
  onMode: (m: SsoMode) => void
  onEdit: () => void
  onTurnOff: () => void
}) {
  const [confirmOff, setConfirmOff] = useState(false)
  const [confirmRequired, setConfirmRequired] = useState(false)
  const p = providerById(live.providerId!)
  const onDomain = activeMembers().length
  const failed = recentSignIns.filter((s) => s.outcome === "failed").length
  const method = live.connectMethod === "oidc" ? "Issuer URL, client ID and secret" : connectMethodLabel[live.connectMethod ?? "url"]
  const autoRefresh = live.connectMethod === "url" || live.connectMethod === "oidc"

  // Certificates from a file or typed in by hand don't renew themselves.
  const [cert, setCert] = useState({ expires: "14 Mar 2029", file: null as string | null })
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [previewExpiring, setPreviewExpiring] = useState(false)
  const expiring = !autoRefresh && previewExpiring

  return (
    <div className="flex flex-col gap-4">
      <ReplaceCertificateDialog
        open={replaceOpen}
        onOpenChange={setReplaceOpen}
        providerId={live.providerId!}
        onReplaced={(c) => {
          setCert({ expires: c.expires, file: c.name })
          setPreviewExpiring(false)
          toast({ title: "Certificate saved", description: `Iris trusts both certificates until the old one expires. Make the new one active in ${p.short}.`, variant: "success" })
        }}
      />

      {expiring && (
        <Callout
          tone="warning"
          title="The signing certificate expires in 21 days"
          action={readOnly ? undefined : <Button size="xs" onClick={() => setReplaceOpen(true)}>Replace certificate</Button>}
        >
          When it expires, nobody can sign in with {p.short}. Download the new certificate from {p.short} and upload it here.
        </Callout>
      )}
      {/* Status */}
      <Card className="w-full overflow-hidden">
        <CardHeader className="flex-wrap">
          <IconTile tone="success"><ShieldCheck /></IconTile>
          <CardHeaderText>
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>Single sign-on is on</CardTitle>
              <Badge color="success" dot>Active</Badge>
              <Badge color={live.mode === "required" ? "info" : "neutral"}>{live.mode === "required" ? "Required" : "Optional"}</Badge>
            </div>
            <CardDescription>
              Members sign in with {p.name}
              {live.mode === "optional" ? " or their Clarion password" : ""}. Last successful sign-in {recentSignIns.find((s) => s.outcome === "success")?.when}.
            </CardDescription>
          </CardHeaderText>
          {!readOnly && <CardAction>
            {live.mode === "optional"
              ? <Button variant="outline" onClick={() => setConfirmRequired(true)}>Make required</Button>
              : <Button variant="outline" onClick={() => onMode("optional")}>Make optional</Button>}
            <Button variant="outline" onClick={onEdit}>Edit connection</Button>
          </CardAction>}
        </CardHeader>
        {confirmRequired && (
          <CardContent className="pt-4">
            <Callout
              tone="warning"
              title={`${onDomain} Members will have to sign in with ${p.short}`}
              action={
                <div className="flex gap-2">
                  <Button size="xs" variant="ghost" onClick={() => setConfirmRequired(false)}>Cancel</Button>
                  <Button size="xs" onClick={() => { setConfirmRequired(false); onMode("required") }}>Make SSO required</Button>
                </div>
              }
            >
              Their Clarion passwords stop working. Admins keep emergency access.
            </Callout>
          </CardContent>
        )}
      </Card>

      {/* KPI strip */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <KpiTile label="Members on SSO" value={onDomain} />
        <KpiTile label="Sign-ins, last 24 h" value={recentSignIns.length * 7} />
        <KpiTile label="Failed, last 24 h" value={failed} status={failed ? "warning" : "healthy"} statusLabel={failed ? "Check the log" : "None"} />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardHeaderText><CardTitle>Connection</CardTitle></CardHeaderText>
            <CardAction><Badge>{p.protocol}</Badge></CardAction>
          </CardHeader>
          <CardContent className="pt-2">
            <DetailList
              mono={false}
              rows={[
                ["Identity provider", p.name],
                ["Sign-in page", <span className="font-mono text-code-sm">{signInPage}</span>],
                ["Connected with", method],
                [p.parsed[0][0], <span className="font-mono text-code-sm">{p.parsed[0][1]}</span>],
                ...(p.protocol === "SAML 2.0"
                  ? [["Signing certificate", (
                      <span className="flex flex-col gap-1">
                        <span className="flex flex-wrap items-center gap-2">
                          {expiring ? "Expires 2 Nov 2026" : `Valid until ${cert.expires}`}
                          {expiring && <Badge color="warning" dot>21 days left</Badge>}
                          {cert.file && <span className="text-body-xs text-content-neutral-muted">from {cert.file}</span>}
                        </span>
                        <span className="text-body-xs text-content-neutral-muted">
                          {autoRefresh ? "New certificates are picked up automatically." : "Uploaded, so it won't renew itself. We'll email Admins 30 and 7 days before it expires."}
                        </span>
                        {!autoRefresh && !readOnly && (
                          <Button variant="link" size="xs" className="h-auto w-fit p-0" onClick={() => setReplaceOpen(true)}>Replace certificate</Button>
                        )}
                      </span>
                    )] as [string, ReactNode]]
                  : []),
              ]}
            />
            {!autoRefresh && p.protocol === "SAML 2.0" && (
              <Button variant="link" size="xs" className="mt-3 h-auto w-fit p-0" onClick={() => setPreviewExpiring((v) => !v)}>
                Prototype: {previewExpiring ? "back to a valid certificate" : "preview an expiring certificate"}
              </Button>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardHeaderText><CardTitle>Who can sign in</CardTitle></CardHeaderText>
            {!readOnly && <CardAction><Button variant="link" size="xs" onClick={onEdit}>Edit</Button></CardAction>}
          </CardHeader>
          <CardContent className="pt-2">
            <DetailList
              mono={false}
              rows={[
                ["New people", live.newUsers === "invited" ? "Only people invited in Clarion" : `Anyone assigned to Iris in ${p.short}, as a CC Manager with no Groups`],
                ["Roles from groups", live.groupsEnabled && live.groupRules.length
                  ? <span className="flex flex-col gap-1">{live.groupRules.map((r) => <span key={r.id}>{r.label || r.value} → {roleLabel[r.role]}</span>)}</span>
                  : "Not set up. Roles are assigned on the Members page."],
                ["Emergency access", "Admins can sign in with password and MFA if the provider is down"],
              ]}
            />
          </CardContent>
        </Card>
      </div>

      {/* Recent sign-ins */}
      <Card className="w-full overflow-hidden">
        <CardHeader className="pb-4">
          <CardHeaderText>
            <div className="flex items-center gap-2">
              <CardTitle>Recent SSO sign-ins</CardTitle>
              <Badge>{recentSignIns.length}</Badge>
            </div>
          </CardHeaderText>
        </CardHeader>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead align="start">Person</TableHead>
              <TableHead align="start">Outcome</TableHead>
              <TableHead align="start">Reason</TableHead>
              <TableHead align="end">When</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentSignIns.map((s) => (
              <TableRow key={s.who + s.when} className="last:border-b-0">
                <TableCell>{s.who}@{sampleEmailDomain}</TableCell>
                <TableCell>
                  {s.outcome === "success"
                    ? <Badge color="success" dot>Signed in</Badge>
                    : <Badge color="danger" dot>Failed</Badge>}
                </TableCell>
                <TableCell className="text-content-neutral-muted">{s.reason ?? "–"}</TableCell>
                <TableCell align="end" className="text-content-neutral-muted">{s.when}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      {/* Turn off */}
      {readOnly ? null : confirmOff ? (
        <Callout
          tone="destructive"
          title="Turn off single sign-on?"
          action={
            <div className="flex gap-2">
              <Button size="xs" variant="ghost" onClick={() => setConfirmOff(false)}>Keep SSO on</Button>
              <Button size="xs" variant="destructive" onClick={onTurnOff}>Turn off SSO</Button>
            </div>
          }
        >
          Members go back to Clarion passwords. Anyone who never had one gets a reset email.
        </Callout>
      ) : (
        <Card size="sm" className="w-full">
          <CardHeader>
            <CardHeaderText>
              <CardTitle>Turn off single sign-on</CardTitle>
              <CardDescription>Your connection settings are deleted. You'd need to set it up again.</CardDescription>
            </CardHeaderText>
            <CardAction><Button variant="outline" onClick={() => setConfirmOff(true)}>Turn off…</Button></CardAction>
          </CardHeader>
        </Card>
      )}
    </div>
  )
}
