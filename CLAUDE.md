# Working in ir-prototypes

## Naming — read this first

The product is **Clarion**. It was called **Clarity** until September 2026, when a trademark
check forced the rename. Never create a file, folder, branch, asset, variable, package name, id,
class, title or string named `clarity` / `Clarity` / `CLARITY`. Use **Clarion** everywhere.

## Where this repo lives

`IR Design/Projects/ir-prototypes`, beside the product folders (`Projects/Clarion`, …) and `Projects/picasso`.
The consoles serve every product, so this repo never goes inside a product folder. Product docs, research and
assets stay in `Projects/<Product>/`; runnable code comes here. See README "Folder setup" and "Adding a new product".

## Repo rules

- Monorepo: npm workspaces + Turborepo. Install at the root only (`npm install`), never inside an app.
- `packages/picasso` (`@ir/ui`) is **generated** by `npm run sync:picasso`. Never hand-edit it; fix
  things in the Picasso repo and re-sync. Picasso is switched on per shell with `<html data-picasso>`.
- `packages/mock-data` is the one dummy tenant. Don't fork its people, groups or locations into an
  app; import from `@ir/mock-data/*` and extend it there.
- `packages/telemetry` is the contract between the widget and the dashboard: the demo agents, the feed,
  and `mapping.ts` (widget state → dashboard endpoint). Change behaviour there, not in either app.
- The Clarion widget (`apps/clarion-widget`) is served by Clarion at `/widget` (same origin = shared feed). Keep its asset paths relative
  to `import.meta.env.BASE_URL`, never `/…`.
- Each app is its own Vercel project. Cross-app links use `src/lib/apps.ts` (`VITE_*_URL`), never a
  hard-coded deploy URL.
- Put work in the app it belongs to (see README "Where things go"). Apps may add their own
  `CLAUDE.md`; those apply on top of this one.
- Verify with `npm run build` at the root before calling something done.
