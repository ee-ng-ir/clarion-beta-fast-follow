// Alert evidence for one endpoint: what tripped, against which threshold, for how
// long, under what conditions. Plain language, never raw data (epic rule 1).
// Evidence is a record of the moment: it keeps the threshold in force when the
// alert was raised (rule 2) and says plainly what wasn't captured (rule 3).
// Synthetic but seeded from the endpoint, so the demo is stable.

import { agentByEndpoint } from "@ir/telemetry"
import type { Endpoint } from "@/data/endpoints"
import { alertType, type AlertType } from "../alerts/catalogue"
import { classify } from "../alerts/groups"
import { isTypeOn } from "../settings/store"

export type Severity = "critical" | "warning"
export type Likelihood = "Most likely" | "Possible" | "Less likely"

export interface Point { t: number; v: number }
export interface Series { name: string; unit: string; warn: number; crit: number; lowerIsWorse: boolean; points: Point[]; min: number; max: number }

export interface EndpointAlert {
  id: string
  type: AlertType
  severity: Severity
  title: string
  active: boolean
  startedMinAgo: number
  /** for cleared alerts */
  lastedMin?: number
  /** one line for the list */
  summary: string
  /** the plain-language "what happened" */
  whatHappened: string
  likelyCauseShort: string | null
  /** the reading that tripped it, against the threshold in force at the time */
  reading: { name: string; value: string; threshold: string; thresholdNow: string; changedSince: boolean } | null
  main: Series | null
  contributor: (Series & { sentence: string }) | null
  drivers: { label: string; value: string; role: "Main factor" | "Contributing" | "Normal" }[]
  where: { label: string; detail: string } | null
  snapshot: { capturedMinAgo: number; sections: { title: string; rows: string[] | null }[] }
  causes: { title: string; likelihood: Likelihood; why: string }[]
  steps: string[]
  groupId: string | null
}

function rng(seed: string) {
  let h = 2166136261
  for (const c of seed) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) }
  let s = h >>> 0
  return () => { s = (s + 0x6d2b79f5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}
const r1 = (n: number) => Math.round(n * 10) / 10

/** A series that sits healthy, then crosses the threshold at the moment the alert was raised. */
function series(seed: string, startedMinAgo: number, from: number, to: number, cfg: Omit<Series, "points">): Series {
  const r = rng(seed)
  // always start before the alert, so the drop is visible (up to 4 h back)
  const window = Math.min(240, Math.max(36, startedMinAgo + 20))
  const steps = 24
  const points: Point[] = []
  for (let i = 0; i <= steps; i++) {
    const t = -window + (window * i) / steps
    const before = t < -startedMinAgo - 6
    const ramp = Math.min(1, Math.max(0, (t + startedMinAgo + 6) / 6))
    const base = before ? from : from + (to - from) * ramp
    points.push({ t: Math.round(t), v: r1(base + (r() - 0.5) * Math.abs(from - to) * 0.12) })
  }
  return { ...cfg, points }
}

const platforms = ["Genesys Cloud", "Microsoft Teams", "Zoom", "Webex", "Nice CXone"]

export function evidenceFor(e: Endpoint): { active: EndpointAlert[]; cleared: EndpointAlert[]; offlineSinceMin: number | null } {
  const offline = e.status === "offline"
  const active: EndpointAlert[] = []
  // a turned-off alert type raises nothing; its readings still show in the other tabs
  if ((e.status === "critical" || e.status === "warning") && isTypeOn(classify(e))) active.push(build(e, classify(e), e.status, true, e.eventAgo ?? 12))
  // cleared alerts from the last 7 days (seeded)
  const r = rng(e.id + "hist")
  const n = Math.floor(r() * 3) + (offline ? 1 : 0)
  const pool = ["wifi", "call-quality", "cpu", "storage"]
  const cleared = Array.from({ length: n }, (_, i) => {
    const type = pool[Math.floor(r() * pool.length)]
    const sev: Severity = r() < 0.4 ? "critical" : "warning"
    const started = Math.round(60 * (6 + i * 26 + r() * 20))
    return build(e, type, sev, false, started, Math.round(6 + r() * 30))
  })
  return { active, cleared, offlineSinceMin: offline ? Math.max(e.lastSeenMinAgo, 30) : null }
}

function build(e: Endpoint, typeId: string, sev: Severity, isActive: boolean, startedMinAgo: number, lastedMin?: number): EndpointAlert {
  const t = alertType(typeId)
  const r = rng(e.id + typeId + startedMinAgo)
  const title = sev === "critical" ? t.critical : t.warning
  const wifi = e.connection === "Wi-Fi"
  const signal = Math.round(sev === "critical" ? 12 + r() * 12 : 30 + r() * 18)
  const common = {
    id: `${e.id}:${typeId}:${startedMinAgo}`, type: t, severity: sev, title, active: isActive, startedMinAgo, lastedMin,
    groupId: isActive ? `grp-${typeId}` : null,
    snapshot: snapshot(e, signal, r, isActive ? startedMinAgo : startedMinAgo),
  }
  const thr = (v: number, u: string) => `${v}${u}`

  if (t.id === "call-quality") {
    const crit = 2.3, warn = 3.3
    const v = r1(sev === "critical" ? crit - 0.1 - r() * 0.5 : warn - 0.1 - r() * 0.6)
    const lossMain = e.packetLoss >= 1, latMain = e.latency >= 150, jitMain = e.jitter >= 30
    const drivers: EndpointAlert["drivers"] = [
      { label: "Packet loss", value: `${e.packetLoss || r1(1.5 + r() * 4)}%`, role: (lossMain ? "Main factor" : "Contributing") as "Main factor" | "Contributing" },
      { label: "Latency", value: `${e.latency || Math.round(160 + r() * 120)} ms`, role: (latMain ? "Main factor" : "Normal") as "Main factor" | "Normal" },
      { label: "Jitter", value: `${e.jitter || Math.round(20 + r() * 30)} ms`, role: (jitMain ? "Contributing" : "Normal") as "Contributing" | "Normal" },
    ]
    const mainNames = drivers.filter((d) => d.role === "Main factor").map((d) => d.label.toLowerCase())
    const factors = mainNames.length ? mainNames.join(" and ") : "packet loss"
    return { ...common,
      summary: `Quality index ${v} against a ${sev === "critical" ? crit : warn} ${sev} threshold${wifi ? `, on Wi-Fi at ${signal}% signal` : ""}. ${cap(factors)} ${mainNames.length > 1 ? "are" : "is"} the main factor${mainNames.length > 1 ? "s" : ""}.`,
      whatHappened: `Network quality index fell to ${v} against a ${sev === "critical" ? crit : warn} ${sev} threshold${isActive ? ` and has stayed there for ${startedMinAgo} minutes` : ""}. ${cap(factors)} ${mainNames.length > 1 ? "are" : "is"} the main factor${mainNames.length > 1 ? "s" : ""}.${wifi ? ` The endpoint is on Wi-Fi at ${signal}% signal.` : " The endpoint is on a wired connection."}`,
      likelyCauseShort: wifi ? "weak Wi-Fi at the agent's location" : "the network beyond this PC",
      reading: { name: "Network quality index", value: String(v), threshold: thr(sev === "critical" ? crit : warn, ""), thresholdNow: thr(sev === "critical" ? crit : warn, ""), changedSince: false },
      main: series(common.id, startedMinAgo, 4.1, v, { name: "Network quality index (1–5, lower is worse)", unit: "", warn, crit, lowerIsWorse: true, min: 1, max: 5 }),
      contributor: wifi
        ? { ...series(common.id + "w", startedMinAgo + 4, 64, signal, { name: "Wi-Fi signal (%)", unit: "%", warn: 50, crit: 25, lowerIsWorse: true, min: 0, max: 100 }),
            sentence: `Wi-Fi signal dropped from 64% to ${signal}% about four minutes before call quality fell.` }
        : null,
      drivers,
      where: wifi ? { label: "Local network", detail: "Most of the delay is between the PC and the router, not beyond it." } : { label: "Beyond the router", detail: "The local link is clean; the delay builds up past the router, at the provider or across the WAN." },
      causes: wifi
        ? [{ title: "Weak Wi-Fi at the agent's location", likelihood: "Most likely", why: `Signal fell to ${signal}% four minutes before packet loss rose. Delay is mostly local.` },
           { title: "Device too far from a 5 GHz router", likelihood: "Possible", why: "5 GHz has a shorter range, and the device switched access points twice." },
           { title: "Internet provider", likelihood: "Less likely", why: "Little of the delay is beyond the router." }]
        : [{ title: "Congestion on the office network or WAN", likelihood: "Most likely", why: "Delay builds up past the router while the local link is clean." },
           { title: "Internet provider or carrier issue", likelihood: "Possible", why: "Other endpoints at the same location may show the same pattern." },
           { title: "This PC's network adapter", likelihood: "Less likely", why: "No errors on the local link." }],
      steps: wifi
        ? ["Ask the agent to move closer to the router or plug in a network cable.", "If they can't move closer, try the 2.4 GHz network, which reaches further.", "If it keeps happening, consider a Wi-Fi extender or a wired setup for this home worker."]
        : ["Check whether other endpoints at this location show the same drop.", "If they do, check the office network and WAN link first.", "If it's only this PC, try another network port or cable."],
    }
  }
  if (t.id === "wifi") {
    return { ...common,
      summary: `Wi-Fi signal fell to ${signal}% against a ${sev === "critical" ? 25 : 50}% ${sev} threshold, on ${ssid(e)} (5 GHz).`,
      whatHappened: `Wi-Fi signal fell to ${signal}% against a ${sev === "critical" ? 25 : 50}% ${sev} threshold${isActive ? ` and has stayed below it for ${startedMinAgo} minutes` : ""}.`,
      likelyCauseShort: "distance from the router",
      reading: { name: "Wi-Fi signal", value: `${signal}%`, threshold: `${sev === "critical" ? 25 : 50}%`, thresholdNow: `${sev === "critical" ? 25 : 50}%`, changedSince: false },
      main: series(common.id, startedMinAgo, 68, signal, { name: "Wi-Fi signal (%)", unit: "%", warn: 50, crit: 25, lowerIsWorse: true, min: 0, max: 100 }),
      contributor: null, drivers: [], where: { label: "Local network", detail: "The problem is the wireless link to the router." },
      causes: [{ title: "Distance or walls between the PC and the router", likelihood: "Most likely", why: "Signal dropped steadily with no change in the network beyond." },
               { title: "Interference from nearby networks", likelihood: "Possible", why: "Common in apartments on the 2.4 GHz band." }],
      steps: ["Ask the agent to move closer to the router, or plug in a cable.", "Try the other band (2.4 GHz reaches further, 5 GHz is faster).", "If it recurs, consider an extender for this home worker."],
    }
  }
  if (t.category === "system" && t.metric) {
    const m = t.metric
    const v = sev === "critical" ? (m.lowerIsWorse ? r1(m.crit * (0.4 + r() * 0.5)) : Math.round(m.crit + r() * (100 - m.crit))) : (m.lowerIsWorse ? r1(m.crit + (m.warn - m.crit) * (0.2 + r() * 0.7)) : Math.round(m.warn + r() * (m.crit - m.warn)))
    const threshold = sev === "critical" ? m.crit : m.warn
    // demo agents only get a CPU alert from the widget's "Computer busy" scenario, which has energy saver on
    const energy = t.id === "cpu" && (!!agentByEndpoint(e.id) || rng(e.id + "es")() < 0.8)
    return { ...common,
      summary: `${m.name} at ${v}${m.unit} against a ${threshold}${m.unit} ${sev} threshold.${energy ? " Energy saver was on." : ""}`,
      whatHappened: `${m.name} reached ${v}${m.unit} against a ${threshold}${m.unit} ${sev} threshold${isActive ? ` and has stayed there for ${startedMinAgo} minutes` : ""}.${energy ? " Windows energy saver was on when the alert was raised, which throttles the CPU." : ""}`,
      likelyCauseShort: energy ? "energy saver was on" : null,
      reading: { name: m.name, value: `${v}${m.unit}`, threshold: `${threshold}${m.unit}`, thresholdNow: `${threshold}${m.unit}`, changedSince: false },
      main: series(common.id, startedMinAgo, m.lowerIsWorse ? Math.min(60, m.warn * 4) : 42, v, { name: `${m.name} (${m.unit})`, unit: m.unit, warn: m.warn, crit: m.crit, lowerIsWorse: m.lowerIsWorse, min: 0, max: 100 }),
      contributor: null, drivers: [], where: { label: "This PC", detail: "Local to the endpoint. No shared network cause." },
      causes: energy
        ? [{ title: "Windows energy saver", likelihood: "Most likely", why: "It was on when the alert was raised, and it throttles the CPU on battery." },
           { title: "Background apps or updates", likelihood: "Possible", why: "Check what else was running at the time." }]
        : [{ title: t.id === "storage" ? "Temporary files and downloads" : "Background apps or updates", likelihood: "Most likely", why: "The most common cause for this alert type." },
           { title: "Under-specified hardware", likelihood: "Less likely", why: "Only if it keeps recurring on the same machine." }],
      steps: energy
        ? ["Ask the agent to plug in, or switch the power plan to Balanced.", "Then look for background apps using the CPU.", "If it recurs, review the power policy for laptops."]
        : ["Look for apps or updates using resources.", "Restart the endpoint if it's safe to between calls.", "If it recurs on this machine, plan a hardware check."],
    }
  }
  if (t.category === "platform") {
    const p = t.id.replace("platform:", "")
    const others = platforms.filter((x) => x !== p).slice(0, 2)
    return { ...common,
      summary: `Can't reach ${p}. ${others.join(" and ")} respond normally from this endpoint.`,
      whatHappened: `Clarion couldn't reach ${p} from this endpoint${isActive ? ` for the last ${startedMinAgo} minutes` : ""}, while ${others.join(" and ")} responded normally. That points to ${p} or the route to it, not the PC.`,
      likelyCauseShort: `${p} or the route to it`, reading: null, main: null, contributor: null, drivers: [],
      where: { label: "Beyond the router", detail: `The PC and local network are fine; only ${p} fails.` },
      causes: [{ title: `${p} service problem`, likelihood: "Most likely", why: "Other endpoints in the group fail the same way at the same time." },
               { title: "Firewall, proxy or VPN change", likelihood: "Possible", why: `Only traffic to ${p} is affected.` }],
      steps: [`Check ${p}'s service status page.`, "Confirm other endpoints at this location fail the same way.", "Look for recent firewall, proxy or VPN changes."],
    }
  }
  // devices
  return { ...common,
    summary: "The headset was removed during a session and no other playback device was found.",
    whatHappened: `The headset disconnected${isActive ? ` ${startedMinAgo} minutes ago` : ""} and Windows found no other speaker or headphones to switch to.`,
    likelyCauseShort: "headset unplugged or USB dropout", reading: null, main: null, contributor: null, drivers: [],
    where: { label: "This PC", detail: "A device on the endpoint, not the network." },
    causes: [{ title: "Headset unplugged or loose USB", likelihood: "Most likely", why: "The device disappeared without an error first." },
             { title: "USB power saving", likelihood: "Possible", why: "Windows can suspend USB ports to save power." }],
    steps: ["Ask the agent to reconnect the headset, or try another USB port.", "Try a different headset to rule out the cable.", "If several agents lost audio together, check for a driver update."],
  }
}

function snapshot(e: Endpoint, signal: number, r: () => number, at: number): EndpointAlert["snapshot"] {
  const offline = e.status === "offline"
  const wifi = e.connection === "Wi-Fi"
  return {
    capturedMinAgo: at,
    sections: [
      { title: "Network", rows: [wifi ? `Wi-Fi · ${ssid(e)} · 5 GHz · ${signal}% signal` : "Ethernet · 1 Gbps", wifi ? "Switched access point twice in 10 min" : "No link errors", `VPN: ${r() < 0.5 ? "connected" : "not connected"}`] },
      { title: "Platforms", rows: [`${e.primaryPlatform} · ${e.primaryIssue?.endsWith("down") ? "unreachable" : "connected"}`, `Microsoft Teams · connected`] },
      { title: "System", rows: offline ? null : [`CPU ${Math.round(18 + r() * 40)}% · Memory ${Math.round(35 + r() * 40)}%`, `Energy saver: ${r() < 0.3 ? "on" : "off"}`] },
      { title: "Devices", rows: offline ? null : [`Jabra Evolve2 75 · ${r() < 0.5 ? "USB dongle" : "Bluetooth"} · in use`, `On a call: ${r() < 0.7 ? `yes (${e.primaryPlatform})` : "no"}`] },
    ],
  }
}

/** Active alerts on an endpoint (0 or 1 in the demo), respecting turned-off types. */
export const activeAlertCount = (e: Endpoint) => ((e.status === "critical" || e.status === "warning") && isTypeOn(classify(e)) ? 1 : 0)

const cap = (s: string) => s[0].toUpperCase() + s.slice(1)
const ssid = (e: Endpoint) => (e.site === "Office" ? `${e.locationName.split(" ")[0].toUpperCase()}-CORP` : `HOME-${e.machine.slice(-4)}`)

export function clockTime(minAgo: number) {
  const d = new Date(Date.now() - minAgo * 60000)
  const today = new Date()
  const sameDay = d.toDateString() === today.toDateString()
  const yest = new Date(today.getTime() - 86400000).toDateString() === d.toDateString()
  const time = d.toLocaleTimeString("en-AU", { hour: "numeric", minute: "2-digit" })
  if (sameDay) return `${time} today`
  if (yest) return `Yesterday ${time}`
  return `${d.toLocaleDateString("en-AU", { weekday: "short" })} ${time}`
}
