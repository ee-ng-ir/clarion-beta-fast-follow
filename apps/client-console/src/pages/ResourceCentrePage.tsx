import { useState } from "react"
import { BookOpen, Copy, Download, ExternalLink, RefreshCw, ScrollText } from "lucide-react"
import {
  Button, Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardHeaderText, CardTitle,
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@ir/ui"
import { tenant } from "@ir/mock-data/tenant"
import { toast } from "@/components/ui/toast"

const MSI = "clarion-1.0.2.msi"
const dateFmt = new Intl.DateTimeFormat("en-AU", { day: "numeric", month: "short", year: "numeric" })

/** A made-up enrolment token — never a real one. */
const newToken = () => Array.from(crypto.getRandomValues(new Uint8Array(30)), (b) => "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"[b % 64]).join("")

const command = (token: string) =>
  `msiexec /i ${MSI} /qn /lv C:\\Windows\\Temp\\clarion-install.log ENROLMENT_TOKEN=${token} TENANT_ID=${tenant.id} BACKEND_URL=https://clarion-au.iris.example.com/clarion/api/v1/enrol SHOW_WIDGET=true`

export function ResourceCentrePage() {
  const [token, setToken] = useState(newToken)
  const [expires, setExpires] = useState(() => new Date("2029-10-17T00:00:00+11:00"))
  const [confirmOpen, setConfirmOpen] = useState(false)

  const copy = async () => {
    try { await navigator.clipboard.writeText(command(token)); toast({ title: "Install command copied." }) }
    catch { toast({ title: "Couldn't copy. Select the command and copy it instead.", variant: "danger" }) }
  }
  const regenerate = () => {
    setToken(newToken())
    const d = new Date(); d.setFullYear(d.getFullYear() + 3); setExpires(d)
    setConfirmOpen(false)
    toast({ title: "New token generated. The old one no longer enrols endpoints." })
  }
  const soon = (what: string) => toast({ title: `${what} opens in the Clarion docs (not in this prototype).`, variant: "info" })

  return (
    <section className="flex flex-col gap-4" aria-labelledby="clarion-resources">
      <h2 id="clarion-resources" className="text-heading-lg text-content-neutral-emphasis">Clarion</h2>

      <Card>
        <CardHeader>
          <CardHeaderText>
            <CardTitle><h3>Clarion widget installer</h3></CardTitle>
            <CardDescription>Signed MSI for silent deployment with Intune, SCCM or Group Policy. Version 1.0.2.</CardDescription>
          </CardHeaderText>
          <CardAction>
            <Button onClick={() => toast({ title: `Downloading ${MSI}.`, variant: "info" })}><Download /> Download MSI</Button>
          </CardAction>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardHeaderText>
            <CardTitle><h3>Install from the command line</h3></CardTitle>
            <CardDescription>Run this on each endpoint, or paste it into your deployment tool. It enrols the widget with this tenant.</CardDescription>
          </CardHeaderText>
          <CardAction>
            <Button variant="outline" onClick={copy}><Copy /> Copy command</Button>
          </CardAction>
        </CardHeader>
        <CardContent>
          <pre className="ltr-island overflow-x-auto whitespace-pre-wrap break-all rounded-md border border-line-neutral-muted bg-surface-app p-4 font-mono text-code-sm text-content-neutral-emphasis">
            {command(token)}
          </pre>
        </CardContent>
        <CardFooter className="flex-wrap justify-between gap-2">
          <span className="text-body-sm text-content-neutral-muted">Enrolment token expires {dateFmt.format(expires)}</span>
          <Button variant="outline" onClick={() => setConfirmOpen(true)}><RefreshCw /> Generate new token</Button>
        </CardFooter>
      </Card>

      <div className="grid grid-cols-1 gap-gutter @3xl:grid-cols-2">
        <Card size="sm">
          <CardHeader>
            <BookOpen className="size-5 text-content-neutral-muted" aria-hidden />
            <CardHeaderText>
              <CardTitle><h3>Installation guide</h3></CardTitle>
              <CardDescription>Step-by-step installation, including a pilot rollout.</CardDescription>
            </CardHeaderText>
            <CardAction><Button variant="outline" size="sm" onClick={() => soon("The installation guide")}>Read guide <ExternalLink /></Button></CardAction>
          </CardHeader>
        </Card>
        <Card size="sm">
          <CardHeader>
            <ScrollText className="size-5 text-content-neutral-muted" aria-hidden />
            <CardHeaderText>
              <CardTitle><h3>What's new</h3></CardTitle>
              <CardDescription>Release notes and product updates.</CardDescription>
            </CardHeaderText>
            <CardAction><Button variant="outline" size="sm" onClick={() => soon("The release notes")}>Read release notes <ExternalLink /></Button></CardAction>
          </CardHeader>
        </Card>
      </div>

      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Generate a new enrolment token?</DialogTitle>
            <DialogDescription>The current token stops working at once. Endpoints already enrolled keep reporting, but any deployment still using the old command will fail until you update it.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmOpen(false)}>Cancel</Button>
            <Button onClick={regenerate}>Generate new token</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  )
}
