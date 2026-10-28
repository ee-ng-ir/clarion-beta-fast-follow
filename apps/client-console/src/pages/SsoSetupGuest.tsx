import { useEffect, useState, type ReactNode } from "react"
import { Check, CircleCheck, KeyRound, LinkIcon, Mail, X } from "lucide-react"
import {
  Badge, Button, Card, CardContent, CardDescription, CardFooter, CardHeader, CardHeaderText, CardTitle,
  EmptyState, OtpInput, OtpSlot,
} from "@ir/ui"
import { fleet } from "@/data/dashboard"
import { SsoWizard } from "@/components/admin/sso/SsoWizard"
import { AdminToaster } from "@/components/admin/AdminToaster"
import { toast } from "@/components/ui/toast"
import { isOpen, shortDate, updateInvite, useInvite } from "@/data/ssoDelegate"

/**
 * What IT sees when they open a setup link: /setup/sso?invite=…
 *
 * A stripped-down Iris — no sidebar, no Members, no Clarion. Four stages:
 * the invite, a one-time code to prove the email, SSO setup in "delegate"
 * mode (connect and test, no turn-on), then handed back to the Admin.
 */
type Stage = "landing" | "code" | "setup" | "saved" | "done"

export function SsoSetupGuest() {
  useEffect(() => {
    document.documentElement.setAttribute("data-picasso", "")
    document.title = `Set up single sign-on · ${fleet.workspace} · Iris`
  }, [])

  const invite = useInvite()
  const linkId = new URLSearchParams(window.location.search).get("invite")
  const [stage, setStage] = useState<Stage>(() =>
    invite?.status === "completed" ? "done" : invite?.status === "verified" ? "setup" : "landing",
  )

  const valid = isOpen(invite) && invite.id === linkId
  const firstName = invite?.from.name.split(" ")[0] ?? "your Admin"

  let body: ReactNode
  if (!valid && stage !== "done") {
    body = (
      <Narrow>
        <Card>
          <CardContent className="py-10">
            <EmptyState
              icon={<LinkIcon />}
              title="This link no longer works"
              description={invite?.status === "revoked" ? "It was cancelled by an Iris Admin. Ask them to send a new one." : "It may have expired or been replaced. Ask your Iris Admin to send a new one."}
            />
          </CardContent>
        </Card>
      </Narrow>
    )
  } else if (stage === "landing") {
    body = (
      <Narrow>
        <Card>
          <CardHeader>
            <IconTile><KeyRound /></IconTile>
            <CardHeaderText>
              <CardTitle>Set up single sign-on for {fleet.workspace}</CardTitle>
              <CardDescription>{invite!.from.name} asked you to connect your company's identity provider to Iris.</CardDescription>
            </CardHeaderText>
          </CardHeader>
          <CardContent className="gap-5">
            {invite!.note && (
              <blockquote className="rounded-lg border-s-2 border-line-primary-emphasis bg-surface-neutral-subtle px-4 py-3 text-body-md text-content-neutral-emphasis">
                “{invite!.note}”
                <span className="mt-1 block text-body-xs text-content-neutral-muted">{invite!.from.name}</span>
              </blockquote>
            )}
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Can title="You can" items={["Connect your identity provider", "Map the user details it sends", "Run a test sign-in"]} />
              <Can no title="You can't" items={["Turn single sign-on on", "See Members or Clarion data"]} />
            </div>
            <p className="text-body-sm text-content-neutral-muted">
              Takes about 15 minutes with admin access to your identity provider. Link for {invite!.email} · expires {shortDate(invite!.expiresAt)}.
            </p>
          </CardContent>
          <CardFooter className="border-t border-line-neutral-muted pt-4">
            <Button onClick={() => setStage("code")}><Mail aria-hidden /> Email me a code</Button>
          </CardFooter>
        </Card>
      </Narrow>
    )
  } else if (stage === "code") {
    body = <CodeStep email={invite!.email} onBack={() => setStage("landing")} onVerified={() => { updateInvite({ status: "verified" }); setStage("setup") }} />
  } else if (stage === "setup") {
    body = (
      <SsoWizard
        initial={invite!.draft}
        delegate={{ adminName: firstName }}
        onChange={(draft) => updateInvite({ draft })}
        onExit={() => setStage("saved")}
        onComplete={(draft) => { updateInvite({ draft, status: "completed", finishedAt: Date.now() }); setStage("done") }}
      />
    )
  } else if (stage === "saved") {
    body = (
      <Narrow>
        <Card>
          <CardContent className="py-10">
            <EmptyState
              icon={<Check />}
              title="Saved"
              description={`Open this link again to carry on where you left off. It works until ${shortDate(invite!.expiresAt)}.`}
              action={<Button variant="outline" onClick={() => setStage("setup")}>Carry on now</Button>}
            />
          </CardContent>
        </Card>
      </Narrow>
    )
  } else {
    body = (
      <Narrow>
        <Card>
          <CardContent className="py-10">
            <EmptyState
              icon={<CircleCheck />}
              title={`Handed back to ${firstName}`}
              description={`The test passed. We've emailed ${invite?.from.name ?? "your Admin"} that single sign-on is ready to turn on. There's nothing more for you to do, and this link no longer works.`}
            />
          </CardContent>
        </Card>
      </Narrow>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-surface-neutral-subtle">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-line-neutral-muted bg-surface-neutral-default px-gutter">
        <div className="flex items-center gap-3">
          <span className="text-heading-sm uppercase tracking-wide text-content-neutral-emphasis" style={{ fontFamily: "'Oswald', ui-sans-serif, sans-serif" }}>Iris</span>
          <span aria-hidden className="h-4 w-px bg-line-neutral-muted" />
          <span className="text-body-sm text-content-neutral-muted">Single sign-on setup · {fleet.workspace}</span>
        </div>
        {valid && (stage === "setup" || stage === "saved") && (
          <Badge variant="outline">{invite!.email}</Badge>
        )}
      </header>
      <main className="flex-1 p-gutter">
        <div className="mx-auto w-full max-w-content-standard">{body}</div>
      </main>
      <AdminToaster />
    </div>
  )
}

function Narrow({ children }: { children: ReactNode }) {
  return <div className="mx-auto w-full max-w-content-reading pt-8">{children}</div>
}

function IconTile({ children }: { children: ReactNode }) {
  return (
    <span aria-hidden className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-surface-primary-subtle text-content-primary-emphasis [&>svg]:size-5">
      {children}
    </span>
  )
}

function Can({ title, items, no }: { title: string; items: string[]; no?: boolean }) {
  const Icon = no ? X : Check
  return (
    <div className="flex flex-col gap-2 rounded-lg bg-surface-neutral-subtle p-3.5">
      <span className="text-label-md text-content-neutral-emphasis">{title}</span>
      <ul className="flex flex-col gap-1.5">
        {items.map((t) => (
          <li key={t} className="flex items-start gap-2 text-body-sm text-content-neutral-muted">
            <Icon aria-hidden className={no ? "mt-0.5 size-4 shrink-0 text-content-neutral-subtle" : "mt-0.5 size-4 shrink-0 text-content-success-emphasis"} />
            {t}
          </li>
        ))}
      </ul>
    </div>
  )
}

function CodeStep({ email, onBack, onVerified }: { email: string; onBack: () => void; onVerified: () => void }) {
  const [code, setCode] = useState("")
  const [checking, setChecking] = useState(false)

  const verify = () => {
    setChecking(true)
    window.setTimeout(() => { setChecking(false); onVerified() }, 700)
  }

  return (
    <Narrow>
      <Card>
        <CardHeader>
          <IconTile><Mail /></IconTile>
          <CardHeaderText>
            <CardTitle>Check your email</CardTitle>
            <CardDescription>We sent a 6-digit code to {email}. It proves the link reached the right person.</CardDescription>
          </CardHeaderText>
        </CardHeader>
        <CardContent className="gap-3">
          <OtpInput maxLength={6} value={code} onChange={setCode} onComplete={verify} aria-label="6-digit code" autoFocus>
            {[0, 1, 2, 3, 4, 5].map((i) => <OtpSlot key={i} index={i} />)}
          </OtpInput>
          <p className="text-body-xs text-content-neutral-subtle">Prototype: any 6 digits work.</p>
        </CardContent>
        <CardFooter className="justify-between border-t border-line-neutral-muted pt-4">
          <div className="flex items-center gap-1">
            <Button variant="ghost" onClick={onBack}>Back</Button>
            <Button variant="ghost" onClick={() => toast({ title: "New code sent", description: `Check ${email}. (Stubbed)`, variant: "info" })}>Resend code</Button>
          </div>
          <Button disabled={code.length < 6} loading={checking} onClick={verify}>Verify</Button>
        </CardFooter>
      </Card>
    </Narrow>
  )
}
