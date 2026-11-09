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
