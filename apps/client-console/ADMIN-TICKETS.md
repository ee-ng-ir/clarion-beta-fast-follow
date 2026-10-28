# Clarion — Admin & Management · Planning Doc

> **Status: draft for discussion (Ee × Ben).** This maps Ben's JTBD for the
> "user management world" onto the Fleet prototype as a canvas. Assumptions are
> called out inline so they're easy to challenge. Nothing here is final — the
> goal is a shared basis for the conversation and the ticket breakdown.

## Decisions — working session (17 Jun)

Captured live with Ee. These override the assumptions further down where they
conflict; the rest still stands for Ben to confirm.

1. **Separate Admin experience, one repo.** Administration is its own **shell**
   (own sidebar + chrome), sharing `@ir/tokens` + shadcn, reached from the
   top-right account menu. Chosen over role-gating *inside* the Fleet view:
   threading role conditionals through the Fleet code is harder for devs to
   reason about, so the two surfaces are kept cleanly separated. (Role still
   governs access conceptually — only Admins reach the Administration shell.)
2. **Switch top-right; org switch top-left.** The top-left sidebar header
   switches **org**; the **Fleet ↔ Administration** switch is in the
   **top-right account menu**. CC Managers (Supervisors) stay in a Fleet view
   scoped to their Group(s).
3. **Roles for MVP: Admin + CC Manager** (Ben's two). **Owner** (manages admins,
   owns billing) and a **billing-scoped admin** for Finance are planned for
   later — modelled on how other SaaS do it (GitHub "Billing manager", Google
   "Billing admin", Slack Primary Owner). Design principle: **gate each nav item
   per capability**, not one all-or-nothing admin flag, so those roles layer on
   without restructuring.
4. **Widget = a Device's provisioning side.** One object: management lens
   (register / token / assign / revoke, incl. pending & revoked) vs telemetry
   lens (live, reporting → shown as a Device). Surfaced as a **"Device
   management"** section. _"Devices are Widgets that have been set up."_
5. **"Member" for login accounts.** Login accounts (Admins, CC Managers) are
   **Members**; the person a monitored endpoint belongs to stays the device
   **user/owner**. Different populations — owners don't log in.
6. **Group visibility cascades.** A Manager assigned to a Group sees that Group
   **and every Group beneath it**. Role = permission level; scope = position in
   the tree.
7. **Flexible Group depth.** Real hierarchy is 4 deep (Country → Area → Office →
   Shift), each node with a lead. Design for nested/arbitrary depth, not a cap.
8. **CC = Contact Centre.** "CC Manager" = Contact Centre Manager.
9. **Auth:** email/password + admin-triggered reset for MVP; **SSO at 1.0**.
10. **User management is Admin-only for MVP** (delegation to Managers revisited
    at 1.0).

_Assumed defaults pending Ben (lower-stakes, see Open Questions):_ bulk Widget
registration = **CSV manifest + bulk token generation**; audit = **90 days,
Admin actions**; billing in trial = **D1 read-only visible, rest "coming
soon"**.

**Prototype status:** the Administration **experience is its own shell** in the
repo, reached via the top-right account-menu switch, with **Members** built and
Device management / Groups / Subscription / Audit log as placeholders. The Fleet
sidebar is clean (no admin items woven in).

---

## How to read this

Five domains, mapped to epics:

- **A — User & Role Management**
- **B — Group Management**
- **C — Widget Management**
- **D — Subscription & Billing**
- **E — Audit Log**

Each story keeps Ben's JTBD wording, adds **acceptance criteria** (our
assumptions), and carries two tags:

- **Phase** — `MVP` (trial / 1.0-MVP) · `1.0` (needed for 1.0, not MVP) ·
  `Later` (explicitly out of scope for now).
- **Build** — `⬜ backlog` · `🟡 partial` · `✅ built` (in the prototype).
  Everything starts `⬜` today; this column tracks prototype progress, not eng.

---

## Terminology bridge (important)

The prototype and Ben's JTBD use different words for the same things. Agreeing
this now avoids confusion later:

| Ben's JTBD term | Prototype term today | Notes |
|---|---|---|
| **Widget** | **Device / Endpoint** | "Widget = endpoint installation, sometimes called device or agent." The estate we already render on the Devices page *is* the Widget estate. |
| **Group** | _(new)_ | A container of Widgets that scopes what a CC Manager can see. Not yet modelled. |
| **User** | _(new)_ | A human who logs in (Admin or CC Manager). Distinct from a Widget's `user` field (the person a device belongs to). ⚠️ Naming collision to watch. |
| **Manager** | _(new)_ | Shorthand for a CC Manager user, scoped to one or more Groups. |
| **CC** | — | Assumed "Contact Centre." Confirm with Ben. |

**Open naming question:** a Widget row already has a `user` (device owner). A
"User" in this world is a login account. We should pick distinct UI labels
(e.g. "Member" / "Team member" for login accounts) to avoid collision. Flagged
in Open Questions.

---

## Proposed information architecture

Today's sidebar: **Workspace** group (Overview · Devices · Issues · Thresholds)
+ **Product development** (internal docs).

Proposal: add a third sidebar group, **Administration**, visible to Admins only.
CC Managers see the Workspace group scoped to their Groups and do not see
Administration.

```
Workspace
  Overview
  Devices        ← the Widget estate (operational view)
  Issues
  Thresholds

Administration   ← Admin-only nav group (hidden for CC Managers)
  Device management ← register, token, assign, revoke (Widget lifecycle)
  Members           ← login accounts & roles
  Groups
  Subscription      ← plan, usage, billing, invoices
  Audit log

Product development (internal)
  …
```

**Two views of one estate — deliberate.** "Devices" (Workspace) stays the
operational, health-first view supervisors use day to day. "Widgets"
(Administration) is the lifecycle/admin view: registration, tokens, Group
assignment, revoke, last-seen. Same underlying objects, different job. We could
collapse them later, but splitting keeps each view honest about its job. Confirm
this split with Ben — it's the biggest IA assumption here.

**Alternative considered:** a single combined "Settings" area with tabs instead
of top-level sidebar items. Sidebar items win for discoverability and because
each domain is substantial; noting it as a fork for Ben.

---

## Roles (high-level — detailed permission matrix deferred)

Per Ben's proposal, two roles for now. Kept deliberately high-level; the precise
who-can-do-what matrix is a separate working session.

- **Admin** — full administrative control: manage Users & roles, Groups,
  Widget lifecycle, subscription & billing, and read the audit log. Sees the
  whole estate.
- **CC Manager** — operational role scoped to assigned Group(s). Sees and acts
  on the Widgets/Issues in their Groups. No access to Administration (user
  management, billing, audit, Group structure) in the MVP assumption.

**Assumptions to confirm:**
- Exactly two roles for MVP; no custom roles, no granular per-permission editing.
- Role is global to the workspace; **scope** comes from Group assignment (a CC
  Manager's reach = the union of their Groups).
- At least one Admin must always exist (can't deactivate / demote the last Admin).
- Audit log is Admin-only to read; no one can edit or delete entries.

---

# Epic A — User & Role Management

> Admins create and manage other Users, including roles. Proposed roles: Admin,
> CC Manager.

### A1 — Invite a user by email · `MVP` · ⬜

> When I'm onboarding a new team member, I want to invite them to the platform by
> email, so I can give them access without raising a request with IR.

Acceptance criteria
- "Invite user" action opens a form: email (required), role (Admin / CC Manager),
  and — if CC Manager — one or more Groups.
- Invited user appears in the list with status **Invited / Pending** and an
  invite-sent timestamp.
- Sending creates an audit entry (see E). Sending the email itself is stubbed in
  the prototype.
- Validation: well-formed email, no duplicate of an existing active/invited user.

### A2 — Set role (and Groups) at invite / onboarding · `MVP` · ⬜

> When I'm onboarding a new team member, I want to set their Role (and Groups), so
> I can give them the right level of access quickly.

Acceptance criteria
- Role is required at invite. CC Manager requires ≥1 Group; Admin needs none
  (full scope).
- Group picker reuses the Group hierarchy from Epic B.
- Clear inline explanation of what each role can see/do (one line each).

### A3 — Update a user's role · `MVP` · ⬜

> When a team member's responsibilities change, I want to update their Role, so I
> can ensure they have the right level of access.

Acceptance criteria
- Role editable from the user's row / detail.
- Changing **to** CC Manager requires Group assignment; changing **to** Admin
  clears Group scope (with a note that Admins see everything).
- Guardrail: cannot demote the last remaining Admin.
- Change is audited (old → new role).

### A4 — Deactivate a user immediately · `MVP` · ⬜

> When a staff member leaves, I want to deactivate their account immediately, so
> they no longer have access to Clarion.

Acceptance criteria
- "Deactivate" sets status **Deactivated**; access revoked (stubbed).
- Confirmation dialog naming the user and what they lose.
- Deactivated users are hidden from default list but filterable; can be
  reactivated.
- Guardrail: cannot deactivate the last active Admin. Audited.

### A5 — Resend invite (1-click) · `MVP` · ⬜

> When a user didn't receive or lost their invite, I want to 1-click resend it
> from the user list, so I can unblock them without creating a duplicate.

Acceptance criteria
- Resend available inline on any **Invited / Pending** row (row action / kebab).
- No duplicate account is created; updates the invite-sent timestamp.
- Toast confirmation ("Invite resent to …"). Audited.

### A6 — Trigger a password reset on a user's behalf · `MVP` · ⬜

> When a user is locked out, I want to trigger a reset on their behalf, so I can
> restore access quickly without involving IR.

Acceptance criteria
- "Send reset" row action for active users; sends reset email (stubbed) and
  toasts confirmation.
- Does not change the user's role or status. Audited.
- ⚠️ Depends on auth/identity decisions (SSO vs password). See Open Questions.

### A7 — Audit access across the org (who has which role) · `MVP` · ⬜

> When I'm auditing access, I want to see which Users are assigned to which Roles,
> so I can confirm correct configuration and that no User has access they
> shouldn't.

Acceptance criteria
- User list shows role and (for CC Managers) assigned Groups at a glance.
- Filter by role and by Group; search by name/email.
- Optional grouping "by role" for a quick configuration scan.

**Epic A prototype scope (the one we'll scaffold first):** the Users & roles
list with statuses (Active / Invited / Deactivated), role + Group columns, and
visual stubs for invite / resend / reset / deactivate. Email + auth are stubbed.

---

# Epic B — Group Management

> Admins create and manage Groups within Clarion. Groups scope what a CC Manager
> can see.

### B1 — Create a Group hierarchy mirroring team structure · `MVP` · ⬜

> When setting up my org in Clarion, I want to create a Group hierarchy that
> mirrors my team structure, so each Manager only sees the Widgets they're
> responsible for.

Acceptance criteria
- Create / rename / delete Groups; support nesting (parent → child) to mirror
  org structure.
- A Group shows its Widget count and assigned Manager(s).
- Deleting a non-empty Group is guarded (move/confirm its Widgets first).
- **Assumption:** depth of nesting — start with 2–3 levels; confirm real-world
  need with Ben.

### B2 — Assign / reassign a Manager to Group(s) · `MVP` · ⬜

> When a Manager joins, leaves or changes teams, I want to update their Group
> assignment, so their visibility is accurate without touching individual Widget
> records.

Acceptance criteria
- From a Group: add/remove Managers. From a user (A2/A3): add/remove Groups.
  Both entry points stay in sync.
- Changing assignment updates the Manager's visible estate immediately (stubbed).
- Audited.

### B3 — Bulk place unassigned Widgets into Groups · `MVP` · ⬜  _(shared with C2)_

> When new Widgets come online and appear as unassigned, I want to (bulk) place
> them in the correct Groups, so I can make them visible to the right Manager(s)
> immediately.

Acceptance criteria
- An **Unassigned** filter/bucket surfaces Widgets with no Group.
- Multi-select rows → "Assign to Group" → pick target → confirm.
- Count feedback ("12 Widgets assigned to London/Tier 1"). Audited.

### B4 — Bulk move Widgets between Groups · `MVP` · ⬜

> When I need to restructure my team, I want to bulk move Widgets between Groups,
> so I can keep the hierarchy aligned with how the business is organised.

Acceptance criteria
- Multi-select in a Group (or Widgets list) → "Move to Group" → pick target.
- Source/target counts update; operation is atomic and audited.

### B5 — Import Group assignments from a directory (e.g. Entra) · `Later` · ⬜

> When my org already manages devices in a directory such as Microsoft Entra, I
> want to import Group assignments from that source…

Acceptance criteria
- **Out of scope for MVP** (Ben's note). Represent as a "Coming soon" entry point
  in the Groups area so the future is visible but clearly unavailable.

---

# Epic C — Widget Management

> Manage Widgets (endpoints): installation, configuration, removal. Widget =
> endpoint / device / agent.

### C1 — Register an agent & generate an auth token · `MVP` · ⬜

> When a new Widget is being set up, I want to register its agent and generate an
> authentication token, so it connects securely from day one.

Acceptance criteria
- "Register Widget" flow produces a registration record + a one-time auth token
  shown once, with copy + "I've saved it" confirmation.
- Optional: assign a Group at registration.
- New Widget shows status **Pending first contact** until it checks in.
- Token generation is audited (token value never logged).

### C2 — Assign unassigned Widgets to Groups (bulk) · `MVP` · ⬜  _(= B3)_

> When new Widgets come online and appear as unassigned, I want to (bulk) place
> them in the correct Groups…

See **B3** — same story, lives in both the Widgets and Groups areas.

### C3 — Bulk register & assign at scale · `MVP` · ⬜

> When deploying a large number of Widgets at once, I want to bulk register agents
> and assign them to Groups in a single action, so I can onboard at scale.

Acceptance criteria
- Bulk path: upload a manifest (CSV) **or** generate N enrolment tokens at once,
  with a default Group applied to the batch.
- Result summary: registered / failed, with downloadable tokens/credentials.
- **Assumption:** CSV import for MVP; deeper provisioning (MDM/scripted) is later.

### C4 — Revoke a Widget / token immediately · `MVP` · ⬜

> When a Widget is decommissioned or a token is compromised, I want to revoke it
> immediately, so I can prevent unauthorised access without delay.

Acceptance criteria
- "Revoke" on a Widget/token invalidates it immediately (stubbed); status →
  **Revoked**; confirmation dialog given the security weight.
- Revoked Widgets drop out of operational views but remain in the audit trail.
- Audited (who/when/why-optional).

### C5 — Estate view: status & last-seen · `MVP` · ⬜

> When reviewing my estate, I want to see all registered Widgets with their status
> and last-seen time, so I can identify any offline / not reporting for a while.

Acceptance criteria
- Admin Widgets list: identity, Group, status (Active / Pending / Offline /
  Revoked), **last seen**, token state.
- Sort/filter by status, Group, last-seen; surface "offline > N days."
- Reuses Devices table patterns; adds lifecycle columns not in the operational
  view.

---

# Epic D — Subscription & Billing

> Manage subscription plans: plan selection, billing details, payment.
> **Ben's note: plan selection, billing & payment are NOT in MVP/trial — needed
> for 1.0.** So most of this renders as informative / "coming soon" for now.

### D1 — See what's included in my current tier · `MVP` · ⬜

> When reviewing my Clarion subscription, I want a clear breakdown of what's in my
> current tier, so I understand what I'm paying for and spot gaps.

Acceptance criteria
- Subscription page shows current plan, included entitlements (seats, Widget
  capacity, features), and what's **not** included (upsell-aware, not pushy).
- Read-only in MVP; this is the one part of D that's genuinely useful in trial.

### D2 — Seat-usage warning before the limit · `1.0` · ⬜

> When my seat usage is climbing, I want a warning before I hit my limit, so I can
> plan an upgrade rather than be surprised by overage.

Acceptance criteria
- Usage meter (seats used / included) on the Subscription page.
- Threshold warning (e.g. ≥80%) shown in-app; banner near the cap.
- Email warning is `1.0`. Show the meter now; wire alerts later.

### D3 — Upgrade tier / add capacity · `1.0` · ⬜

> When my team is growing, I want to upgrade my tier or add features, so I can
> expand without disruption or a support ticket.

Acceptance criteria
- "Change plan" / "Add seats" entry points present but **"Coming soon"** for MVP.
- Define the flow on paper; no live payment in MVP.

### D4 — Browse & opt into add-ons (e.g. SSO) · `1.0` · ⬜

> When I want to extend Clarion, I want to browse add-ons and opt into relevant
> ones, so I can activate features like SSO without a new contract.

Acceptance criteria
- Add-ons catalogue (cards: what it does, price placeholder, enable).
- Enable is **"Coming soon"** in MVP. SSO is the headline example.

### D5 — Month-end peak usage & overage · `1.0` · ⬜

> When reviewing costs at month-end, I want my peak seat usage and any overage, so
> I can reconcile my bill and forecast.

Acceptance criteria
- Usage history (peak seats by period); overage highlighted. Placeholder data.

### D6 — Invoice & charge history · `1.0` · ⬜

> When reconciling last month's spend, I want a history of past invoices and
> charges, so I can verify billing and share detail with finance.

Acceptance criteria
- Invoices list (date, amount, status, download). Download stubbed. `1.0`.

### D7 — Update payment / billing details · `1.0` · ⬜

> When my payment method is expiring or changed, I want to update my card or
> billing details, so payments continue without interruption.

Acceptance criteria
- Billing-details form + payment method on file. **Not collected in MVP** —
  render as "Coming soon" / disabled.

### D8 — Payment-failure warnings & grace period · `1.0` · ⬜

> When a payment fails, I want clear in-app and email warnings and enough time to
> resolve it, so my team doesn't lose access.

Acceptance criteria
- In-app banner state for "payment failed — N days to resolve"; email is `1.0`.
- Define grace-period behaviour on paper now; design the failure/restore states.

---

# Epic E — Audit Log

> View, search and filter audit logs so Admins can track platform changes.

### E1 — Look up who changed what, and when · `MVP` · ⬜

> When an unexpected change is made to Users, Groups, Widgets or other settings, I
> want to look up exactly who made it and when, so I can understand what happened
> and take corrective action.

Acceptance criteria
- Audit list: **timestamp · actor · action · object (type + name) · outcome**,
  newest-first.
- Each entry expands to detail (before → after where relevant).
- Read-only; entries can't be edited or deleted.
- Covers the actions tagged "Audited" across Epics A–D.

### E2 — Review recent activity for shared oversight · `MVP` · ⬜

> When sharing admin responsibilities with another Admin, I want to review recent
> activity, so I can maintain oversight of changes across the product.

Acceptance criteria
- Default "recent activity" view (last 7/30 days).
- Filter by actor, object type (User / Group / Widget / Subscription), action
  type, and date range; free-text search.
- Empty + loading states defined. Export (CSV) flagged as `1.0`.

**Assumptions:** retention window TBD (e.g. 90 days MVP); no PII beyond actor
identity; the log records administrative actions, not telemetry/operational
events.

---

## Foundations & cross-cutting

| Item | Phase | Notes |
|---|---|---|
| Role-gated nav (Admin sees Administration; CC Manager doesn't) | `MVP` | New sidebar group; gate on current role. |
| "Current role" switch in prototype (demo Admin vs CC Manager) | `MVP` | Lets us show scoping in the canvas. |
| Group picker component (reused across A, B, C) | `MVP` | Build once. |
| Bulk-select + bulk-action table pattern (B3/B4/C3) | `MVP` | Generalise from Devices table. |
| Confirmation dialogs for destructive/security actions | `MVP` | Deactivate, revoke, delete Group. |
| Toasts for async confirmations | `MVP` | Pattern already exists (`toast`). |
| Audit write-path (every "Audited" action emits an entry) | `MVP` | Stubbed in prototype data. |
| Email delivery (invites, resets, warnings) | `1.0` | Stubbed everywhere in MVP. |
| Auth / SSO / identity provider | `1.0`+ | Gates A6 reset semantics + D4 SSO add-on. |
| Directory import (Entra) | `Later` | B5. |
| Live payments / billing provider | `1.0` | All of D's transactional parts. |

---

## Open questions for Ben

1. **IA split — Devices vs Widgets.** OK to keep the operational "Devices" view
   and add a separate admin "Widgets" lifecycle view? Or collapse into one?
2. **"User" naming collision.** A Widget already has a `user` (device owner) and
   we're adding login Users. Preferred labels to keep these distinct?
3. **CC = Contact Centre?** Confirm what "CC Manager" stands for and the
   audience.
4. **Role scope.** Confirm: 2 roles only for MVP, scope via Groups, no custom
   roles. Should a CC Manager ever invite/manage users within their Groups, or
   strictly Admin-only?
5. **Auth model.** Password + reset, SSO, or both for MVP? This shapes A6 and D4.
6. **Group nesting depth.** How deep does the real hierarchy go (regions →
   sites → teams)?
7. **Bulk registration input.** CSV manifest acceptable for C3 MVP, or is a
   token-generation-only path enough?
8. **Audit retention & scope.** Retention window? Admin-actions only, or also
   significant CC Manager actions?
9. **Subscription in trial.** Is the read-only "what's in my tier" (D1) the only
   billing surface you want visible during trial, with the rest "coming soon"?

---

## Suggested sequencing

1. **Foundations** — role-gated nav + demo role switch + Group picker.
2. **A (Users & roles)** + **B (Groups)** together — they're interdependent and
   unlock everything else. _(Users & roles is the screen we scaffold first.)_
3. **C (Widgets)** — builds on Groups for assignment.
4. **E (Audit log)** — once A/B/C emit audit events worth viewing.
5. **D (Subscription)** — D1 read-only now; the rest staged for 1.0.
