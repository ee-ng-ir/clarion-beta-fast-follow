import { ExternalLink } from "lucide-react"
import {
  Alert, AlertDescription, AlertTitle, Button, Card, CardAction, CardContent, CardDescription, CardHeader, CardHeaderText, CardTitle,
  Stepper, StepperContent, StepperDescription, StepperIndicator, StepperItem, StepperSeparator, StepperTitle, StepperTrack,
} from "@ir/ui"
import { useSyncExternalStore } from "react"
import { stats, store } from "@ir/mock-data/widget-users"
import { ProductMark } from "@/components/admin/portal/parts"
import { CLARION_URL } from "@/lib/apps"
import { toast } from "@/components/ui/toast"
import type { PageId, UserTab } from "@/nav"

/** Clarion's space in the admin portal: the way into the Fleet dashboard, and setup. */
export function ClarionSpacePage({ onNavigate }: { onNavigate: (id: PageId, tab?: UserTab) => void }) {
  useSyncExternalStore(store.subscribe, store.version)
  const openFleet = () => window.open(CLARION_URL, "_blank", "noopener")
  const steps: { title: string; body: string; action: React.ReactNode }[] = [
    {
      title: "Add your users",
      body: "Each person needs a license before their endpoint reports.",
      action: <Button variant="outline" size="sm" onClick={() => onNavigate("usermgmt", "clarion")}>Go to User management</Button>,
    },
    {
      title: "Get the installer",
      body: "Download the widget MSI and copy your install command.",
      action: <Button variant="outline" size="sm" onClick={() => onNavigate("resources")}>Go to Resource centre</Button>,
    },
    {
      title: "Deploy silently",
      body: "Push to a pilot group first, then to your whole fleet.",
      action: <Button variant="outline" size="sm" onClick={() => toast({ title: "The deployment guide opens in the Clarion docs (not in this prototype).", variant: "info" })}>Read deployment guide <ExternalLink /></Button>,
    },
    {
      title: "Check endpoints are reporting",
      body: "Allow up to 10 min after a licensed user signs in for their endpoint to appear in the Fleet dashboard.",
      action: <Button variant="outline" size="sm" onClick={openFleet}>Open Fleet dashboard <ExternalLink /></Button>,
    },
  ]

  return (
    <div className="flex flex-col gap-gutter">
      <Card>
        <CardHeader>
          <ProductMark product="clarion" name="Clarion" />
          <CardHeaderText>
            <CardTitle><h2>Fleet dashboard</h2></CardTitle>
            <CardDescription className="max-w-content-reading">
              Live telemetry from every Clarion-enabled endpoint in one place: workforce health, trends, and alerts when something needs your attention.
            </CardDescription>
          </CardHeaderText>
          <CardAction><Button onClick={openFleet}>Open Fleet dashboard <ExternalLink /></Button></CardAction>
        </CardHeader>
      </Card>

      <Alert variant="info" action={<Button variant="outline" size="xs" onClick={openFleet}>Set recipients</Button>}>
        <AlertTitle>No one receives Clarion alerts yet</AlertTitle>
        <AlertDescription>Alerts go to nobody until you choose recipients in the Fleet dashboard.</AlertDescription>
      </Alert>

      <section className="flex flex-col gap-4" aria-labelledby="setup-heading">
        <h2 id="setup-heading" className="text-heading-lg text-content-neutral-emphasis">Set up Clarion</h2>
        <Card>
          <CardContent>
            {/* Step 1 is done once anyone holds a Clarion license; the rest happen outside Iris. */}
            <Stepper value={stats().total > 0 ? 1 : 0} orientation="vertical" indicator="number">
              {steps.map((s, i) => (
                <StepperItem key={s.title} index={i}>
                  <StepperTrack>
                    <StepperIndicator />
                    <StepperSeparator />
                  </StepperTrack>
                  <StepperContent className="items-start gap-2 pb-6">
                    <StepperTitle>{s.title}</StepperTitle>
                    <StepperDescription>{s.body}</StepperDescription>
                    {s.action}
                  </StepperContent>
                </StepperItem>
              ))}
            </Stepper>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
