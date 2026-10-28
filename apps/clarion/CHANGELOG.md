# Clarion — Change Log

A running record of the changes made to the Clarion fleet-dashboard prototype, organised by product area and framed against the initial requirements.

---

## 1. Terminology & core data model

- Renamed the core entity twice to land on the right language: **"endpoints" → "users" → "devices"** across the whole product.
- Renamed **"Clarion Score" → "Clarion Network Score" (CNS)**.
- Modelled **multiple users per device** (hot-desking): a device carries a `users[]` list; offline rows show the **machine name only** (no user).
- **CNS rescaled to 0–100** with quality bands: **Excellent (80–100)** and **Good (60–79)** = success, **Fair (40–59)** = warning/amber, **Poor (0–39)** = danger/red. Applied consistently to the KPI, drilldown metric, and location scores.
- Deterministic, seeded dataset of **2,847 devices** with per-location healthy / warning / critical / offline counts that feed the map, tables, and issues.
- Renamed the drilldown **"Devices" sub-tab → "Peripherals"**.
- Added a **"Devices model" product-development page** documenting offline / active / unknown(TBC) states.

## 2. World map & Overview

- **Two-line pin tooltips**: line 1 = location name + device count; line 2 = healthy / warning / critical breakdown by number.
- Fixed the **selected-pin double-tooltip**: a selected pin shows the new tooltip; hovering only triggers on *other* pins.
- **Hover-on-bar tooltips**; fixed the **Hyderabad "green / no issues" bug**.
- **Responsive map** with a bounded locations list; city pins **re-projected** in country view so clustered/single-city countries don't strand pins in a corner.
- Fixed the **card header not updating to the selected city** (the "Australia → Sydney" bug).
- **"View devices"** supports country → all-its-cities scope.
- **Map selection now filters the Critical issues card** — selecting a city scopes to that city; drilling into a country scopes to all its cities; back to world = whole fleet.

## 3. KPI strip

- **Total devices** badge on the "Entire fleet" line.
- **Active devices** (renamed from "Online") with a healthy/warning/critical segmented bar.
- **Open issues** with a 24-hour delta ("+3 today") and a warning/critical bar.
- **Clarion™ Network Score** card with the 0–100 value and its quality band.
- Live **30-second refresh** with score jitter.

## 4. Overview "Critical issues needing attention" card

- Renamed to **"Critical issues needing attention"**; shows **critical issues only** (warnings live on the Issues page).
- Empty state reads **"No critical issues in {location}"** with a recent-activity summary.
- **Scopes to the map selection** (city / country / whole fleet), including the recent-activity numbers.
- **Derives its list from the real critical devices** (grouped by cause) so its counts reconcile exactly with the map tooltip's critical total.
- The list **scrolls within the card** (capped height ≈ 5 rows, `overscroll-contain`) with the title and summary line pinned above.

## 5. Issues model (unified)

- Replaced the old **curated, `activeAlerts`-capped** rollups with **real device-derived issues**: unhealthy devices grouped by **cause + severity**, uncapped.
- As a result, every surface now reconciles:
  - **Open issues KPI = 43** (23 critical + 20 warning) — the real total, not the capped 9.
  - Overview critical card, Issues page, and right-panel per-location counts all agree.
  - Each issue's affected count ties back to the device-health breakdown (76 critical devices, 151 warning devices fleet-wide).
- KPI **delta pinned to a deterministic value** so the headline doesn't show a nonsense jump.

## 6. Thresholds page & Rule editor

- New **Thresholds page**: "Default thresholds" + "Custom rules", with save-gated state (Saving… → "Changes have been applied" / "Using defaults"), per-metric reset, "Set to defaults", and a page subtitle.
- **Rule editor side panel**: dual-thumb range slider, **region × metric conflict model** (a region+metric pair lives in one rule, but a region can span rules across different metrics), scope/metric pickers that disable already-claimed combinations, required Name / Apply-to / Threshold fields, and **toasts** on save/delete.
- "**Lower is better / Higher is better**" labelling; responsive **numeric-field fallback** below small breakpoints.
- Slider bands use the **status tokens** (solid), matching the dots.

## 7. Device drilldown (right drawer)

- **Per-card status badges** (Warning / Critical) so you can see which part of the device has issues (replaced the old "Flagged" treatment).
- Full-word slider labels; **contextual tab opening** (opens the relevant tab for the event); **staleness banner**; **←/→ tab navigation** and **↑/↓ user navigation**.
- CNS health metric shown on the **0–100 scale** with warn/crit thresholds.

## 8. Devices table

- Search placeholder updated to **"Search user, machine or event"**.
- **Status filter is now multi-select** (Critical / Warning / Healthy / Offline with status dots), replacing the radio behaviour.
- **"Issues only" is a preset chip**, visually separated from the precise filters by a divider; both read/write one `statuses` array.
- **"View devices" opens with Issues only off** when the target scope has healthy devices — so you see the full list instead of a filtered/empty one (direct sidebar navigation keeps the Issues-only triage default).

## 9. Issues page

- Location dropdown **grouped by country** with country labels.

## 10. Routing & shareable URLs

- **Shareable per-page URLs** with a `vercel.json` SPA fallback.
- **Drilldowns deep-link as query params** (`?device=…`, `?issue=…`) layered on the current page: push on open so **Back closes the drawer**, replace on in-drawer prev/next, and full **deep-link reconstruction** on refresh / back-forward.

## 11. Design system & components

- New **Switch** component with a clearly visible off state (border + track).
- New **Toast** component (`toast()` + `<Toaster/>`).
- **Popover** hardened: merges caller `style`, raised z-index, and can portal into a dialog to escape the focus trap.
- Sliders and segmented bars use the **status tokens** (success/warning/critical), matching the dots.
- **Filter chip conformed to the Figma spec**: outline (transparent) when unselected, neutral soft-fill + auto tick when selected (not brand-blue), 32px height.
- **Badge / Chip applied correctly**: a misused static Chip → Badge, and ad-hoc severity/status "pills" replaced with the real `Badge` component across the Issues table, the Issue and Device drawers, the Platforms tab, and Thresholds (severity now reads sentence-case, consistent app-wide).

---

*Build verified green (`npm run build`) after each change. No commits were made — changes are working-tree only.*
