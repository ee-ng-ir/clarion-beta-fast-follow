// Outbound mail as SendGrid's Email Activity reports it for one STAGE category.
// The live dev stage currently returns nothing (mail isn't tagged yet), so the
// prototype fills dev and leaves the ephemeral envs empty to show both states.

export type EmailStatus = "delivered" | "processed" | "deferred" | "bounced" | "dropped" | "opened"

export interface EmailEvent {
  id: string
  ts: string
  status: EmailStatus
  to: string
  from: string
  subject: string
  messageId: string
  tenant?: string
}

const FROM = "no-reply@iris.ir.com"
const rows: [string, EmailStatus, string, string, string?][] = [
  ["2026-10-28T11:52:10+11:00", "delivered", "james.lawson@harbourbank.com.au", "You've been invited to Iris", "Harbour Bank"],
  ["2026-10-28T11:20:44+11:00", "opened", "louis.martin@kestrelair.com", "Your Clarion trial ends in 15 days", "Kestrel Airlines"],
  ["2026-10-28T10:05:03+11:00", "delivered", "laura.bennett@meridian.co.uk", "Reset your Iris password", "Meridian Insurance"],
  ["2026-10-28T09:41:57+11:00", "bounced", "ops@summitsuper.com.au", "You've been invited to Iris", "Summit Super"],
  ["2026-10-28T08:12:30+11:00", "deferred", "it-alerts@northwindhealth.org", "3 endpoints need attention", "Northwind Health"],
  ["2026-10-27T17:33:19+11:00", "delivered", "arief.rohman@harbourbank.com.au", "Your Clarion plan renews on 9 Nov", "Harbour Bank"],
  ["2026-10-27T16:02:48+11:00", "processed", "jay.verma@lumen.gov.au", "Reminder: finish setting up Iris", "Lumen Government Services"],
  ["2026-10-27T14:45:11+11:00", "delivered", "marco.rossi@pacificfreight.com", "Your Iris sign-in code", "Pacific Freight"],
  ["2026-10-27T11:09:37+11:00", "dropped", "noreply@example.invalid", "You've been invited to Iris"],
  ["2026-10-27T10:47:02+11:00", "opened", "ee.ng@ir.com", "Your Iris sign-in code", "Clarion Demo"],
  ["2026-10-26T15:30:15+11:00", "delivered", "it.support@acme.com", "Send email to IT: Jordan's headset keeps disconnecting", "Acme Contact Centre"],
  ["2026-10-26T09:18:52+11:00", "delivered", "james.liu@sxtelco.com.au", "Widget licences at 44%", "Southern Cross Telco"],
]

export const emailsByEnv: Record<string, EmailEvent[]> = {
  dev: rows.map(([ts, status, to, subject, tenant], i) => ({
    id: `em${i}`,
    ts,
    status,
    to,
    from: FROM,
    subject,
    tenant,
    messageId: `${(0x5f3a2c + i * 7919).toString(16)}.${(0x1d2b + i * 131).toString(16)}.filterdrecv-7b9c${i}`,
  })),
}
