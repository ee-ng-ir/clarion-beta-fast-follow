# Clarion — component rules

> Terminology note: **Issue** = persistent problem record (feature), **Alert** =
> real-time bell notification, **Symptom** = per-endpoint condition. Full
> definitions live in the in-app Glossary / Issues-model pages.

How shadcn components and dashboard elements bind to the Clarion semantic
tokens (`@ir/tokens`). The bridge lives in `src/index.css` (`@theme inline`),
which aliases shadcn's variable names to the Clarion semantic layer, so the
stock shadcn class names resolve to Clarion values automatically.

## Golden rules

1. **Never use a hex value or a `--palette-*` primitive in a component.**
   Always reference a semantic token (`--bg-*`, `--fg-*`, `--border-*`,
   `--status-*`, `--chart-*`, `--shadow-*`, `--ring-*`) or a Tailwind utility
   that resolves to one.
2. **Surfaces** read from `--bg-*`, **text** from `--fg-*`, **lines** from
   `--border-*`. Don't cross the streams (e.g. never paint a border with a `bg`
   token).
3. **Interactive states** use the matching `-hovered` / `-pressed` token, not an
   opacity hack — e.g. `bg-primary` → hover `--bg-primary-emphasis-hovered`.
4. **Typography** uses the composite classes from `tokens.css`
   (`.text-heading-sm`, `.text-metric-xl`, `.text-body-sm`, `.text-label-sm`,
   …). These carry family + size + weight + leading + tracking together.
5. **Dark mode** is automatic: toggling `.dark` on `<html>` re-points every
   semantic token. Components never branch on theme.

## shadcn alias → Clarion token (set in `index.css`)

| shadcn variable        | Clarion semantic token            |
|------------------------|-----------------------------------|
| `background`           | `--bg-app`                        |
| `foreground`           | `--fg-neutral-emphasis`           |
| `card`                 | `--bg-card`                       |
| `popover`              | `--bg-overlay`                    |
| `primary`              | `--bg-primary-emphasis`           |
| `primary-foreground`   | `--fg-on-primary-emphasis`        |
| `secondary`            | `--bg-neutral-subtle`             |
| `muted` / `-foreground`| `--bg-neutral-subtle` / `--fg-neutral-muted` |
| `accent`               | `--bg-neutral-subtle-hovered`     |
| `destructive`          | `--bg-danger-emphasis`            |
| `border`               | `--border-neutral-muted`          |
| `input`                | `--border-input-default`          |
| `ring`                 | `--border-focused`                |
| `chart-1..8`           | `--chart-1..8`                    |

## Component rules

| Component | Surface | Text | Border | Notes |
|-----------|---------|------|--------|-------|
| **Button / default** | `--bg-primary-emphasis` | `--fg-on-primary-emphasis` | — | hover/active → `-hovered`/`-pressed` |
| **Button / outline** | `--bg-card` | `--fg-neutral-emphasis` | `--border-neutral-emphasis` | hover → `--bg-neutral-subtle-hovered` |
| **Button / ghost** | transparent | `--fg-neutral-emphasis` | — | used for "View endpoints" |
| **Button / link** | — | `--fg-link-default` | — | hover → `--fg-link-hovered` |
| **Card** | `--bg-card` | `--fg-neutral-emphasis` | `--border-neutral-muted` | radius `rounded-xl`, `--shadow-xs` |
| **Input / search** | `--bg-input-default` | `--fg-neutral-emphasis` | `--border-input-default` | focus → `--border-input-focused` + `ring` |
| **Badge / secondary** | `--bg-neutral-subtle` | `--fg-neutral-emphasis` | `--border-neutral-muted` | pill = `rounded-full` |
| **Badge / status** | `--bg-{role}-subtle` | `--fg-on-{role}-subtle` | `--border-{role}-muted` | success/warning/danger/info |
| **Table row** | `--bg-card` | `--fg-neutral-emphasis` | `--border-neutral-subtle` | hover `--bg-neutral-subtle-hovered`, selected `--bg-selected-subtle` |
| **Separator** | `--border-neutral-muted` | — | — | |
| **Tooltip / menu** | `--bg-neutral-emphasis` / `--bg-overlay` | `--fg-on-neutral-emphasis` | `--border-neutral-muted` | `--shadow-md` |

## Dashboard-specific elements

- **Sidebar** — `--bg-sidebar`; group label & nav text `--fg-neutral-emphasis`;
  the active nav item uses `--bg-selected-subtle` + a `--border-focused` left
  accent; workspace icon tile `--bg-neutral-emphasis` / `--fg-on-neutral-emphasis`.
- **KPI card** — title `.text-heading-sm` on `--fg-neutral-emphasis`; metric
  `.text-metric-xl` (JetBrains Mono); top-right icon `--fg-neutral-subtle`.
- **Status dot** — fill from `--status-{healthy|warning|critical|info|unknown}`.
  Endpoint statuses map: healthy/warning/critical → matching status tokens;
  **offline → `--status-unknown`** (neutral grey). `1px` ring in `--bg-card`, `--shadow-xs`.
- **Segmented bar** — equal flex segments filled with `--status-healthy`,
  `--status-warning`, `--status-critical`.
- **Legend** — dot = status token, label `.text-body-xs` on `--fg-neutral-emphasis`
  (muted variant `--fg-neutral-subtle`).
- **Location row** — name `.text-body-sm` `--fg-neutral-emphasis`; counts in
  `font-mono` `--fg-neutral-muted`; selected row `--bg-neutral-subtle-hovered`
  with `--border-focused` left accent.
- **Charts** — series colours pull from `--chart-1..8` in order.
