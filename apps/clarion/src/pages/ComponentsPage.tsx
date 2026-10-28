import { useState } from "react"
import {
  Check,
  Download,
  Plus,
  Search,
  Settings,
  Filter,
  Circle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Chip } from "@/components/ui/chip"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardAction,
  CardContent,
  CardFooter,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"

/**
 * Component gallery — the living source of truth for the primitives.
 *
 * This page IS the spec: every variant / size / state of Button, Chip and Card
 * rendered from the real components against the real tokens. The Vercel preview
 * replaces "eyeball it in Figma" — what you see here is exactly what ships.
 */

function Section({
  title,
  description,
  children,
}: {
  title: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-heading-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>
          {title}
        </h2>
        {description && (
          <p className="text-body-sm" style={{ color: "var(--fg-neutral-subtle)" }}>
            {description}
          </p>
        )}
      </div>
      {children}
    </section>
  )
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-label-xs" style={{ color: "var(--fg-neutral-subtle)" }}>
        {label}
      </span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  )
}

export function ComponentsPage() {
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<string[]>(["critical"])
  const [tokens, setTokens] = useState<string[]>(["us-east", "london", "tokyo"])
  const [sw, setSw] = useState(true)

  const toggleFilter = (id: string) =>
    setFilters((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]))

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-12 py-2">
      {/* ---------------- SWITCH ---------------- */}
      <Section
        title="Switch"
        description="Binary toggle. The off state keeps a filled neutral track + border so it's clearly visible (not invisible on the surface)."
      >
        <Row label="States">
          <Switch checked={sw} onCheckedChange={setSw} aria-label="Interactive switch" />
          <Switch checked={true} onCheckedChange={() => {}} aria-label="On" />
          <Switch checked={false} onCheckedChange={() => {}} aria-label="Off" />
          <Switch checked={true} disabled onCheckedChange={() => {}} aria-label="On disabled" />
          <Switch checked={false} disabled onCheckedChange={() => {}} aria-label="Off disabled" />
        </Row>
      </Section>

      {/* ---------------- BUTTON ---------------- */}
      <Section
        title="Button"
        description="Six variants · four sizes · loading + disabled. Hover/active map to the matching -hovered / -pressed tokens."
      >
        <Row label="Variants">
          <Button>Default</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="link">Link</Button>
        </Row>

        <Row label="Sizes">
          <Button size="sm">Small</Button>
          <Button size="default">Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Settings">
            <Settings />
          </Button>
        </Row>

        <Row label="With icons">
          <Button>
            <Plus /> New endpoint
          </Button>
          <Button variant="outline">
            <Download /> Export
          </Button>
          <Button variant="secondary">
            <Search /> Search
          </Button>
        </Row>

        <Row label="States">
          <Button disabled>Disabled</Button>
          <Button variant="outline" disabled>
            Disabled
          </Button>
          <Button loading>Saving</Button>
          <Button
            variant="outline"
            loading={loading}
            onClick={() => {
              setLoading(true)
              setTimeout(() => setLoading(false), 1600)
            }}
          >
            {loading ? "Working" : "Click to load"}
          </Button>
        </Row>
      </Section>

      {/* ---------------- CHIP ---------------- */}
      <Section
        title="Chip"
        description="The interactive sibling of Badge. Filter chips toggle selected; token chips remove. Shares Badge's role colours."
      >
        <Row label="Role variants (static)">
          <Chip variant="default">Default</Chip>
          <Chip variant="outline">Outline</Chip>
          <Chip variant="primary">Primary</Chip>
          <Chip variant="success">Healthy</Chip>
          <Chip variant="warning">Warning</Chip>
          <Chip variant="danger">Critical</Chip>
          <Chip variant="info">Info</Chip>
        </Row>

        <Row label="Sizes & leading content">
          <Chip size="sm" leading={<Circle />}>
            Small
          </Chip>
          <Chip size="md" leading={<Filter />}>
            Medium
          </Chip>
          <Chip
            leading={
              <span
                className="size-2 rounded-full"
                style={{ background: "var(--status-critical)" }}
              />
            }
          >
            Status dot
          </Chip>
        </Row>

        <Row label="Filter chips (click to toggle)">
          {[
            { id: "critical", label: "Critical" },
            { id: "warning", label: "Warning" },
            { id: "healthy", label: "Healthy" },
            { id: "offline", label: "Offline" },
          ].map((f) => {
            const on = filters.includes(f.id)
            return (
              <Chip
                key={f.id}
                selected={on}
                leading={on ? <Check /> : undefined}
                onClick={() => toggleFilter(f.id)}
              >
                {f.label}
              </Chip>
            )
          })}
        </Row>

        <Row label="Removable token chips">
          {tokens.length === 0 && (
            <span className="text-body-sm" style={{ color: "var(--fg-neutral-subtle)" }}>
              All cleared — refresh to reset.
            </span>
          )}
          {tokens.map((t) => (
            <Chip
              key={t}
              variant="primary"
              onRemove={() => setTokens((xs) => xs.filter((x) => x !== t))}
              removeLabel={`Remove ${t}`}
            >
              {t}
            </Chip>
          ))}
        </Row>
      </Section>

      {/* ---------------- CARD ---------------- */}
      <Section
        title="Card"
        description="Surface from --bg-card, line from --border-neutral-muted, --shadow-xs. Header / Title / Description / Action / Content / Footer slots."
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Network score</CardTitle>
              <CardDescription>Rolling 24-hour fleet average.</CardDescription>
            </CardHeader>
            <CardContent>
              <span className="text-metric-xl" style={{ color: "var(--fg-neutral-emphasis)" }}>
                98.2
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Open alerts</CardTitle>
              <CardDescription>Across all monitored locations.</CardDescription>
              <CardAction>
                <Badge variant="danger">3 critical</Badge>
              </CardAction>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-2">
              <Chip variant="danger" size="sm">
                Packet loss · 12
              </Chip>
              <Chip variant="warning" size="sm">
                Latency · 7
              </Chip>
            </CardContent>
            <CardFooter className="gap-2 pt-4">
              <Button size="sm">View alerts</Button>
              <Button size="sm" variant="ghost">
                Dismiss
              </Button>
            </CardFooter>
          </Card>
        </div>
      </Section>
    </div>
  )
}
