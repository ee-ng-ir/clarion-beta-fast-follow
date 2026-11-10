import { useMemo, useRef, useState } from "react"
import { ArrowUpRight, Settings } from "lucide-react"
import { Button, Card, CardContent, EmptyState, SegmentedControl, SegmentedControlItem } from "@ir/ui"
import { fleet } from "@/data/dashboard"
import { activeGroups } from "../alerts/groups"
import { getSettings } from "../settings/store"
import { notificationEmail, readPreviewRules } from "./template"

const WIDTH = { desktop: 600, phone: 375 } as const

/**
 * /email: the proactive notification email, full size, as the service desk gets
 * it. Built from today's largest Critical alert group and the notification rules
 * (the unsaved ones, when opened from Settings › Email).
 */
export function EmailPage() {
  const [rules] = useState(() => readPreviewRules() ?? getSettings().notify)
  const [width, setWidth] = useState<keyof typeof WIDTH>(() => (window.innerWidth < 640 ? "phone" : "desktop"))
  const [height, setHeight] = useState(900)
  const frame = useRef<HTMLIFrameElement>(null)
  const group = useMemo(() => activeGroups().filter((g) => g.severity === "critical").sort((a, b) => b.endpoints.length - a.endpoints.length)[0] ?? null, [])
  const email = group ? notificationEmail(group, rules, { origin: window.location.origin, tenant: fleet.workspace }) : null
  const fit = () => { const d = frame.current?.contentDocument; if (d) setHeight(d.documentElement.scrollHeight) }

  return (
    <div className="min-h-dvh bg-surface-app">
      <main className="flex w-full max-w-content-reading flex-col gap-6 px-4 py-8 md:px-8">
        <header className="flex flex-col gap-2">
          <p className="text-wordmark text-content-neutral-emphasis">Clarion</p>
          <h1 className="text-heading-xl text-content-neutral-emphasis">Notification email</h1>
          <p className="text-body-md text-content-neutral-muted">
            What your service desk receives when a Critical alert group meets your notification rules. Counts and locations only, the same for Interactive and Telemetry-only tenants.
          </p>
        </header>

        {!email ? (
          <Card><CardContent>
            <EmptyState illustration="issue-alerts" title="No Critical alert groups right now" description="The email is built from today's largest Critical group. Simulate an issue in the widget demo, then come back." />
          </CardContent></Card>
        ) : (
          <>
            <div className="flex flex-wrap items-center gap-3">
              <SegmentedControl aria-label="Width" value={width} onValueChange={(v) => v && setWidth(v as keyof typeof WIDTH)}>
                <SegmentedControlItem value="desktop">Desktop</SegmentedControlItem>
                <SegmentedControlItem value="phone">Phone</SegmentedControlItem>
              </SegmentedControl>
              <div className="ms-auto flex flex-wrap items-center gap-2">
                <Button variant="ghost" size="sm" asChild><a href="/settings?tab=notifications"><Settings aria-hidden />Email settings</a></Button>
                <Button variant="outline" size="sm" asChild><a href={`/issues?group=${encodeURIComponent(group!.id)}`}>Open the alert in Clarion <ArrowUpRight aria-hidden /></a></Button>
              </div>
            </div>

            <Card className="overflow-hidden">
              <CardContent className="gap-2 border-b border-line-neutral-subtle">
                <dl className="grid grid-cols-[5rem_1fr] gap-x-3 gap-y-1.5 text-body-sm">
                  <dt className="text-content-neutral-muted">From</dt><dd className="min-w-0 text-content-neutral-emphasis">Clarion &lt;alerts@clarion.ir.com&gt; <span className="text-content-neutral-subtle">(sender to confirm)</span></dd>
                  <dt className="text-content-neutral-muted">To</dt><dd className="min-w-0 break-words text-content-neutral-emphasis">{rules.recipients.join(", ") || "No recipients yet: nothing is sent"}</dd>
                  <dt className="text-content-neutral-muted">Subject</dt><dd className="min-w-0 text-label-md text-content-neutral-emphasis">{email.subject}</dd>
                  <dt className="text-content-neutral-muted">Preview</dt><dd className="min-w-0 truncate text-content-neutral-muted">{email.preheader}</dd>
                </dl>
              </CardContent>
              <div className="overflow-x-auto bg-surface-canvas p-4">
                <iframe ref={frame} title="Notification email" srcDoc={email.html} onLoad={fit}
                  width={WIDTH[width]} height={height}
                  className="block max-w-none border border-line-neutral-subtle bg-surface-card" />
              </div>
            </Card>
          </>
        )}
      </main>
    </div>
  )
}
