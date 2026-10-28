# Clarion Widget

The **end-user** companion to the Clarion Fleet dashboard — a self-service
device-health app for contact-centre agents. Where the Fleet view (`Clarion-prototype`)
is the admin/IT lens over thousands of endpoints, this is the single agent's
view of *their own* machine: "am I ready for calls?", surfaced from the same
telemetry and tied back to the Fleet's issues and IT tickets.

## Architecture

A windowed app launched from a system-tray shield, built as an **app shell**
with a **collapsible left rail**. Telemetry is split into focused sections —
Overview · Devices · Network · Platform · Activity — so no single pane becomes
a long, cluttered scroll. Pattern reference: self-service DEX widgets
(Nexthink Employee Self-Service, ControlUp self-service portal).

## Stack

Identical to `Clarion-prototype`, so the two stay visually consistent:

- React 19 + Vite + TypeScript
- Tailwind v4 (`@tailwindcss/vite`)
- `@ir/tokens` semantic design tokens (`src/styles/tokens.css`, bridged in `src/index.css`)
- shadcn-style primitives (`src/components/ui`)

## Develop

```bash
npm install
npm run dev      # start the dev server
npm run build    # typecheck + production build
```

## Layout

```
src/
  App.tsx                    # shell wiring: rail + topbar + page switch
  nav.ts                     # section definitions
  components/app/Sidebar.tsx # collapsible left rail (labels ↔ icon strip)
  components/app/Topbar.tsx  # page title, theme, minimise-to-tray
  pages/                     # Overview + section panes (shell placeholders)
```
