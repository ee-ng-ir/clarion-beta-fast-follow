// Iris builds a dashboard from a plain request ("headsets that aren't approved").
import { listName } from "../alerts/names"
// It doesn't invent a new kind of dashboard: it picks one of the three Clarion
// already has and sets its filters, so what Iris builds is exactly what you'd get
// filtering by hand, and you can change it afterwards. Every figure Iris quotes is
// read from the same data the dashboard shows.

import { approvedHeadsets } from "@ir/telemetry"
import { endpoints } from "@/data/endpoints"
import { ALERT_TYPES, alertType } from "../alerts/catalogue"
import { complianceFor } from "../headsets/headsets"
import { commonAlerts, dayDate, endpointsIn, filtered, fmtRange, HISTORY_DAYS, historyStart, inventoryFor, isoDay, LOCATIONS, locationName, spanOf, weekly, type DayRange } from "../dashboards/data"
import { describeSaved } from "../dashboards/describe"
import { type AnyDashState, type DashId, type SavedDashboard } from "../dashboards/store"
import type { Answer } from "./types"

/** A dashboard Iris has built: one of the existing three, with its filters set. Not saved until you save it. */
export interface BuiltDashboard {
  name: string
  view: DashId
  state: Partial<AnyDashState>
  /** "Last 30 days · All locations", the same line a saved dashboard shows */
  summary: string
  metric: string
  metricLabel: string
  spark?: number[]
  bars?: number[]
}

/** What Iris suggests building, on the Dashboards page and in the panel. Same four in both places. */
export const BUILD_SUGGESTIONS = ["Weak Wi-Fi by site", "Headsets that aren't approved", "Call quality this week", "Alerts that keep coming back"]

const SRC_HISTORY = "Clarion alert history"
const SRC_INVENTORY = "Clarion device inventory"
const now = () => new Date()
const pct = (n: number, of: number) => Math.round((n / Math.max(1, of)) * 100)
const plural = (n: number, w: string) => `${n.toLocaleString()} ${w}${n === 1 ? "" : "s"}`

/** "this week" → 7, "this month" → 30, "quarter" → 90. Undefined when no period is named. */
function period(t: string): number | undefined {
  if (/\b(today|this week|last week|7 ?days?|week)\b/.test(t)) return 7
  if (/\b(60 ?days?|two months|2 months)\b/.test(t)) return 60
  if (/\b(90 ?days?|quarter|3 months|three months)\b/.test(t)) return 90
  if (/\b(month|30 ?days?)\b/.test(t)) return 30
  return undefined
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"]
/** "31 October", "31st Oct", "Oct 31" → that date this year (last year if it's still ahead). */
function dateIn(t: string): Date | undefined {
  const m = t.match(/\b(\d{1,2})(?:st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*/) ??
    t.match(/\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{1,2})(?:st|nd|rd|th)?\b/)
  if (!m) return undefined
  const [day, mon] = /\d/.test(m[1]) ? [Number(m[1]), m[2]] : [Number(m[2]), m[1]]
  const d = new Date(new Date().getFullYear(), MONTHS.indexOf(mon), day)
  if (d > dayDate(0)) d.setFullYear(d.getFullYear() - 1)
  return d
}
/**
 * A request's own dates: "since 31 October" (to today), or "from 1 Oct to 15 Oct".
 * Iris sets them as the dashboard's custom period, so it opens, and saves, on
 * exactly those days (PO, 11 Nov). Kept inside the history.
 */
function rangeIn(t: string): DayRange | undefined {
  const between = t.match(/\b(?:from|between)\s+(.+?)\s+(?:to|and|until|-)\s+(.+)/)
  const since = t.match(/\b(?:since|from|after)\s+(.+)/)
  const from = between ? dateIn(between[1]) : since ? dateIn(since[1]) : undefined
  if (!from) return undefined
  const to = (between && dateIn(between[2])) || dayDate(0)
  const first = from < historyStart() ? historyStart() : from
  return { from: isoDay(first), to: isoDay(to < first ? first : to) }
}

function places(t: string): string[] {
  return LOCATIONS.filter((l) => t.includes(l.name.toLowerCase().split(" ")[0]) || (l.id === "manilla" && t.includes("manila"))).map((l) => l.id)
}

/** Which alert a request is about, if it names one. */
function alertIn(t: string): string | undefined {
  if (/wi-?fi|wireless/.test(t)) return "wifi"
  if (/call quality|jitter|packet loss|latency/.test(t)) return "call-quality"
  if (/cpu|busy|overload/.test(t)) return "cpu"
  if (/memory|\bram\b/.test(t)) return "memory"
  if (/storage|disk/.test(t)) return "storage"
  if (/battery/.test(t)) return "battery"
  if (/headset problem|audio device|no headphones/.test(t)) return "audio-device"
  const p = ALERT_TYPES.find((a) => a.id.startsWith("platform:") && t.includes(a.id.slice(9).split(" ")[0].toLowerCase()))
  return p?.id
}

/** Does this read as a request for a dashboard? Iris only builds on the Dashboards page. */
export function looksLikeBuild(text: string) {
  const t = text.toLowerCase()
  return /dashboard|build|chart|graph|track|keep an eye|watch|by site|by location|over time|trend|coming back|recurr|keep (happening|recurring)|not approved|aren'?t approved|unapproved|windows 10/.test(t) || !!alertIn(t)
}

export type Plan = { built: BuiltDashboard; answer: Omit<Answer, "dashboard" | "asOf" | "basis"> } | { cant: Answer }

/** Plain request → a dashboard. Returns null when Iris can't tell what to build. */
export function plan(text: string): Plan | null {
  const t = text.toLowerCase()
  const days = period(t)
  const locs = places(t)
  const type = alertIn(t)
  const range = rangeIn(t)
  if (type && range) return alertBetween(type, range, locs)

  if (/headset/.test(t) && /approv|allowed|list|complian/.test(t)) return headsets(locs)
  if (/windows 10|old windows|outdated windows/.test(t)) return windows10(locs)
  if (/coming back|recurr|keep (happening|recurring|coming)|repeat|again and again|over and over/.test(t)) return recurring(days ?? 30, locs)
  if (type) return alertPlan(type, days, locs, /by (site|location)|per (site|location)|compare|vs\b|versus/.test(t))
  if (/most common|top alerts|which alerts|alerts? (raised )?most/.test(t)) return top(days ?? 30, locs)
  return null
}

const asSaved = (b: Omit<BuiltDashboard, "summary">): BuiltDashboard =>
  ({ ...b, summary: describeSaved({ id: "", name: b.name, view: b.view, state: b.state as SavedDashboard["state"], savedAt: 0, by: "" }) })

// ---- the builds -------------------------------------------------------------------

function headsets(locs: string[]): Plan {
  if (!approvedHeadsets.get().length) {
    return { cant: { basis: "product", asOf: now(), sources: [],
      paragraphs: ["I can't build that yet. There's no approved headsets list, so every headset reads as \"can't be checked\". Add the headsets you allow in Settings › Approved headsets, then ask again."],
      links: [{ label: "Open Settings", link: { kind: "page", page: "settings" } }] } }
  }
  const eps = endpointsIn(locs)
  const off = eps.filter((e) => complianceFor(e) === "not-approved")
  const byModel = new Map<string, number>()
  for (const e of off) { const m = inventoryFor(e).headset; byModel.set(m, (byModel.get(m) ?? 0) + 1) }
  const models = [...byModel].sort((a, b) => b[1] - a[1])
  const scope = locs.length ? locs.map(locationName).join(", ") : "your fleet"
  const built = asSaved({
    name: `Headsets that aren't approved${locs.length ? ` · ${locs.map(locationName).join(", ")}` : ""}`,
    view: "inventory",
    state: { locations: locs, tab: "endpoints", filters: ["compliance|not-approved"], q: "" },
    metric: off.length.toLocaleString(), metricLabel: `endpoints on a headset that isn't approved (${pct(off.length, eps.length)}%)`,
    bars: models.slice(0, 6).map(([, n]) => n),
  })
  return { built, answer: { sources: [SRC_INVENTORY, "Approved headsets list"],
    paragraphs: off.length
      ? [`${plural(off.length, "endpoint")} across ${scope} use a headset that isn't on your approved list, ${pct(off.length, eps.length)}% of ${eps.length.toLocaleString()}. ${models.length === 1 ? "They're all the same model." : `They're spread across ${models.length} models.`}`]
      : [`Every headset across ${scope} is either approved or can't be checked. I've built it anyway so you can watch for new ones.`],
    facts: models.slice(0, 3).map(([m, n]) => ({ label: m, value: plural(n, "endpoint") })) } }
}

function windows10(locs: string[]): Plan {
  const eps = endpointsIn(locs)
  const n = eps.filter((e) => inventoryFor(e).windows === "Windows 10 22H2").length
  const built = asSaved({
    name: `Windows 10${locs.length ? ` · ${locs.map(locationName).join(", ")}` : ""}`,
    view: "inventory", state: { locations: locs, tab: "endpoints", filters: ["windows|Windows 10 22H2"], q: "" },
    metric: n.toLocaleString(), metricLabel: `endpoints still on Windows 10 (${pct(n, eps.length)}%)`,
  })
  return { built, answer: { sources: [SRC_INVENTORY],
    paragraphs: [`${plural(n, "endpoint")} still run Windows 10 22H2, ${pct(n, eps.length)}% of ${locs.length ? "those at " + locs.map(locationName).join(", ") : "the fleet"}.`] } }
}

/**
 * An alert over the request's own dates. Up to four weeks opens Most common
 * alerts on that alert (day by day up to two weeks); longer opens Alert trends.
 * Either way the dashboard carries the dates, so saving it keeps them.
 */
function alertBetween(typeId: string, range: DayRange, locs: string[]): Plan {
  const t = alertType(typeId)
  const sp = spanOf(HISTORY_DAYS, range)
  const dates = fmtRange(sp.days, sp.end)
  const rs = filtered({ days: sp.days, end: sp.end, types: [typeId], locations: locs })
  const eps = new Set(rs.map((x) => x.ep)).size
  const where = locs.length ? ` · ${locs.map(locationName).join(", ")}` : ""
  const short = sp.days <= 28
  const built = asSaved({
    name: `${listName(t)} · ${dates}${where}`,
    view: short ? "alerts" : "trends",
    state: short
      ? { days: 30, range, locations: locs, severity: [], categories: [], rank: "times", selected: typeId }
      : { days: 90, range, types: [typeId], locations: locs.slice(0, 5), measure: "times" },
    metric: rs.length.toLocaleString(), metricLabel: `times raised, ${dates}, on ${plural(eps, "endpoint")}`,
  })
  const site = topSites(rs, 1)[0]
  return { built, answer: { sources: [SRC_HISTORY],
    paragraphs: [
      rs.length
        ? `“${listName(t)}” was raised ${plural(rs.length, "time")} on ${plural(eps, "endpoint")} from ${dates}.${site ? ` ${site.name} had the most (${site.n}).` : ""}`
        : `“${listName(t)}” wasn't raised from ${dates}.`,
      "I've set those dates as a custom period, so the dashboard keeps them if you save it.",
    ] } }
}

function alertPlan(typeId: string, days: number | undefined, locs: string[], bySite: boolean): Plan {
  const t = alertType(typeId)
  // a week is too short to trend, so a week-long ask opens on the alert in Most common alerts
  if (days === 7) {
    const rs = filtered({ days: 7, locations: locs })
    const mine = rs.filter((x) => x.typeId === typeId)
    const eps = new Set(mine.map((x) => x.ep)).size
    const rank = commonAlerts(rs).sort((a, b) => b.times - a.times).findIndex((r) => r.typeId === typeId) + 1
    const site = topSites(mine, 1)[0]
    const built = asSaved({
      name: `${listName(t)} · this week${locs.length ? ` · ${locs.map(locationName).join(", ")}` : ""}`,
      view: "alerts", state: { days: 7, locations: locs, severity: [], categories: [], rank: "times", selected: typeId },
      metric: mine.length.toLocaleString(), metricLabel: `times raised in the last 7 days, on ${plural(eps, "endpoint")}`,
    })
    return { built, answer: { sources: [SRC_HISTORY],
      paragraphs: [
        mine.length
          ? `“${listName(t)}” was raised ${plural(mine.length, "time")} on ${plural(eps, "endpoint")} in the last 7 days${rank ? `, ${rankLabel(rank)}` : ""}.${site ? ` ${site.name} had the most (${site.n}).` : ""}`
          : `“${listName(t)}” hasn't been raised in the last 7 days.`,
        "A week is too short to show a trend, so it opens on this alert with the endpoints it hit. Pick 30 or 90 days there to see it week by week.",
      ] } }
  }
  const d = days && days >= 30 ? days : 30
  const rs = filtered({ days: d, types: [typeId], locations: locs })
  const lines = locs.length ? locs.slice(0, 4) : bySite || typeId === "wifi" ? topSites(rs, 3).map((s) => s.id) : []
  const sites = topSites(rs, 3)
  const top = sites[0]
  const spark = weekly(filtered({ days: Math.ceil(d / 7) * 7, types: [typeId], locations: top ? [top.id] : [] }), d, "times")
  const ch = trendPct(spark)
  const built = asSaved({
    name: `${listName(t)} ${lines.length ? `by site` : "over time"} · ${d} days`,
    view: "trends", state: { days: d, types: [typeId], locations: lines, measure: "times" },
    metric: rs.length.toLocaleString(), metricLabel: `times raised in ${d} days${top ? `, most at ${top.name}` : ""}`, spark,
  })
  return { built, answer: { sources: [SRC_HISTORY],
    paragraphs: [
      rs.length
        ? `“${listName(t)}” was raised ${plural(rs.length, "time")} in the last ${d} days.${top ? ` ${top.name} has the most${ch !== null ? `, and it's ${ch >= 0 ? "up" : "down"} ${Math.abs(ch)}% from the first two weeks to the last two` : ""}.` : ""}`
        : `“${listName(t)}” hasn't been raised in the last ${d} days.`,
      lines.length && !locs.length ? `It compares the ${lines.length} sites with the most.` : "",
      days && days < 30 ? `Trends start at 30 days, so I've used 30.` : "",
    ].filter(Boolean),
    facts: sites.map((s) => ({ label: s.name, value: plural(s.n, "time") })) } }
}

function recurring(days: number, locs: string[]): Plan {
  const d = days === 7 ? 7 : days >= 90 ? 90 : 30
  const ranked = commonAlerts(filtered({ days: d, locations: locs })).filter((r) => r.endpoints >= 5)
    .map((r) => ({ ...r, each: r.times / r.endpoints })).sort((a, b) => b.each - a.each)
  const worst = ranked[0]
  if (!worst) return { cant: { basis: "data", asOf: now(), sources: [SRC_HISTORY], paragraphs: [`No alert has come back on the same endpoints in the last ${d} days.`] } }
  const built = asSaved({
    name: `Alerts that keep coming back · ${d} days`,
    view: "alerts", state: { days: d, locations: locs, severity: [], categories: [], rank: "times", selected: worst.typeId },
    metric: `${worst.each.toFixed(1)}×`, metricLabel: `“${worst.name}” per endpoint it hit, in ${d} days`,
    bars: ranked.slice(0, 6).map((r) => r.each),
  })
  return { built, answer: { sources: [SRC_HISTORY],
    paragraphs: [
      `“${worst.name}” comes back the most: ${plural(worst.times, "time")} on ${plural(worst.endpoints, "endpoint")} in ${d} days, about ${worst.each.toFixed(1)} times each. It opens on that alert, with the endpoints it keeps returning to at the top.`,
    ],
    facts: ranked.slice(0, 3).map((r) => ({ label: r.name, value: `${r.each.toFixed(1)} times per endpoint · ${plural(r.endpoints, "endpoint")}` })) } }
}

function top(days: number, locs: string[]): Plan {
  const d = days === 7 ? 7 : days >= 90 ? 90 : 30
  const ranked = commonAlerts(filtered({ days: d, locations: locs })).sort((a, b) => b.times - a.times)
  const built = asSaved({
    name: `Top alerts · last ${d} days${locs.length ? ` · ${locs.map(locationName).join(", ")}` : ""}`,
    view: "alerts", state: { days: d, locations: locs, severity: [], categories: [], rank: "times", selected: null },
    metric: (ranked[0]?.times ?? 0).toLocaleString(), metricLabel: ranked[0] ? `Raised most: ${ranked[0].name}` : "alerts raised",
    bars: ranked.slice(0, 6).map((r) => r.times),
  })
  return { built, answer: { sources: [SRC_HISTORY],
    paragraphs: [ranked[0] ? `“${ranked[0].name}” was raised most in the last ${d} days, ${plural(ranked[0].times, "time")}.` : `No alerts in the last ${d} days.`],
    facts: ranked.slice(0, 3).map((r) => ({ label: r.name, value: `${plural(r.times, "time")} · ${plural(r.endpoints, "endpoint")}` })) } }
}

// ---- helpers ------------------------------------------------------------------------

function topSites(rs: { ep: number }[], n: number) {
  const m = new Map<string, number>()
  for (const x of rs) { const id = endpoints[x.ep].locationId; m.set(id, (m.get(id) ?? 0) + 1) }
  return [...m].sort((a, b) => b[1] - a[1]).slice(0, n).map(([id, c]) => ({ id, name: locationName(id), n: c }))
}
function trendPct(w: number[]): number | null {
  if (w.length < 4) return null
  const first = w[0] + w[1]
  if (!first) return null
  return Math.round(((w.at(-1)! + w.at(-2)!) / first - 1) * 100)
}
const rankLabel = (n: number) => (n === 1 ? "the most common alert" : `the ${n}${n === 2 ? "nd" : n === 3 ? "rd" : "th"} most common alert`)

/** What Iris can build, for when it can't tell. */
export function buildHelp(): Answer {
  return { basis: "none", asOf: now(), sources: [],
    paragraphs: [
      "I'm not sure what to build from that. I build dashboards from your alert history and device inventory: an alert over time or by site, the alerts raised most or that keep coming back, or devices such as headsets that aren't approved.",
      "Try naming an alert and a period, for example “Weak Wi-Fi in Manila this month”.",
    ] }
}

