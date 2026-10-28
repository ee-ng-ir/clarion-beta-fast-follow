import { useMemo, useState } from "react"
import { Filter, MailX } from "lucide-react"
import { Card, EmptyState, Select, Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@ir/ui"
import { PageTop } from "@/components/PageTop"
import { CopyButton, Mono, SearchField, StatusBadge } from "@/components/ui"
import { fmtDateTime } from "@/lib/format"
import { emailsByEnv, type EmailEvent } from "@/data/email"

const NONE: EmailEvent[] = []
const LABELS: Record<string, string> = { delivered: "Delivered", opened: "Opened", processed: "Processed", deferred: "Deferred", bounced: "Bounced", dropped: "Dropped" }

export function EmailActivityPage() {
  const emails = emailsByEnv.dev ?? NONE
  const [q, setQ] = useState("")
  const [statuses, setStatuses] = useState<string[]>([])

  const rows = useMemo(() => {
    const n = q.trim().toLowerCase()
    return emails.filter((e) => (!statuses.length || statuses.includes(e.status)) && (!n || `${e.to} ${e.subject} ${e.tenant ?? ""} ${e.messageId}`.toLowerCase().includes(n)))
  }, [emails, q, statuses])

  const statusOptions = Object.keys(LABELS).map((s) => ({ value: s, label: LABELS[s], detail: String(emails.filter((e) => e.status === s).length) }))
  const problems = emails.filter((e) => ["bounced", "dropped", "deferred"].includes(e.status)).length

  return (
    <div className="flex flex-col gap-gutter">
      <PageTop
        title="Email activity"
        description="The last 100 emails the platform sent, from SendGrid's Email Activity. Results can be up to 60 seconds old."
        meta={problems ? <span className="text-content-danger-emphasis">{problems} not delivered</span> : undefined}
      />

      {emails.length ? (
        <div className="flex flex-wrap items-center gap-2">
          <SearchField value={q} onChange={setQ} placeholder="Search recipient, subject, tenant or message ID" size="sm" className="sm:w-96" />
          <Select className="w-auto min-w-36" label="Status" icon={<Filter />} size="sm" options={statusOptions} value={statuses} onValueChange={setStatuses} showDetail />
        </div>
      ) : null}

      <Card className="overflow-hidden">
        {emails.length === 0 ? (
          <EmptyState
            icon={<MailX />}
            title="No email yet"
            description="SendGrid has no activity to show. Email Activity history has to be on, and outbound mail has to be tagged with the stage category."
            className="py-12"
          />
        ) : rows.length === 0 ? (
          <EmptyState size="sm" icon={<MailX />} title="No emails match" description="Clear the search or a status." className="py-12" />
        ) : (
          <Table size="sm">
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead align="start" className="border-t-0">Sent (AEDT)</TableHead>
                <TableHead align="start" className="border-t-0">Status</TableHead>
                <TableHead align="start" className="border-t-0">Recipient</TableHead>
                <TableHead align="start" className="border-t-0">Subject</TableHead>
                <TableHead align="start" className="border-t-0">Tenant</TableHead>
                <TableHead align="start" className="border-t-0">Message ID</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id} className="last:border-b-0">
                  <TableCell className="whitespace-nowrap"><Mono>{fmtDateTime(e.ts)}</Mono></TableCell>
                  <TableCell><StatusBadge status={e.status} /></TableCell>
                  <TableCell className="max-w-64"><span className="block truncate">{e.to}</span></TableCell>
                  <TableCell className="max-w-80"><span className="block truncate" title={e.subject}>{e.subject}</span><span className="text-body-xs text-content-neutral-muted">from {e.from}</span></TableCell>
                  <TableCell className="whitespace-nowrap">{e.tenant ?? <span className="text-content-neutral-subtle">—</span>}</TableCell>
                  <TableCell>
                    <span className="inline-flex items-center gap-1"><Mono className="max-w-40 truncate text-content-neutral-muted">{e.messageId}</Mono><CopyButton value={e.messageId} label="message ID" /></span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  )
}
