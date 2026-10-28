// Live agent telemetry from the Clarion widget prototype.
//
// The widget (served under this app at /widget) publishes what each demo agent's
// machine is reporting to a same-browser feed (@ir/telemetry). Here we apply it to
// that agent's endpoint and its location, so the Overview map, KPIs, issues,
// alerts and the Endpoints table all move with the widget.
//
// Idempotent: every apply starts from the generated baseline, then layers the
// current feed on top. So "Reset all agents" in the widget restores the dashboard.

import { createContext, useContext } from "react"
import { agents, endpointView, feed, type FeedState } from "@ir/telemetry"
import { endpointById, invalidateEndpointCaches, rollupsForLocation, type Endpoint } from "@/data/endpoints"
import { invalidateFleetTotals, locationById, type LocationRow } from "@/data/dashboard"

type EndpointFields = Pick<Endpoint, "status" | "events" | "event" | "eventCount" | "eventAgo" | "primaryIssue" | "score" | "latency" | "jitter" | "packetLoss" | "lastSeenMinAgo" | "primaryPlatform">
type LocationFields = Pick<LocationRow, "healthy" | "warning" | "critical" | "offline" | "status" | "issues" | "activeAlerts">

const endpointBase = new Map<string, EndpointFields>()
const locationBase = new Map<string, LocationFields>()

// Give each agent's endpoint the agent's identity, and remember its baseline.
for (const a of agents) {
  const e = endpointById(a.endpointId)
  const loc = locationById(a.locationId)
  if (!e || !loc) { console.warn(`[agentFeed] ${a.name}: endpoint ${a.endpointId} not found`); continue }
  e.user = a.name
  e.users = [a.name]
  e.machine = a.machine
  e.team = a.team
  e.primaryPlatform = "Genesys Cloud"
  endpointBase.set(e.id, structuredClone({
    status: e.status, events: e.events, event: e.event, eventCount: e.eventCount, eventAgo: e.eventAgo,
    primaryIssue: e.primaryIssue, score: e.score, latency: e.latency, jitter: e.jitter, packetLoss: e.packetLoss,
    lastSeenMinAgo: e.lastSeenMinAgo, primaryPlatform: e.primaryPlatform,
  }))
  if (!locationBase.has(loc.id)) {
    locationBase.set(loc.id, { healthy: loc.healthy, warning: loc.warning, critical: loc.critical, offline: loc.offline, status: loc.status, issues: loc.issues, activeAlerts: loc.activeAlerts })
  }
}

export function applyFeed(state: FeedState) {
  // 1. Back to the generated baseline.
  for (const [id, base] of endpointBase) Object.assign(endpointById(id)!, structuredClone(base))
  for (const [id, base] of locationBase) Object.assign(locationById(id)!, base)

  // 2. Layer each agent's live reading on top.
  for (const a of agents) {
    const r = state[a.id]
    const e = endpointById(a.endpointId)
    const loc = locationById(a.locationId)
    if (!r || !e || !loc) continue
    const v = endpointView(r)
    const was = e.status
    e.status = v.status
    e.events = v.events
    e.primaryIssue = v.primaryIssue
    e.score = v.score
    e.latency = v.latency
    e.jitter = v.jitter
    e.packetLoss = v.packetLoss
    e.lastSeenMinAgo = v.lastSeenMinAgo
    const crit = v.events.filter((x) => x.severity === "critical")
    const pool = crit.length ? crit : v.events
    const shown = pool[0]
    e.event = v.status === "offline" ? "Offline" : shown?.label ?? null
    e.eventCount = v.status === "offline" ? 0 : v.events.length
    e.eventAgo = shown?.minutesAgo ?? null
    if (was !== v.status) {
      loc[was === "offline" ? "offline" : was]--
      loc[v.status === "offline" ? "offline" : v.status]++
      if (v.status === "critical" || v.status === "warning") loc.activeAlerts++
    }
  }

  // 3. Re-derive what depends on the counts.
  invalidateEndpointCaches()
  invalidateFleetTotals()
  for (const id of locationBase.keys()) {
    const loc = locationById(id)!
    loc.status = loc.critical > 0 ? "critical" : loc.warning > 0 ? "warning" : "healthy"
    loc.issues = rollupsForLocation(id).length
  }
}

// Apply whatever the widget last reported before the first render.
applyFeed(feed.get())

/** Bumps each time the feed is applied; add to useMemo deps that read endpoint data. */
export const FeedVersion = createContext(0)
export const useFeedVersion = () => useContext(FeedVersion)
