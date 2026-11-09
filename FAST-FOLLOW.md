# Clarion Beta — Fast Follow demo

This repo is a **demo**, not the product. It shows the Fast Follow features that sales can
promise to clients going to market, designed in Clarion and Picasso, so Product and R&D can
refine them before implementation.

It started as a copy of [`ir-prototypes`](https://github.com/ee-ng-ir/ir-prototypes) (with
history) on 9 Nov 2026. Everything in that repo's `CLAUDE.md` still applies here.

## What's in scope

| Area | Source epic | Fleet dashboard | Widget |
| --- | --- | --- | --- |
| Alerts | Smarter and actionable alerts | Alerts (groups), Top issues, alert settings, notifications, energy saver | Anti-flapping, energy saver cause |
| Evidence + Iris | Diagnosis, evidence and enabling RCA | Alert detail evidence, likely causes, Investigate with Iris | — |
| Dashboards | Clarion Dashboards & Reporting | Device inventory, Most common alerts, Alert trends | — |
| Approved headsets | Approved headset list and compliance | Approved list, compliance filter and column | Advisory headset note |

Open design questions live in the shared doc "Clarion Fast Follow — design questions log".

## Rules for this repo

- **Picasso or it isn't done.** Fast Follow UI is built from `@ir/ui` (Picasso) and its
  conventions: Picasso components first, then compositions of them; semantic utilities only
  (`bg-surface-*`, `text-content-*`, `border-line-*`, `text-heading-*`/`label-*`/`body-*`/`metric-*`);
  no inline styles, `var()` or arbitrary values; content responds to its container (`@`-variants),
  only the shell to the viewport; charts are Picasso's (no chart library). Picasso is switched on
  for the whole demo with `<html data-picasso>`. Where Picasso lacks something, log it as a
  Picasso gap rather than building beside it.
- Keep Picasso current with `npm run sync:picasso` (reads `../picasso`) and commit `packages/picasso`.
- Every Fast Follow screen shows the **Fast Follow preview** marker. Anything still TBC also
  carries an **Exploring** tag. Sales will read anything on screen as a promise.
- Put new code in new files (e.g. `src/features/fast-follow/`) and keep edits to existing
  files small, so pulling from `ir-prototypes` stays easy.
- Demo data extends `packages/mock-data` and `packages/telemetry`, same as upstream.

## Remotes

- `origin` → `ee-ng-ir/clarion-beta-fast-follow` (this demo)
- `upstream` → `ee-ng-ir/ir-prototypes` (the main prototypes)

Pull upstream changes (Picasso syncs, RBAC work) with:

```
git fetch upstream
git merge upstream/main
```

## Deploy

One Vercel project for `apps/clarion` (it serves the widget at `/widget`), using the same
`vercel.json` as upstream.
