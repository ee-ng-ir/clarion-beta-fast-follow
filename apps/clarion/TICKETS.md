# Clarion — Fleet Dashboard · User Stories & Tickets

Prototype scope mapped to epics, stories and acceptance criteria. Status reflects
the current prototype (dummy data): ✅ built · 🟡 partial · ⬜ backlog.

**Terminology** (see the in-app Glossary + Issues-model pages):

- **Issue** — a persistent, trackable problem affecting one or more endpoints (the feature; formerly "Alerts").
- **Alert** — an ephemeral, real-time event on the bell that raises/updates an Issue.
- **Symptom** — the per-endpoint observed condition (the Endpoints column; formerly "Primary issue").
- **Status** — endpoint health: healthy / warning / critical / offline.
- **Ticket** — an Issue escalated to ITSM (future).

Structure:

- **Overview** — Endpoints overview, Issues overview
- **Endpoints** — Endpoint table, Endpoint drilldown
- **Issues** — Issues table, Issue drilldown (impacted endpoints)
- **Alerts (real-time)** — bell notifications
- **Product development (internal)** — Glossary, Issues model
- **Foundations & cross-cutting** — tokens, search, theming, live data

---

## Epic 1 — Overview

The supervisor's landing page: fleet health at a glance, then drill toward the
worst location / issue.

### 1.1 Endpoints overview (map + locations) ✅

> As a supervisor, I want fleet endpoint health by region on a map and a
> locations list, so I can spot where problems are concentrated and drill in.

Acceptance criteria

- Fleet KPI strip: Online endpoints (healthy/warning/critical split bar),
  Open issues, Clarion™ Network Score, plus "N total endpoints". ✅
- World map **clusters endpoints by country**; each country marker shows
  aggregated count + worst status. ✅
- Drilling a country reveals its **cities/centres**; single-city countries
  auto-select their city, multi-city countries let you choose. ✅
- Locations list mirrors the map (regions → cities) with an **"All locations"**
  control back to the world view; scrollable; per-city drill arrow. ✅
- Per-location alert count is shown as **"N issues"**, consistent with the KPI. ✅
- Country aggregates = sum of cities; fleet total preserved (2,847). ✅

Backlog: real map tiles ⬜ · country-level endpoints filter ⬜

### 1.2 Issues overview (open issues card) ✅

> As a supervisor, I want the overview to summarise open issues (or recent
> recovery when clear), so I know what needs attention now.

Acceptance criteria

- With open issues: a list of **issue rollups** (cause + affected count +
  avatars + "started Xm ago"); mixes multi-endpoint rollups with isolated
  single-endpoint issues. ✅
- When clear: a **24h recovery snapshot** (Resolved / Average time / Auto-fixed). ✅
- Clicking a rollup opens the **issue drilldown**; "View all issues" → Issues page. ✅

---

## Epic 2 — Endpoints

### 2.1 Endpoint table ✅

Acceptance criteria

- Columns: User / Machine, Status, Location (auto-hidden when filtered),
  Clarion™ Score, **Symptom**. ✅
- **Symptom** is derived from telemetry vs thresholds (worst breaching signal);
  "—" when healthy; column auto-hides when the view is all-healthy. ✅
- Default sort **worst-first**: critical → warning → healthy → offline. ✅
- Sortable headers, hostname/user search (clearable), Location + Status filters
  (incl. **Offline**), client-side pagination. ✅
- **"Issues only"** toggle (default on) hides healthy endpoints; mutually
  exclusive with an explicit Status selection. ✅
- ~2,847 seeded endpoints, counts consistent with the Overview. ✅

Backlog: column chooser / saved views ⬜ · bulk actions ⬜ · sticky severity grouping ⬜

### 2.2 Endpoint drilldown ✅

Acceptance criteria

- Right-side sheet (CRM record style) from any table row, issue, or search result. ✅
- Header: avatar, name, status, machine, location · ISP·IP · team · connection. ✅
- Tabs: Network · UC/CC platforms · Devices · System. ✅
- **Flick ↑/↓** between endpoints in the current set; "N of M". ✅
- **Expand** to near-fullscreen over the scrim; **always opens as the side
  drawer** (resets on open). ✅
- Opened from an issue → a **"back to issue"** control returns to it. ✅

Backlog: historical charts ⬜ · actions (remote fix / message) ⬜ · full-page route ⬜

---

## Epic 3 — Issues

### 3.1 Issues table ✅

Acceptance criteria

- Lists issue rollups fleet-wide: cause/title, location, affected count +
  avatars, severity, started. ✅
- Location + Severity filters, search, worst-first ordering. ✅
- Header counts read "N open · N endpoints". ✅
- Row click opens the issue drilldown. ✅

Backlog: acknowledge / resolve / snooze + lifecycle ⬜ · history tab ⬜ · pagination ⬜

### 3.2 Issue drilldown (impacted endpoints) ✅

Acceptance criteria

- Sheet with issue header (cause, severity, location, affected count, started). ✅
- **Lists impacted endpoints**, each with status + symptom. ✅
- **Flick ↑/↓** between issues in the current set. ✅
- Clicking an impacted endpoint opens the endpoint drilldown (flick through all
  impacted), with a back path to the issue. ✅
- Opens as a side sheet normally; **centered/expanded when reached from an alert**. ✅

### 3.3 Issue severity & rollups ✅

> As a supervisor, I want issues grouped and severity-rated meaningfully.

Acceptance criteria

- Unhealthy endpoints (warning+critical) sharing a **cause + location** roll up
  into one issue with an affected count; offline excluded. ✅
- **Severity = critical** if a platform outage **or** affected endpoints are
  **majority-critical (≥ 50%)**; otherwise **warning**. ✅
- Issue types: platform outage, packet loss, latency, jitter, isolated
  endpoint issues. ✅

---

## Epic 4 — Alerts (real-time notifications)

### 4.1 Bell notifications ✅

> As a supervisor, I want real-time alerts on the bell so I notice problems as
> they happen.

Acceptance criteria

- Bell shows an **unread dot**; panel lists alerts **newest-first**. ✅
- Severities: critical / warning / info (e.g. recovery). ✅
- Per-alert actions: **read**, **dismiss/clear**, **mute that type** (1/8/24h);
  plus "Mark all read". ✅
- Alerts **arrive live** (first ~10s, then ~every minute) to illustrate the flow. ✅
- Clicking an alert **navigates to its area** and **opens the related issue
  drilldown (centered)**; recovery alerts open Endpoints. ✅

Backlog: real event stream ⬜ · per-user preferences ⬜ · alert → ticket ⬜

---

## Epic 5 — Product development (internal, not shipped)

### 5.1 Glossary ✅ — shared definitions of every concept.
### 5.2 Issues model ✅ — issue types, alert types & linkage, status, and the
rollup severity calculation (with worked examples).

---

## Epic 6 — Foundations & cross-cutting

| Item | Status |
|---|---|
| Design tokens (`@ir/tokens`) — semantic tokens, light + dark | ✅ |
| Themed shadcn component library | ✅ |
| Global search (⌘K) — endpoints + locations | ✅ |
| Dark mode (single `.dark` class) | ✅ |
| Live "streaming" feel (online never exceeds total) | ✅ |
| Sidebar nav + breadcrumb + responsive/full-width drawers on mobile | ✅ |
| Thresholds page | ⬜ |
| Auth / roles / workspace switching | ⬜ |
| Real data / API (telemetry + alerting engine) | ⬜ |
