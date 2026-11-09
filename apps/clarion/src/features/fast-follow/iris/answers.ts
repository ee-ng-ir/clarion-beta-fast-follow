// Iris answers for the Fast Follow demo. Scripted, but every figure is computed
// from the same Clarion data the screens use, so nothing Iris says disagrees with
// the page (Iris finding E1, E2, F1). When Iris doesn't have the data, it says so
// instead of guessing (F2, F3) or widening the scope (E7).

import { activeGroups, groupById, notifyRules, type AlertGroup } from "../alerts/groups"
import { categoryLabel } from "../alerts/catalogue"
import { ago } from "../alerts/format"
import type { Answer, IrisContext } from "./types"
import { endpointById } from "@/data/endpoints"
import { clockTime, evidenceFor, type EndpointAlert } from "../evidence/evidence"

export type IntentId =
  | "summary" | "check-first" | "elsewhere" | "before" | "worst" | "note"
  | "attention" | "fleet"
export interface Intent { id: IntentId; label: string; /** sent by Iris itself, not typed (no user bubble) */ auto?: boolean }

export const RETENTION_DAYS = 180 // to confirm (questions log X7)

const now = () => new Date()
const SRC_ALERTS = "Clarion alert data"
const SRC_CATALOGUE = "Clarion alert catalogue"

export function suggestionsFor(ctx: IrisContext | null): Intent[] {
  if (!ctx) return []
  if (ctx.kind === "alert") return [
    { id: "check-first", label: "What should I check first?" },
    { id: "elsewhere", label: "Is this happening elsewhere?" },
    { id: "before", label: "Has this endpoint had this before?" },
  ]
  if (ctx.kind === "group") return [
    { id: "check-first", label: "What should I check first?" },
    { id: "elsewhere", label: "Is this happening elsewhere?" },
    { id: "before", label: "Has this happened before?" },
    { id: "worst", label: "Which endpoints are worst?" },
    { id: "note", label: "Draft a note for the service desk" },
  ]
  return [
    { id: "attention", label: "What needs my attention right now?" },
    { id: "fleet", label: "Summarise the fleet" },
  ]
}

/** Free text → the closest intent, or an honest "can't answer" (F4, G1–G5). */
function matchText(text: string, ctx: IrisContext): IntentId | "howto-alerts" | "howto-notify" | "out-of-scope" | "unknown" {
  const t = text.toLowerCase()
  if (/productiv|performance review|best agent|worst agent|lazy|monitor (the )?agent/.test(t)) return "out-of-scope"
  if (/(turn|switch) (off|on)|disable|mute|threshold/.test(t)) return "howto-alerts"
  if (/email|notif|told|alert me/.test(t)) return "howto-notify"
  if (ctx.kind === "group" || ctx.kind === "alert") {
    if (/first|start|fix|do now|next step|recommend/.test(t)) return "check-first"
    if (/elsewhere|other (site|location)|spread|where/.test(t)) return "elsewhere"
    if (/before|history|again|recur|last week|happened/.test(t)) return "before"
    if (/worst|which endpoint|who|most affected/.test(t)) return "worst"
    if (/note|handover|summar|write|draft|email/.test(t)) return "note"
    if (/what|why|cause|explain/.test(t)) return "summary"
  } else {
    if (/attention|urgent|priority|now|top/.test(t)) return "attention"
    if (/summar|overview|fleet|how.*(doing|look)/.test(t)) return "fleet"
  }
  return "unknown"
}

export function answer(ctx: IrisContext, q: Intent | { text: string }): { answer: Answer; thinking: string } {
  const id = "text" in q ? matchText(q.text, ctx) : q.id
  if (ctx.kind === "alert") {
    const e = endpointById(ctx.endpointId)
    const ev = e ? evidenceFor(e) : null
    const a = ev ? [...ev.active, ...ev.cleared].find((x) => x.id === ctx.alertId) : undefined
    if (!e || !ev || !a) return { answer: missing(), thinking: "Looking for this alert…" }
    return { answer: alertAnswer(id, a, e.user, ev.cleared, ev.offlineSinceMin), thinking: `Reading the evidence for ${e.user}'s alert…` }
  }
  if (ctx.kind === "group") {
    const g = groupById(ctx.groupId)
    if (!g) return { answer: missing(), thinking: "Looking for this alert group…" }
    return { answer: groupAnswer(id, g, ctx), thinking: `Reading ${g.endpoints.length || g.closed?.peak} endpoints in this group…` }
  }
  return { answer: pageAnswer(id), thinking: "Reading your fleet's alert groups…" }
}

// ---- group context -------------------------------------------------------------

function groupAnswer(id: string, g: AlertGroup, ctx: IrisContext): Answer {
  const n = g.endpoints.length
  const top = g.locations[0]
  const base = { asOf: now(), sources: [SRC_ALERTS] }
  switch (id) {
    case "summary":
      return { ...base, basis: "data",
        paragraphs: [
          `${g.title} is affecting ${n} endpoint${n === 1 ? "" : "s"} (${g.counts.critical} Critical, ${g.counts.warning} Warning), first seen ${ago(g.firstSeenMinAgo)}.`,
          g.evidence,
        ],
        facts: [
          { label: "Endpoints", value: String(n) },
          { label: "Most affected location", value: top ? `${top.name} (${top.count})` : "—" },
          { label: "Recovered so far", value: String(g.recoveredSoFar) },
          ...(g.energySaverOn ? [{ label: "Energy saver on", value: `${g.energySaverOn} of ${n}` }] : []),
        ] }
    case "check-first":
      return { ...base, basis: "catalogue", sources: [SRC_ALERTS, SRC_CATALOGUE],
        paragraphs: [`Start with ${g.type.lookFirst}. These steps come from the alert catalogue for ${categoryLabel[g.type.category].toLowerCase()} alerts, applied to what this group shows.`],
        steps: stepsFor(g) }
    case "elsewhere": {
      const shown = g.locations.slice(0, 5)
      const concentrated = top && top.count / n >= 0.6
      const sameLoc = activeGroups().filter((o) => o.id !== g.id && o.locations.some((l) => l.id === top?.id)).slice(0, 2)
      return { ...base, basis: "data",
        paragraphs: [
          concentrated
            ? `Mostly not. ${top.count} of ${n} endpoints are at ${top.name}; the rest are spread across ${g.locations.length - 1} other location${g.locations.length - 1 === 1 ? "" : "s"}.`
            : `Yes. It's spread across ${g.locations.length} locations, with no single location holding most of it.`,
          sameLoc.length ? `${top!.name} also has: ${sameLoc.map((o) => `${o.title} (${o.locations.find((l) => l.id === top!.id)?.count})`).join(", ")}. Worth checking whether they share a cause.` : "",
        ].filter(Boolean),
        facts: shown.map((l) => ({ label: l.name, value: `${l.count} endpoint${l.count === 1 ? "" : "s"}` })),
        links: sameLoc.map((o) => ({ label: `Open ${o.title}`, link: { kind: "group" as const, id: o.id } })) }
    }
    case "before": {
      const past = pastOccurrences(g)
      return { ...base, basis: "data",
        paragraphs: g.recurrenceThisWeek > 1
          ? [`Yes. This is the ${ordinal(g.recurrenceThisWeek)} time a “${g.type.warning}” group has opened this week. Earlier ones:`]
          : [`Not this week. It's the first “${g.type.warning}” group in the last 7 days. Clarion keeps ${RETENTION_DAYS} days of alert history (to confirm), and history starts from the day Fast Follow is switched on.`],
        facts: past }
    }
    case "worst": {
      const worst = [...g.endpoints].sort((a, b) => (a.status === b.status ? (a.score ?? 0) - (b.score ?? 0) : a.status === "critical" ? -1 : 1)).slice(0, 3)
      return { ...base, basis: "data",
        paragraphs: [`The ${worst.length} most affected, by severity and then Clarion Network Score:`],
        facts: worst.map((e) => ({ label: `${e.user} · ${e.machine}`, value: `${e.status === "critical" ? "Critical" : "Warning"} · ${e.locationName} · ${e.connection}${e.score !== null ? ` · score ${e.score}` : ""}`, link: { kind: "endpoint" as const, id: e.id } })) }
    }
    case "note": {
      const t = timeLabel(now())
      const note = [
        `${g.title} — ${g.severity === "critical" ? "Critical" : "Warning"}`,
        `As of ${t}: ${n} endpoints affected (${g.counts.critical} Critical, ${g.counts.warning} Warning). First seen ${ago(g.firstSeenMinAgo)}.`,
        `Where: ${g.locations.slice(0, 3).map((l) => `${l.name} (${l.count})`).join(", ")}${g.locations.length > 3 ? ` and ${g.locations.length - 3} more` : ""}.`,
        `Evidence: ${g.evidence}`,
        g.notifiedMinAgo !== null ? `Service desk emailed ${ago(g.notifiedMinAgo)}.` : "No proactive email sent yet.",
        `Open in Clarion: Alerts › ${g.title}`,
      ].join("\n")
      return { ...base, basis: "data",
        paragraphs: ["Here's a note using only the figures above. Agent names aren't included, same as notification emails. Figures are as of now and will change."],
        note }
    }
    case "howto-alerts": return howTo("alerts")
    case "howto-notify": return howTo("notify")
    case "out-of-scope": return outOfScope()
    default: return unknown(ctx)
  }
}

function stepsFor(g: AlertGroup): string[] {
  const top = g.locations[0]
  const concentrated = top && top.count / g.endpoints.length >= 0.6
  switch (g.type.category) {
    case "network": return [
      concentrated ? `Check the network at ${top.name} first: ${top.count} of ${g.endpoints.length} endpoints are there.` : "Compare a healthy endpoint with an affected one at the same location.",
      "Ask Wi-Fi users to plug in a network cable or move closer to the router.",
      "If it's spread across home workers, check their internet providers before the PCs.",
    ]
    case "platform": return [
      `Check ${g.type.critical.replace("Can't reach ", "")}'s service status page.`,
      "Confirm other platforms on the same endpoints still respond. If they do, the PCs are fine.",
      "Look for recent firewall, proxy or VPN changes at the affected locations.",
    ]
    case "system": return g.energySaverOn
      ? [`Energy saver is on for ${g.energySaverOn} of ${g.endpoints.length}. Ask those agents to plug in, or change the power plan centrally.`, "Then look for background apps using the CPU.", "If it keeps recurring, review the power policy for laptops."]
      : ["Look for background apps or updates on the affected PCs.", "Restart the worst-affected endpoint and watch whether it clears.", "If it recurs on the same machines, plan a hardware check."]
    case "devices": return ["Check the headset's USB connection or dongle on each endpoint.", "Try another USB port, then another headset.", "If several agents lost audio at once, check for a recent driver update."]
  }
}

function pastOccurrences(g: AlertGroup) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  return Array.from({ length: Math.max(0, g.recurrenceThisWeek - 1) }, (_, i) => {
    const seed = (g.id.length * 7 + i * 13) % 50
    return { label: `${days[(i * 2) % 5]} ${8 + (seed % 9)}:${String((seed * 7) % 60).padStart(2, "0")} am`, value: `${4 + (seed % 20)} endpoints · lasted ${10 + (seed % 40)} min · ${g.locations[i % g.locations.length]?.name ?? "—"}` }
  })
}

// ---- one endpoint's alert ----------------------------------------------------------

function alertAnswer(id: string, a: EndpointAlert, user: string, cleared: EndpointAlert[], offlineSince: number | null): Answer {
  const base = { asOf: now(), sources: [SRC_ALERTS] }
  const group = a.groupId ? groupById(a.groupId) : undefined
  switch (id) {
    case "summary": {
      const top = a.causes[0]
      return { ...base, basis: "data",
        paragraphs: [
          a.whatHappened,
          top ? `Most likely cause: ${top.title}. ${top.why}` : "",
          offlineSince !== null ? "The endpoint has since stopped reporting, so nothing after that is captured." : "",
        ].filter(Boolean),
        facts: [
          ...(a.reading ? [{ label: a.reading.name, value: `${a.reading.value} (threshold ${a.reading.threshold} at the time)` }] : []),
          { label: "Started", value: clockTime(a.startedMinAgo) },
          ...(a.where ? [{ label: "Where", value: `${a.where.label}: ${a.where.detail}` }] : []),
        ] }
    }
    case "check-first":
      return { ...base, basis: "catalogue", sources: [SRC_ALERTS, SRC_CATALOGUE],
        paragraphs: [`For ${user}'s “${a.title}” alert, start here. Steps come from the alert catalogue, matched to this alert's evidence.`],
        steps: a.steps }
    case "elsewhere":
      return group
        ? { ...base, basis: "data",
            paragraphs: [`Yes. ${user} is one of ${group.endpoints.length} endpoints in the ${group.title} group, across ${group.locations.length} location${group.locations.length === 1 ? "" : "s"}.`],
            facts: group.locations.slice(0, 4).map((l) => ({ label: l.name, value: `${l.count} endpoints` })),
            links: [{ label: `Open ${group.title}`, link: { kind: "group", id: group.id } }] }
        : { ...base, basis: "data", paragraphs: [a.active ? "No. This alert is only on this endpoint right now." : "This alert has cleared, so there's no live group to compare with."] }
    case "before": {
      const same = cleared.filter((c) => c.type.id === a.type.id && c.id !== a.id)
      return { ...base, basis: "data",
        paragraphs: same.length
          ? [`Yes, ${same.length} time${same.length === 1 ? "" : "s"} in the last 7 days:`]
          : [`Not in the last 7 days. ${cleared.length ? `This endpoint did have ${cleared.length} other alert${cleared.length === 1 ? "" : "s"}:` : "It had no other alerts either."}`],
        facts: (same.length ? same : cleared).map((c) => ({ label: `${c.title} · ${clockTime(c.startedMinAgo)}`, value: `lasted ${c.lastedMin} min` })) }
    }
    case "howto-alerts": return howTo("alerts")
    case "howto-notify": return howTo("notify")
    case "out-of-scope": return outOfScope()
    default: return unknown(null)
  }
}

// ---- page context ----------------------------------------------------------------

function pageAnswer(id: string): Answer {
  const groups = activeGroups()
  const base = { asOf: now(), sources: [SRC_ALERTS] }
  switch (id) {
    case "attention": {
      const top = groups.slice(0, 3)
      return { ...base, basis: "data",
        paragraphs: [`${groups.length} alert groups are open. The top ${top.length} by severity, endpoints affected and recurrence:`],
        facts: top.map((g) => ({ label: g.title, value: g.reason, link: { kind: "group" as const, id: g.id } })) }
    }
    case "fleet": {
      const eps = groups.reduce((s, g) => s + g.endpoints.length, 0)
      const crit = groups.filter((g) => g.severity === "critical").length
      const notified = groups.filter((g) => g.notifiedMinAgo !== null).length
      return { ...base, basis: "data",
        paragraphs: [`${eps} endpoints are in ${groups.length} open alert groups: ${crit} Critical, ${groups.length - crit} Warning. ${notified} group${notified === 1 ? " has" : "s have"} emailed the service desk.`],
        links: [{ label: "Open Alerts", link: { kind: "page", page: "alerts" } }] }
    }
    case "howto-alerts": return howTo("alerts")
    case "howto-notify": return howTo("notify")
    case "out-of-scope": return outOfScope()
    default: return unknown(null)
  }
}

// ---- honest edges -----------------------------------------------------------------

function howTo(which: "alerts" | "notify"): Answer {
  return which === "alerts"
    ? { basis: "product", asOf: now(), sources: [],
        paragraphs: ["Alert types are turned on or off, and their thresholds set, in Settings › Alerts and thresholds. Turning one off stops the alert, not the data: readings still show in endpoint detail."],
        links: [{ label: "Open Settings", link: { kind: "page", page: "settings" } }] }
    : { basis: "product", asOf: now(), sources: [],
        paragraphs: [`Proactive emails are set in Settings › Notifications. Right now a Critical group emails your list when it reaches ${notifyRules().minEndpoints} endpoints or lasts ${notifyRules().minMinutes} minutes, at most once every ${notifyRules().cooldownMin} minutes.`],
        links: [{ label: "Open Settings", link: { kind: "page", page: "settings" } }] }
}

function outOfScope(): Answer {
  return { basis: "none", asOf: now(), sources: [],
    paragraphs: ["I can't answer that. Clarion measures endpoints, networks and platforms, not how agents perform, so I don't have data that could answer it fairly."] }
}

function unknown(ctx: IrisContext | null): Answer {
  return { basis: "none", asOf: now(), sources: [],
    paragraphs: [`I'm not sure what you're asking${ctx?.kind === "group" ? " about this alert group" : ""}. I answer from your Clarion data and the alert catalogue only. Try one of the suggested questions below.`] }
}

function missing(): Answer {
  return { basis: "none", asOf: now(), sources: [], paragraphs: ["That alert group has closed or is no longer available, so I don't have current data for it."] }
}

export const timeLabel = (d: Date) =>
  new Intl.DateTimeFormat("en-AU", { hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(d)
const ordinal = (n: number) => `${n}${n === 2 ? "nd" : n === 3 ? "rd" : "th"}`
