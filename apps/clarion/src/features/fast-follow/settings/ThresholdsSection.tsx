import { Badge, Card, CardDescription, CardHeader, CardHeaderText, CardTitle, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ir/ui"
import { ALERT_TYPES, categoryLabel, type AlertCategory } from "../alerts/catalogue"
import { AlertIcon } from "../alerts/bits"
import { isTypeOn, useSettings } from "./store"

const categories: AlertCategory[] = ["network", "system", "platform", "devices"]
const fmt = (v: number, unit: string, lowerIsWorse: boolean) => `${lowerIsWorse ? "Below" : "Above"} ${v}${unit}`

/**
 * Settings › Thresholds: the reading each alert type is raised at, read-only.
 * The thresholds are IR's for every endpoint; custom thresholds aren't in Fast
 * Follow. Where they'd sit if they come in is an IA question (X2).
 */
export function ThresholdsSection() {
  useSettings() // re-render when an alert type is turned on or off
  return (
    <div className="flex w-full max-w-content-reading flex-col gap-gutter">
      <p className="text-body-md text-content-neutral-muted">
        When Clarion raises each alert, for every endpoint. Alert stability decides how long a reading has to stay past its threshold before the alert is raised.
      </p>
      {categories.map((c) => {
        const types = ALERT_TYPES.filter((t) => t.category === c)
        return (
          <Card key={c}>
            <CardHeader>
              <CardHeaderText>
                <CardTitle>{categoryLabel[c]}</CardTitle>
                {c === "platform" && <CardDescription>Platform alerts are raised from each platform's call quality score or when it can't be reached.</CardDescription>}
              </CardHeaderText>
            </CardHeader>
            <Table size="sm" aria-label={`${categoryLabel[c]} thresholds`}>
              <TableHeader>
                <TableRow>
                  <TableHead align="start">Alert</TableHead>
                  <TableHead align="start">Reading</TableHead>
                  <TableHead align="start">Warning</TableHead>
                  <TableHead align="start">Critical</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {types.map((t) => {
                  const m = t.metric
                  return (
                    <TableRow key={t.id}>
                      <TableCell align="start">
                        <div className="flex items-center gap-3">
                          <AlertIcon icon={t.icon} severity="warning" />
                          <span className="flex flex-wrap items-center gap-1.5 text-label-md text-content-neutral-emphasis">
                            {t.warning}
                            {!isTypeOn(t.id) && <Badge>Off</Badge>}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell align="start" className="text-content-neutral-muted">{m ? m.name : "Status"}</TableCell>
                      {m ? (
                        <>
                          <TableCell align="start">{fmt(m.warn, m.unit, m.lowerIsWorse)}</TableCell>
                          <TableCell align="start">{fmt(m.crit, m.unit, m.lowerIsWorse)}</TableCell>
                        </>
                      ) : (
                        <TableCell align="start" colSpan={2} className="text-content-neutral-muted">No threshold. Raised when it happens; Critical is “{t.critical}”.</TableCell>
                      )}
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </Card>
        )
      })}
    </div>
  )
}
