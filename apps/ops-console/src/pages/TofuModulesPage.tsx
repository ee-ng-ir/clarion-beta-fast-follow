import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Badge, Card, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ir/ui"
import { PageTop } from "@/components/PageTop"
import { Mono } from "@/components/ui"
import { STAGE, STATE_BUCKET, services, tofuEnvs } from "@/data/catalog"

const utc = (iso: string) => {
  const d = new Date(iso)
  const m = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"][d.getUTCMonth()]
  return `${d.getUTCDate()} ${m} ${d.getUTCFullYear()}, ${String(d.getUTCHours()).padStart(2, "0")}:${String(d.getUTCMinutes()).padStart(2, "0")} UTC`
}

const KIND = { shared: { label: "Shared", color: "info" }, ephemeral: { label: "Ephemeral", color: "neutral" }, global: { label: "Account / region", color: "warning" } } as const

/** Raw OpenTofu state by environment, read-only. Every env with state in this stage's bucket, not just the Lattice ones. */
export function TofuModulesPage() {
  return (
    <div className="flex flex-col gap-gutter">
      <PageTop
        title="Tofu modules"
        description="Raw OpenTofu state keys by environment. Read-only: this shows which modules have state, and when it last changed."
      />

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-line-neutral-muted px-6 py-3 text-body-sm text-content-neutral-muted">
          <span>Bucket <Mono className="text-content-neutral-emphasis">{STATE_BUCKET}</Mono></span>
          <span>Stage <Mono className="text-content-neutral-emphasis">{STAGE}</Mono></span>
        </div>
        <Accordion type="multiple" defaultValue={["dev"]} className="flex flex-col gap-4 px-6 py-4">
          {tofuEnvs.map((e, i) => {
            const mods = Object.entries(e.modules)
            const missing = e.kind === "global" ? [] : services.map((s) => s.id).filter((id) => !(id in e.modules))
            return (
              <AccordionItem key={e.env} value={e.env} divider={i > 0} className={i > 0 ? "pt-4" : undefined}>
                <AccordionTrigger>
                  <span className="flex flex-wrap items-center gap-2 text-start">
                    <Mono className="text-label-lg">{e.env}</Mono>
                    <Badge color={KIND[e.kind].color}>{KIND[e.kind].label}</Badge>
                    <span className="text-body-sm text-content-neutral-muted">
                      {mods.length + (e.infraAt ? 1 : 0)} modules{e.infraAt ? ` · shared infra ${utc(e.infraAt)}` : ""}
                    </span>
                  </span>
                </AccordionTrigger>
                <AccordionContent className="pt-3">
                  <Table size="sm">
                    <TableHeader>
                      <TableRow className="hover:bg-transparent">
                        <TableHead align="start">Module</TableHead>
                        <TableHead align="start">Kind</TableHead>
                        <TableHead align="start">State last modified</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {e.infraAt ? (
                        <TableRow><TableCell><Mono>infrastructure</Mono></TableCell><TableCell>Shared infra</TableCell><TableCell><Mono>{utc(e.infraAt)}</Mono></TableCell></TableRow>
                      ) : null}
                      {mods.map(([m, at]) => (
                        <TableRow key={m}><TableCell><Mono>{m}</Mono></TableCell><TableCell>{e.kind === "global" ? "Account" : "Service"}</TableCell><TableCell><Mono>{utc(at)}</Mono></TableCell></TableRow>
                      ))}
                      {missing.map((m) => (
                        <TableRow key={m} className="last:border-b-0">
                          <TableCell><Mono className="text-content-neutral-muted">{m}</Mono></TableCell>
                          <TableCell className="text-content-neutral-muted">Service</TableCell>
                          <TableCell><Badge>No state</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </AccordionContent>
              </AccordionItem>
            )
          })}
        </Accordion>
      </Card>
    </div>
  )
}
