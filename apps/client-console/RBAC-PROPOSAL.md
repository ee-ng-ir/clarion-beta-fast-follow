# RBAC — initial design proposal (Iris platform, Client Admin)

Draft, 27 Oct 2026. Built in the prototype under **Administration → Access** (Users, Groups, Locations, Roles) and **Clarion → Widget users** (Location column).

## Sources
- Ben Webb — *Iris Platform: RBAC, Groups and Locations* (draft) — the model this follows
- Ben Webb — *Iris Platform: SSO Implementation*, *Iris Platform: SCIM User Provisioning* (build on RBAC)
- Swathi Sreenath — *Role base access control for Clarion* (PO ask) and Louis Zhu's work breakdown

## The model in one paragraph
IR owns a fixed set of roles. **Tenant roles** (Tenant Admin, User Admin, Auditor) cover the whole tenant. **Product roles** (Product Admin, Editor, Viewer) cover one product and can be **limited to locations**. Roles go to **groups**; members inherit them. Groups and locations are both **flat**. A role given straight to a person is allowed but flagged as an **exception**. Access is the sum of all roles — no deny rules.

## How the PO's ask maps
| PO ask (Clarion RBAC page) | In this model |
| --- | --- |
| CC Manager role | Not a role. A group, e.g. "Sydney CC managers", with **Clarion Viewer · Sydney** |
| Only Overview + Endpoints; no Thresholds, no admin portal | Viewer: Overview and Endpoints, read-only. Thresholds need Product Admin; Administration needs a tenant role |
| Scope = reporting line, all levels down | **Changed.** Scope = locations. A "manager of managers" gets a group with several locations, or all locations |
| Server-side scoping everywhere | Same — central authorisation service filters lists, search, map, drill-downs, exports |
| Assign the role in Iris user management | Users / Groups pages in Iris (Client Admin), not OPS Console |
| IT Admin unchanged | Existing Client Admins become Tenant Admins at migration |

## Screens
- **Users** — who can sign in, their groups and a one-line access summary ("Clarion Viewer · Sydney"). Filters: group, role, location, status. Flags people with a direct role and people with no access. Drawer: what they can see in Clarion (ticks), groups, and every role with where it came from (group or Direct).
- **Groups** — flat list with roles, members and membership source ("Managed in Iris"; later "Linked to IdP group"). Drawer: add/remove roles and people. Delete shows the roles members will lose.
- **Locations** — flat list, widget-user counts, and which groups are limited to each one. Warns about widget users with no location. Delete shows impact.
- **Roles** — read-only catalogue, what each role means in Clarion, who holds it, and a Clarion capability matrix.
- **Widget users** — Site column becomes **Location**; Location filter; bulk and per-row **Set location**.

### Making assignment easier (added 27 Oct)
- **Give access** — from Users (header, bulk strip, user drawer) and from Locations ("Give access to Sydney"). Two questions — *What should they do?* (See the Clarion dashboard / Manage Clarion / Manage users and groups / Review access) and *Where?* (locations). It finds the group that already gives exactly that, or creates one with a suggested name ("Melbourne CC managers"). People always land in a group, never a direct role.
- **Preview before saving** — every assign dialog says what they'll see and what they won't ("Overview and Endpoints for Sydney (16 widget users). Not Thresholds or Administration.").
- **Bulk on Users** — tick people, then Give access, Add to group or Remove from group (with last-admin safeguards).
- **Roles → Permission details** — Vanta-style full matrix in words (Full / Their locations / View only / No access).
- **Built-in IT administrators group** — locked like Retool's Admin group: always Tenant Admin, can't be renamed or deleted; membership can still change.
- **Suggested groups** — Groups page offers one *[Site] CC managers* group per location (+ leadership, Clarion administrators); Add location offers its group too. Nothing is created until confirmed.
- **Match from site** — reads each widget user's typed site ("Sydney", "SYD", "Sydney CBD") as a location and sets them in one go; unmatched sites can become locations in one click. CSV import/export gains a *location* column.
- **Edit locations** on a group's role in place (tick Brisbane, done).
- **Move to another site** — swaps a manager's site group in one step.
- **Add location** is one 3-step dialog: name → confirm matching widget users → create the site's group and pick its managers.
- **Who can see this?** on a widget user — everyone whose access covers them, and why.
- Later: group templates, "Same access as…", a needs-attention strip.

Safeguards built in: last Tenant Admin can't be removed, demoted or deactivated; you can't remove your own admin access; break-glass accounts are always Tenant Admin and can't be deactivated here.

## To discuss with Swathi
1. **Reporting line vs locations.** Does location scoping meet the CC Manager need for launch? If a manager's team is spread across sites, location doesn't fit. Reporting line could come later through SCIM (manager attribute is out of scope there today).
2. **Editor in Clarion.** Nothing to edit yet, so it equals Viewer. Is there an action (acknowledging alerts, notes) that should need Editor?
3. **Site → Location.** Free-text site becomes a managed location. The CSV would take a location name; unknown names are flagged in the import preview. Who cleans up existing sites (Sydney / sydney / SYD)?
4. **Unassigned widget users.** Visible only to people with all-location access. Should new users default to a location?
5. **Clarion Product Admin limited to locations.** Can a site admin manage widget users only in their site? (Model allows it; licences are tenant-wide.)

## Decided: locations follow Ben's model (27 Oct)
- Flat list, named by the customer. No nesting — a country or regional manager's group lists each site.
- Each widget user is in at most one location, set by an admin. Detected country / city / suburb is for the map and filters only, never for access.
- No location = only people with all-location access see them.
- Thresholds stay tenant-wide for V1.

## SSO and SCIM knock-ons
- **JIT and licences.** JIT creates an Iris user on first SSO login. Ben's SSO page flags admin licence limits; if admin seats are capped, JIT needs: a default group or deny when no IdP group matches, and a clear rejection when the limit is hit. Recommend **default = deny** (no access until linked to a group), so JIT never hands out data by accident.
- **SSO wizard** still maps IdP groups to the old two roles. Under this model it maps **IdP group → Iris group**. Needs updating.
- **SCIM** needs groups to be flat — this model already is.

## Not in the prototype yet
- Auditor's access export (CSV), the audit events, migration report
- Location in Add/Edit widget user and in the CSV import
- "Can't grant more than you hold" for User Admins (only one admin persona is modelled)
