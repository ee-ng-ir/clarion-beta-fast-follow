# Clarion widget users — how it works today, the ask, and the options

> Source: `iros/abhra` main, downloaded 19 Oct 2026, read against the live dev admin
> (`admin.dev-abhra.ir.com/…/users?tab=clarion`). Companion to the PO page
> "Enhanced User Management: Bulk Actions and CSV Integration for Admins" and R&D's
> four comments. The prototype for this lives at **Administration → Widget users**.

## The short version

Six things in the code change the conversation:

1. **Remove has no confirmation.** One click on the red icon hard-deletes the user
   (`clarion-user-row-actions.tsx` calls `DELETE` straight away). With bulk on top, this
   is the first thing to fix.
2. **Deactivate already exists, end to end — just not in this screen.** The API toggles
   `active`, deactivation frees a licence, reactivation re-checks the cap, and the widget
   answers `licensed:false` for an inactive user. The client even has the helper. Only the
   Clarion tab doesn't use it (the Account Admins tab does). That is a reversible way to
   offboard people that we are not offering.
3. **Edit already exists in the API too.** `PATCH` updates name, email and site. Login ID
   can't change, by design: the user's ID is a hash of tenant + login ID.
4. **Connection status is already in the data.** Every user carries `registerStatus`:
   empty = the widget has never called in, `registered` = it has, `pending_invite` = it
   called in but the invite email failed. The list API returns it; the table doesn't show
   it. *Last seen* is different — it lives in the analytics database, not here.
5. **The list can't be taken stock of.** 15 users per request, in an order that is
   effectively random (sorted by hashed ID), no total in the list, and the "User" sort only
   reorders the rows already loaded in the browser.
6. **"A bad row fails the whole file" is a front-end rule, not a back-end one.** The API
   would write the valid rows and report the bad ones; the UI blocks the file before it
   gets there (IROS-509). Worth knowing when we decide what "apply valid rows" means.

---

## Decision log — every PO ask, what we're doing, and why

**Status:** ✅ Keep — as asked · 🔧 Adapted — same intent, different shape · ❌ Dropped ·
➕ Added — not asked for · ❓ Open — needs a call (recommendation given)

### Bulk select and delete

| # | PO ask | Status | Decision | Why |
|---|---|---|---|---|
| 1 | Tick individual users | ✅ | Checkbox per row | — |
| 2 | Tick all users on the current page | 🔧 | "Select all loaded users" (header checkbox) | There are no pages: the list loads 15 at a time as you scroll. Same intent, honest wording. |
| 3 | Select every user matching the current search or filter | ✅ | "Select all N matching" in the selection strip under the toolbar | The core of R&D's point 1. The server re-checks the count on confirm and refuses if another admin changed the list. |
| 4 | Confirmation shows how many will be removed | ✅ | Dialog with the count and a sample of names; type the count for 10+ | Typing the count is a proven guard for mass deletes (Customer.io). |
| 5 | Deleted user loses widget access via the licence flow | ✅ | Unchanged — remove → widget answers `licensed:false` | Already how the back end works. |

### Download the user list

| # | PO ask | Status | Decision | Why |
|---|---|---|---|---|
| 6 | Download every user as CSV, however they were added | ❓ | Export downloads everyone. **Open:** today it follows active filters. **Recommend:** always everyone, and export a subset by selecting it. | The PO asked for the whole list; following filters makes "Export" mean different things at different times. |
| 7 | Same columns as the upload template | ✅ | `loginId, name, email, site` only | Export → edit → import round trip verified: re-importing an export changes nothing. |
| 8 | Info-only columns: connection, date added, last seen *(nice to have)* | ❌ | Dropped | Extra columns complicate the round trip; connection is already visible and filterable in the table. |

### Re-upload the CSV to apply changes

| # | PO ask | Status | Decision | Why |
|---|---|---|---|---|
| 9 | Match each row to a user by login ID | ✅ | Matched by login ID, case-insensitive (as the back end does) | Login ID can't change — it derives the user's ID. `chenry` and `demo\chenry` are two people, so the preview **warns about lookalikes** (➕). |
| 10 | Unknown rows are added | ✅ | Added; licence check before anything is written | — |
| 11 | Rows that differ are updated | ✅ | Name, email and site updated. **A blank cell keeps the current value.** | Behaviour change from today (existing users are silently skipped). Blank = keep, so a sparse file can't wipe data — trade-off: a CSV can't clear a field. |
| 12 | Users missing from the file are removed | ❌ | **Dropped — a CSV never removes anyone** | Decided (Ee). A partial, filtered or stale file would silently delete real people. Offboarding happens in the table. Retires R&D's points 2 and 4. |
| 13 | Nothing changes until the admin reviews a preview (added / updated / removed, and which) | ✅ | Preview in the same dialog: "N new, N updated, N skipped" + the rows that change | No "removed" count because nothing is removed (#12). |
| 14 | Admin can download the list of changes | ❓ | **Open:** cut when the dialog was simplified. **Recommend:** restore as a small link in the preview. | It was a firm requirement, not a nice-to-have — useful for sharing with Finance/IT. |
| 15 | Invalid rows reported individually, with the reason | ✅ | Listed first in the preview: "Skipped — email isn't valid", "Skipped — same login ID as row 7" | — |
| 16 | Correct and re-upload, or apply only the valid rows | ✅ | Valid rows apply; bad rows are skipped and listed; re-upload any time | Safe only because nothing is ever removed by file (#12). Duplicate login IDs are skipped, not blocking — differs from R&D's suggestion. |

### Edit a single user *(nice to have)*

| # | PO ask | Status | Decision | Why |
|---|---|---|---|---|
| 17 | Edit a user's details without deleting and re-adding | ✅ | **Kept** — decided (Ee). "Edit details" in the row menu: name, email, site. Login ID shown read-only with the reason. | The quickest fix for a typo; the API already supports it. Login ID can't be edited — the user's ID is derived from it. Eng: edits aren't audited today. |

### Connection status

| # | PO ask | Status | Decision | Why |
|---|---|---|---|---|
| 18 | Show *Pending connection* (never signed in) or *Connected* (signed in, active) | ❓ | Shown as a column. **Open:** the data means "has connected **at least once**", not "active now", and there's a third state (invite email failed). **Recommend:** use the PO's labels — *Pending connection* / *Connected* — with a tooltip "Has connected at least once", and fold "invite failed" into Connected with a small warning. | `registerStatus` is set the first time the widget calls in and never goes back. Only last seen could say "active", and that's dropped (#19). |
| 19 | Show when the user was last seen *(nice to have)* | ❌ | Dropped | Needs a join with the analytics database. Trade-off: can't spot people who connected once and left. Bring back if that becomes a support problem. |
| 20 | Filter on status, e.g. everyone still pending after a rollout | ✅ | "Widget" filter | Eng: the list API has no filter parameter today — needs adding server-side. |

### Audit

| # | PO ask | Status | Decision | Why |
|---|---|---|---|---|
| 21 | Every bulk action recorded: who, when, what, how many | ✅ | Counts only — never names or login IDs | PII policy in the audit library. Eng: edits and deactivations aren't audited today at all; needs adding. |

### Scope

| # | PO ask | Status | Decision | Why |
|---|---|---|---|---|
| 22 | Out: deployment mode in the CSV | ✅ | Out | — |
| 23 | Out: directory sync / SCIM | ✅ | Out | — |
| 24 | Out: roles and reporting lines | ✅ | Out | Covered by the RBAC work. |

### Not asked for, but in the solution

| # | Addition | Status | Why |
|---|---|---|---|
| 25 | **Deactivate / Reactivate** (row and bulk), suggested as the default way to offboard | ➕ | Reversible, frees the licence, keeps history. Already supported by the API, just not exposed. Standard in Okta, Mural, Apollo. Only offered where it applies (can't deactivate the deactivated). |
| 26 | **Confirm on single remove** | ➕ | Today one click deletes, with no confirmation. |
| 27 | **Select-all guard** — action refused if the matching count changed | ➕ | Several admins share one list. |
| 28 | **Lookalike login ID warning** on import | ➕ | Mixed formats (`domain\name` vs `name`) would otherwise double-count people and licences. |
| 29 | **Status filter, sort, total count** | ➕ | Today the list has no count and the sort only reorders loaded rows. |

---

## 1. How each function works today

| Function | What it does | Where |
|---|---|---|
| **Licence meter** | `active / limit`. Limit is the `clarion-widget-user-max` feature flag; any error or 0 means **no licences** (fail-closed). Only *active* users use a licence. | `use-clarion-users.ts`, `admin_users.go` (`UserStats`) |
| **List** | Infinite scroll, **15 per request** (API max 100), virtualised table. Order = DynamoDB sort key `USER#<hash>` → no meaningful order. No total count in the list response. | `use-clarion-users.ts`, `dynamodb.go` `ListUsers` |
| **Sort by User** | Client-side only, over loaded rows. At 20,000 users it sorts the first page or two. | `clarion-users-table.tsx` |
| **Search** | Server-side, case-insensitive *contains* on name, login ID, email **and site** (placeholder doesn't mention site). Implemented as read-then-filter across the tenant's users, no index — gets slower as the list grows and matches get rarer. | `dynamodb.go` `matchesSearch` |
| **Add user** | One user: first/last name, login ID, email, site. Back end needs only login ID. Login ID is lower-cased; a duplicate returns 409. Over the licence cap returns 403. | `add-clarion-user-modal.tsx`, `CreateUser` |
| **Login ID** | Lower-cased, then hashed with the tenant into the user ID. **Immutable.** Matching is case-insensitive only: `chenry` and `demo\chenry` are two different people. | `db/userid.go` |
| **Remove** | **No confirmation.** Hard delete in fleet-config, frees the licence, publishes a `delete` event. Analytics keeps the row with `active=false`. Widget gets `licensed:false` on its next call. Audited as `fleet.widget_user.deleted` (user ID only, no PII). | `clarion-user-row-actions.tsx`, `DeleteUser` |
| **Deactivate / reactivate** | Fully supported by API + client (`PATCH active`), counted correctly against licences. **Not exposed** on the Clarion tab. **Not audited.** | `client.ts` `runClarionUserAction`, `UpdateUser` |
| **Edit** | `PATCH` name / email / site. **Not exposed. Not audited.** | `UpdateUser` |
| **CSV template** | `loginId,name,email,site` | `public/templates/clarion-widget-users-template.csv` |
| **CSV upload — browser** | Requires `loginId,name,email` columns and values, checks email format. **Any bad row → whole file rejected**, modal closes, error toast lists rows (IROS-509). Then uploads in the background with a toast; Add/CSV buttons disabled until it finishes. No preview. | `csv-bulk-upload-modal.tsx` |
| **CSV upload — server** | Max 20,000 rows / 10 MB. Only login ID is required. **Duplicates inside the file: silently skipped (first wins).** **Users already on the list: silently skipped — not updated.** Licence check is all-or-nothing on the number of *new* users. Writes in one batch. | `admin_users.go` `ImportUsers` |
| **Audit** | `widget_user.created`, `widget_user.deleted`, `widget_users.imported` (counts only). Personal data never enters the trail. Nothing for edit or deactivate. | `lib/audit/clarion/*` |
| **Export / download** | Doesn't exist. | — |
| **Connection status** | `registerStatus` set the first time the widget asks for its config (see above). Returned by the API, not shown. | `handler/config.go` |
| **Last seen** | Per *device*, in the analytics Postgres (`last_seen`), not in fleet-config. Showing it per user needs a join across services. | `data-model/…/clarion` |

---

## 2. The PO's ask against what exists

| PO requirement | Already there | Missing | Notes |
|---|---|---|---|
| Bulk select (individual, page, all matching) | — | Selection UI; a total count for a filter; a bulk endpoint | "All matching" can't be done from the browser by IDs at 20k — needs a server action that takes the filter. |
| Confirm before delete, with count | — | Confirmation at all (single remove has none today) | |
| Deleted user loses widget access via licence flow | ✅ delete → `licensed:false` | — | Deactivate does the same thing *reversibly*. |
| Download every user as CSV, same columns | — | Export endpoint | Paging the list API would be 200 requests for 20k. |
| Info-only columns (connection, added, last seen) | `registerStatus`, `createdAt` ✅ | Last seen | Last seen needs analytics join. |
| Re-upload: match on login ID | ✅ matching is by login ID (case-insensitive) | — | Format differences (`domain\` prefix) are different users — a cleaning problem the preview should surface. |
| Re-upload: add / **update** / **remove** | add only | update, remove | Today existing users are skipped, not updated. Remove-by-omission is new and is the dangerous part. |
| Preview before applying, downloadable change list | — | Preview step | Server needs a dry-run mode. |
| Invalid rows reported individually | ✅ client lists row + reason | Server-side email/name validation | |
| "Apply only the valid rows" | API can, UI forbids (IROS-509) | — | Safe for add/update; unsafe for sync (a skipped row looks "missing"). |
| Edit a single user | ✅ API | UI | Login ID can't be edited. |
| Connection status column + filter | ✅ data | UI; server-side filter param | Filter on loaded rows only would be wrong at scale. |
| Audit every bulk action | created/deleted/imported | update, deactivate, bulk remove | Counts only — "which users" can't go in the trail (PII policy). |

---

## 3. R&D's four comments, checked against the code

1. **"No bulk select; the list loads as you scroll."** Confirmed — and it's worse than it
   sounds: 15 per request, no meaningful order, sort only on loaded rows, and no total count
   in the list (only from `user_stats`). "Select all 20,000" therefore needs a server-side
   action by filter, plus the count for that filter.
2. **"Today's CSV only adds and saves straight away; the new one is the full list, so keep it
   a separate action."** Confirmed. Agree: additive import and "make the list match this file"
   must never share a button.
3. **"Existing login ID = update, not error. In-file duplicate = reported and blocks. Today
   both are skipped silently."** Confirmed — both are silent skips today
   (`ImportUsers`, first occurrence wins). Note: matching is case-insensitive already.
4. **"A bad row fails the whole file today; applying only valid rows conflicts, and is risky
   because a skipped row would look missing."** Confirmed at the browser. The server is
   actually tolerant. The risk only exists if omission means removal — which is the case for
   sync, not for add/update.

---

## 4. Options, by problem

Each area lists options from smallest to biggest, then a recommendation. Principles they're
tested against (from the problem brief): deletion is never a side effect; additive and
destructive paths stay separate; destructive change is previewed, counted, attributable and
ideally recoverable; the list is knowable; safe with several admins.

### A. Removing people safely
- **A1 — Confirm single remove.** Quick win; fixes a live risk.
- **A2 — Offer Deactivate as the default way to offboard.** API exists; frees the licence;
  reversible; history kept. Remove becomes the secondary, permanent action.
- **A3 — Bulk remove / bulk deactivate** with a dialog that states the count and licences freed.
- **A4 — Soft delete with an undo window** (e.g. 14 days). Needs back-end work.
- **Recommend:** A1 now; A2 + A3 together; A4 if support tickets show accidental removals.

### B. Selecting at scale
- **B1 — Loaded rows only.** Simple, but "select all" would mean "all 15 I happen to have".
- **B2 — Page, then "Select all N matching".** The Gmail pattern. Needs a server count per
  filter and a bulk endpoint that takes the filter plus the **expected count** — the server
  refuses if the number changed (another admin, a background import).
- **B3 — Action on a filter.** "Deactivate everyone never connected after 30 days" without
  ticking boxes.
- **Recommend:** B2 with the expected-count guard. B3 falls out of the same endpoint.

### C. Knowing who's on the list
- **C1 — Export** (server-side), template columns + read-only columns.
- **C2 — Total count and filters** (connection, active/deactivated, date added).
- **C3 — Make sort honest** — server-side sort, or remove the sort until it exists.
- **Recommend:** all three; C3 is small and removes a misleading control.

### D. Changing details
- **D1 — Edit dialog** for name, email, site (API exists). Explain why login ID is locked;
  "change login ID" = add the new one, remove the old one.
- **D2 — Back-end login ID rename** that migrates config. Expensive; only if real need.
- **Decided (Ee):** **D1 — keep single-user edit** (name, email, site; login ID read-only).

### E. Bulk change by file
- **E1 — Keep "Import" additive, add a preview, and let existing rows update.** New = add,
  changed = update, same = unchanged. Nobody is removed, so applying only the valid rows is
  safe. Behaviour change: re-uploading an old file would overwrite newer edits — the preview
  must show field-level changes.
- **E2 — Separate "Replace the list" mode.** The file is the whole list; users not in it are
  removed (or deactivated). Every row must be valid; duplicates block; the preview lists who
  goes; the admin types the count to confirm; warn when the file is much smaller than the
  list or older than the last change.
- **E3 — Explicit remove-by-file.** A file of login IDs to remove (or deactivate). No
  omission semantics at all.
- **Recommend (revised):** **E1 only.** Import adds and updates; it never takes anyone off.
  Taking people off happens in the table — filter (e.g. not seen for 90+ days), select,
  deactivate. That removes the riskiest path (E2) and a second file mode (E3) entirely, and
  every one of R&D's file-related risks goes with them. Revisit E3 only if admins ask for
  "remove these 500 IDs from my HR export".

### F. Connection visibility
- **F1 — Show `registerStatus` now:** *Never connected / Connected / Invite not sent*. Filter
  needs a server-side parameter.
- **F2 — Last seen** — new endpoint joining analytics. 1.0.
- **Recommend (revised):** **F1 only.** Last seen is a PO nice-to-have that needs a cross-service
  join; dropped.

### G. Audit
- Bulk events with counts (allowed under the PII policy); **add the missing update and
  deactivate events** — they're gaps today regardless of bulk.

---

## 5. Patterns elsewhere (Mobbin sense-check)

Most of the direction above is established practice, not invention:

| Pattern | Who does it | Use here |
|---|---|---|
| **Deactivate as the normal offboarding**, reversible, separate from delete | [Mural](https://mobbin.com/screens/72184367-08da-465e-9b6a-dfb0448fe354) ("you can reactivate this member anytime"), [Okta](https://mobbin.com/screens/eaf5ce0f-9a10-4324-a9f1-a9097f7ff2ce), [Apollo](https://mobbin.com/screens/a071c333-bcc8-414d-9965-f8009bc215a6), [Campsite](https://mobbin.com/screens/827bdaf8-055e-4c8f-848c-be2bdaf01e3d) (Active / Invited / Deactivated views) | A2 |
| **Connection / last seen as a column** | [Tailscale](https://mobbin.com/screens/6823bfb6-6e19-4e60-b4be-ea7c8acc9e4d) users list: Joined, Last seen, green "Connected" | F1, F2 |
| **Bulk actions in the table toolbar, with "select all"** | [HubSpot](https://mobbin.com/screens/bb7f0f5a-1de4-4773-b66a-f46e11c4ea24) (toolbar becomes "2 contacts selected · Assign · Edit · Delete"); floating variants: [Calendly](https://mobbin.com/screens/40804c9e-702d-41a4-8fbc-a1c7f070fc55), [Asana Admin](https://mobbin.com/screens/86b47c19-cb80-408b-8e51-571f60d76dcd) | B2 — decided (Ee): a strip under the toolbar, as in the Iris console's audit Timeline; not floating, header unchanged |
| **Type the count to confirm a mass delete** | [Customer.io](https://mobbin.com/screens/3e28b555-ff21-400b-bc0e-6858ed5c6124) ("Confirm how many people you're deleting") | A3, E2 |
| **Undo after delete** | [HubSpot](https://mobbin.com/screens/bb7f0f5a-1de4-4773-b66a-f46e11c4ea24) toast: "2 Contacts were deleted. Restore Contacts." | A4 |
| **Download → edit → upload → validate → review → apply** | [Deel bulk edit](https://mobbin.com/flows/f9e90f25-5d36-4474-86a5-d61fbc08051b) | E1 — the PO's ask, done as a staged flow rather than a silent sync |
| **Bulk-edit one field, "keep current value" by default** | [Pipedrive](https://mobbin.com/screens/1c70f25d-7816-4204-a257-c5c4309dcb0c) | Considered for a "Set site" bulk action; not included (single-user edit only) |
| **CSV import with options before it runs** | [Okta import users](https://mobbin.com/flows/69efb81d-f7c3-463d-a757-cbac5b3bdcfe), [Sprig](https://mobbin.com/flows/10b68bf6-5954-47f7-b95f-075dd3f49378) | E1 |

What we did **not** find: a mainstream product that makes "the uploaded file is the whole
list, anything missing is deleted" the default import. Where full replacement exists it's a
separate, guarded action — which supports keeping E2 advanced (or out).

## 6. Scope: the PO's nice-to-haves are out

Dropped from the proposal and the prototype, because each adds cost without serving a core job
(single-user edit was reconsidered and **kept** — see decision log #17):

- **Info-only columns in the export** (connection, date added, last seen). An export now has
  exactly the template columns, so it can be edited and imported straight back (round trip
  verified: re-importing an export reports every row as unchanged). Connection is still
  visible and filterable in the table.
- **Last seen.** Needs a join with the analytics database. "Never connected" already covers
  failed or incomplete rollouts.

Trade-off to note: without last seen there's no way to spot people who connected once and
then left. If that becomes a real support problem, last seen is the thing to bring back.

## 7. Decisions needed

1. Is **Deactivate** the default offboarding action, with Remove for mistakes and clean-up?
2. Should re-importing an existing login ID **update** it (E1)? It changes today's behaviour.
3. ✅ **Decided (Ee):** a CSV never removes anyone. No "the file is the whole list" sync (E2) and
   no remove-by-file (E3) — someone missing from a file stays on the list. Offboarding happens
   in the table. This also retires R&D's partial-file and skipped-row risks.
4. In-file duplicates: **block** (R&D) or **first-wins with a warning** in the preview?
5. ~~Last seen in v1?~~ Dropped with the other nice-to-haves (see below).
6. Login ID cleanliness (`domain\name` vs `name`): flag in the preview, or normalise?

## 8. The prototype

**Administration → Widget users** (`/admin/widget-users`), built with Picasso.

- **View: As built today / Proposed.** "As built" reproduces the live screen, including
  one-click remove, client-only sort, and the IROS-509 CSV rules (all-or-nothing, silent
  skips). "Proposed" layers the options above.
- **Users: 42 / 2,000 / 20,000.** 42 is the dev tenant's real list. The bigger sets are
  deliberately messy: four login-ID formats, the same person under two formats, free-text
  sites ("Sydney", "sydney", "SYD", "Sydney CBD"), ~13% never connected, ~4% invite failed,
  ~12% not seen for 60+ days, a few deactivated.
- **The list pages 15 at a time with latency**, like the real API, so "select all" is real.
- **Proposed includes:** connection and status columns; filters; server-side sort; total count;
  row menu (edit details, deactivate/reactivate, remove with confirm);
  bulk actions in a strip under the toolbar (same treatment as the active-filter strip in the Iris
  console's audit Timeline) — header, page actions, search and filters stay as they are; the
  strip reads "✕ N selected · Select all" with the selection's actions; Export shows the count
  ("Export 30") so it can't be confused with the page-level Export; ticked rows survive a new
  search or filter ("3 not shown by this search or filter"); actions offer only what applies (Deactivate if any are active, Reactivate if
  any are deactivated, with counts when mixed), plus export and remove (type the
  count for 10+); "select all N matching" with an **expected-count guard** (use *Another admin
  adds 3* to see it refuse).
- **Export** is one button: it downloads what you're looking at — everyone, or the filtered set.
- **Import** is one button and one dialog: pick a file, see "N new, N updated, N skipped" and
  the rows that change, confirm. Bad rows are skipped (safe — import never removes anyone).
  A built-in test file (prototype only) has new starters, fixes, a lookalike login ID and bad rows.

Data and simulated API: `src/data/widgetUsers.ts`. Screens: `src/pages/WidgetUsersPage.tsx`,
`src/components/admin/widget-users/`.

> **Local setup note:** `package-lock.json` is out of sync with `package.json` (e.g.
> `@radix-ui/react-checkbox` is declared but not locked or installed). Run `npm install`
> once — it also clears the 7 existing type errors, which all come from those missing packages.
