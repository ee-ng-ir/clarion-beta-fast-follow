// The proactive notification email, in the clarion-emails shell: banner, title,
// greeting, short paragraphs, one button, sign-off, hairline, footer — all
// left-aligned on white. Poppins (Lato fallback), Rich Grey #161618 text and
// button, Purple #852CAA for the callout rule, Line Grey #E6E7E8 hairline.
// Counts and locations only: never agent or machine names (Alerts epic rule 7).

import type { AlertGroup } from "../alerts/groups"
import type { NotifySettings } from "../settings/store"

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!)
const FONT = "Poppins, Lato, Helvetica, Arial, sans-serif"
const INK = "#161618"

export interface EmailModel {
  subject: string
  preheader: string
  html: string
}

const clock = (minAgo: number) => new Date(Date.now() - minAgo * 60000).toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })

export function notificationEmail(g: AlertGroup, rules: NotifySettings, opts: { origin: string; tenant: string }): EmailModel {
  const n = g.endpoints.length
  const top = g.locations.slice(0, 3).map((l) => `${l.name} (${l.count})`).join(", ")
  const where = g.locations.length > 3 ? `${top} and ${g.locations.length - 3} more` : top
  const firstWhere = g.locations[0]?.name ?? ""
  const why = g.notifiedReason ?? (n >= rules.minEndpoints ? `${rules.minEndpoints} or more endpoints affected` : `Critical for more than ${rules.minMinutes} minutes`)
  const subject = `Clarion · Critical: ${g.title} affecting ${n} endpoints – ${firstWhere}`
  const preheader = `${g.title} on ${n} endpoints since ${clock(g.firstSeenMinAgo)}. ${g.evidence}`
  const link = `${opts.origin}/issues?group=${encodeURIComponent(g.id)}`
  const asset = (f: string) => `${opts.origin}/email/${f}`

  const p = (html: string, extra = "") => `<tr><td style="padding:0 0 18px 0;font-family:${FONT};font-size:16px;line-height:25px;color:${INK};text-align:left;${extra}">${html}</td></tr>`
  const fact = (label: string, value: string) => `<tr><td style="padding:0 0 12px 0;font-family:${FONT};text-align:left;"><div style="font-size:13px;line-height:20px;font-weight:600;color:${INK};">${esc(label)}</div><div style="font-size:15px;line-height:23px;color:${INK};">${value}</div></td></tr>`
  const small = (html: string, pad = "0 0 8px 0") => `<tr><td style="padding:${pad};font-family:${FONT};font-size:12px;line-height:18px;font-weight:300;color:${INK};text-align:left;">${html}</td></tr>`
  const social = (file: string, href: string, alt: string, last = false) =>
    `<a href="${href}" style="display:inline-block;margin-right:${last ? 0 : 8}px;"><img src="${asset(file)}" width="32" height="32" alt="${alt}" style="display:block;border:0;" /></a>`

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width,initial-scale=1" />
<title>${esc(subject)}</title>
<link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600&family=Lato:wght@400;700&display=swap" rel="stylesheet" />
<style>
  body { margin:0; padding:0; background:#FFFFFF; }
  a { color:${INK}; }
  @media only screen and (max-width:480px) { .pad-x { padding-left:22px !important; padding-right:22px !important; } .title { font-size:26px !important; line-height:33px !important; } }
</style></head>
<body>
<div style="display:none;max-height:0;overflow:hidden;">${esc(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#FFFFFF;">
<tr><td>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;margin:0;background:#FFFFFF;">
  <tr><td style="background:#4B5FBF;padding:0;">
    <a href="${opts.origin}/"><img src="${asset("clarion-email-banner.jpg")}" width="600" alt="Clarion — powered by Iris · Integrated Research" style="display:block;width:100%;max-width:600px;height:auto;border:0;color:#FFFFFF;font-family:${FONT};font-size:15px;" /></a>
  </td></tr>
  <tr><td class="pad-x" style="padding:40px 40px 0 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td class="title" style="padding:0 0 22px 0;font-family:${FONT};font-size:30px;line-height:38px;font-weight:600;letter-spacing:-0.3px;color:${INK};text-align:left;">${esc(g.title)} on ${n} endpoints</td></tr>
      ${p("Hi Service Desk,")}
      ${p(`Clarion raised a <strong>Critical</strong> alert at ${clock(g.firstSeenMinAgo)} and it's still active. It's affecting ${n} endpoints${firstWhere ? `, most of them in ${esc(firstWhere)}` : ""}.`)}
      <tr><td style="padding:4px 0 18px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr><td style="border-left:3px solid #852CAA;padding:2px 0 0 18px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
              ${fact("Where", esc(where))}
              ${fact("What the evidence shows", esc(g.evidence))}
              ${fact("Why you got this", `${esc(why)}. Your rules: ${rules.minEndpoints}+ endpoints, or Critical for over ${rules.minMinutes} minutes.`)}
            </table>
          </td></tr>
        </table>
      </td></tr>
      <tr><td style="padding:4px 0 22px 0;">
        <a href="${link}" style="display:inline-block;background:${INK};color:#FFFFFF;font-family:${FONT};font-size:15px;line-height:20px;font-weight:600;text-decoration:none;padding:13px 24px;border-radius:6px;">View in Clarion</a>
      </td></tr>
      ${p(`It opens this alert group after you sign in. You won't get another email about it for ${rules.cooldownMin} minutes, however much it grows. Agent and machine names stay in Clarion, behind sign-in.`, "font-size:14px;line-height:22px;")}
      ${p(`Kind regards,<br /><strong>Clarion</strong>`, "padding-top:8px;")}
    </table>
  </td></tr>
  <tr><td class="pad-x" style="padding:36px 40px 0 40px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
      <tr><td style="border-top:1px solid #E6E7E8;padding:24px 0 0 0;font-size:0;line-height:0;">&nbsp;</td></tr>
      ${small(`<a href="https://admin.ir.com/resource-centre" style="color:${INK};text-decoration:underline;">Resource centre</a> &nbsp;·&nbsp; <a href="https://www.ir.com/legal/privacy-policy" style="color:${INK};text-decoration:underline;">Privacy policy</a> &nbsp;·&nbsp; <a href="${opts.origin}/settings?tab=notifications" style="color:${INK};text-decoration:underline;">Notification settings</a>`)}
      ${small(`You received this email because you're a notification recipient for ${esc(opts.tenant)} in Clarion.`, "0 0 4px 0")}
      ${small("IR Level 9, 420 George Street Sydney NSW 2000 Australia", "0 0 20px 0")}
      <tr><td style="padding:0 0 40px 0;text-align:left;">${social("social-linkedin.png", "https://www.linkedin.com/company/ir/", "IR on LinkedIn")}${social("social-x.png", "https://x.com/", "X")}${social("social-facebook.png", "https://www.facebook.com/IRWeAre", "IR on Facebook")}${social("social-youtube.png", "https://www.youtube.com/c/IR_WeAre", "IR on YouTube", true)}</td></tr>
    </table>
  </td></tr>
</table>
</td></tr>
</table>
</body></html>`
  return { subject, preheader, html }
}

// ---- handoff from Settings › Notifications (unsaved draft rules) -------------

const DRAFT_KEY = "ff:email-preview-rules:v1"
export function stashPreviewRules(rules: NotifySettings) { try { localStorage.setItem(DRAFT_KEY, JSON.stringify(rules)) } catch { /* falls back to saved rules */ } }
export function readPreviewRules(): NotifySettings | null {
  try { const v = localStorage.getItem(DRAFT_KEY); return v ? (JSON.parse(v) as NotifySettings) : null } catch { return null }
}
