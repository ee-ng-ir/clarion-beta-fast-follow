# Custom thresholds by location — strawman

Draft, 28 Oct 2026. To prompt discussion, not a decision. Built on **Thresholds** in the Clarion prototype
(use the dashed "Prototype · viewing as" bar to switch people).

## Where this comes from
- The Clarion prototype had **custom rules** in June 2026 (Default thresholds + Custom rules + a rule editor
  side panel). They were removed on 30 Jun to match what the product shipped: one tenant-wide set.
- The RBAC proposal (`apps/client-console/RBAC-PROPOSAL.md`) introduces **Locations** and location-limited
  product roles, and records *"Thresholds stay tenant-wide for V1."* This strawman is what V2 could look like,
  and a check that the RBAC model doesn't paint us into a corner.
- Product today: thresholds live in fleet-config as `config.collector.thresholds` (flat warn/crit pairs) and
  are **served per widget user** to the widget. Per-location values can be resolved server-side at that point,
  so the widget contract doesn't need to change.

## The model in one paragraph
Tenant **defaults** apply to every endpoint. A **custom threshold** (a rule) overrides some metrics for one or
more **Iris Locations**. Each *location × metric* has at most **one** owning rule, so the effective value is always
"the rule that sets it, else the default" — no priorities or ordering. Widget users with **no location** always get
the defaults. Who can change what follows the Clarion role and its locations.

## Decisions taken in the strawman
| Question | Strawman answer | Why |
| --- | --- | --- |
| What does a rule target? | Iris **Locations** (the shared, admin-set list) | Same thing RBAC scopes by. June's version used detected regions; RBAC says the detected city is for the map only, never for access, and the same logic applies here |
| Call centre / agent scopes (June's "coming later") | Dropped | Locations are flat by decision. A team that needs different values is its own location |
| Overlaps | One owner per location × metric. A location can be in several rules for *different* metrics | Kept from June. Deterministic, easy to explain, no precedence UI |
| Unassigned widget users | Defaults only | Matches RBAC: unassigned users are only visible to all-location roles |
| Explaining the result | "What applies where" grid (location × metric, highlighted when a rule sets it) | Answers "why is this endpoint amber?" without reading every rule |

## RBAC — who can do what
| Person (prototype) | Role | Defaults + alert routing | Custom thresholds |
| --- | --- | --- | --- |
| Marcus Reyes | Tenant Admin (or Clarion Product Admin, every location) | Edit | Create / edit / delete any |
| Mei Lin | Clarion Product Admin · Sydney | Read-only | Sees rules that touch Sydney. Edits only rules whose locations are **all** hers. Location picker offers only Sydney |
| Hannah Schmidt | Auditor | Read-only | Read-only, all locations *(open question)* |
| Priya Nair | Clarion Viewer · Sydney | No Thresholds page | — |

Rules that reach locations a person can't see show as **"+N other locations"**. They never name those
locations. Rules entirely outside their access are counted ("2 more rules apply only to locations outside your
access") but not shown.

The server re-checks every write: each location in the rule must be inside the caller's **Product Admin**
locations, and no location × metric may already be taken. Note that `productAccess()` in `@ir/mock-data` unions
the locations of *every* Clarion role, so Viewer-everywhere + Product Admin-Sydney reads as admin everywhere.
Thresholds use Product Admin grants only. The real authorisation service needs the same distinction.

## The hard bits (for discussion)
1. **Blocked by a rule you can't edit.** Mei can't set Network Quality Index for Sydney because "ANZ voice
   quality" (Sydney + Melbourne + Auckland, owned centrally) already does. Options:
   a) Block, and show who owns it *(strawman today)*.
   b) **More specific wins**: a single-location rule beats a multi-location one. Lets site admins tune their
      site, but the result is harder to predict.
   c) Central admins can mark a rule **locked**; unlocked rules can be overridden per location.
2. **Can a site admin loosen thresholds?** A site admin could raise CPU critical to 99% and make their site
   look green to leadership. Do we cap rules within a band of the default, or only allow stricter values?
3. **Auditor access.** RBAC says Auditor sees no Clarion *data*. Thresholds are settings, not data, so the
   strawman shows them read-only. Agree with Swathi?
4. **Should Viewers see thresholds at all?** The page is hidden, but CC managers will ask why an endpoint is
   amber. Proposal: the endpoint drawer shows the values it's measured against and the rule name, read-only.
5. **Moving a widget user between locations** changes their thresholds on the next config pull. Show this in the
   "Set location" preview ("Thresholds change: Wi-Fi signal 50/25 → 60/40").
6. **Deleting a location** with rules on it: add "custom thresholds" to the delete-impact list next to widget
   users and group roles. Strawman: remove the location from those rules, and delete rules left with none.
7. **Alert routing** is tenant-wide and read-only for site admins here. Per-location recipients (send Sydney's
   reports to Sydney's IT) is the obvious next ask.
8. **Concurrency and audit.** Several admins now edit thresholds. Keep fleet-config's 409 handling per rule, and
   extend `fleet.thresholds.updated` with rule id, locations and before/after values.
9. **Limits.** Max rules per tenant, max locations per rule. Effective config size per widget is bounded by the
   metric count, so this is about UI and audit noise rather than payload.

## Not in the prototype
- Rules aren't persisted (in-memory only) and don't feed the endpoint states or the widget yet.
- Endpoint drawer "measured against", location-move preview and delete impact (points 4–6).
- Policy options 1b / 1c and the band caps in point 2.

## Build notes
- New: `src/data/thresholdRules.ts` (model, access, resolution), `components/thresholds/{CustomRules,WhatAppliesWhere,ViewAs}.tsx`.
- Changed: `RuleEditor.tsx` (locations instead of regions, edit scope) and `ThresholdsPage.tsx`.
- People and locations come from `@ir/mock-data/access` (Clarion now depends on it). Nothing in `packages/` changed.
