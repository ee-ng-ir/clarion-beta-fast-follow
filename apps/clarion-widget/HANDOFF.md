# Clarion widget — developer handoff

A working prototype of the Clarion end-user widget (the contact-centre agent tray app that answers "is it me or the platform?"). This is real, runnable code — not a throwaway mockup.

## Stack

React 19 · Vite · TypeScript · Tailwind v4 · [Motion](https://motion.dev) (icon animation) · lucide-react (icons)

## Run it

```bash
npm install
npm run dev      # local dev server (Vite) — open the printed URL
npm run build    # type-check (tsc) + production build to /dist
```

## Where things live

- `src/pages/DemoPage.tsx` — the demo harness: a fake desktop + Windows taskbar + system tray, the "Simulate issue" control (grouped tabs + WHEN/WHAT explainer), and the right-click **Exit Clarion** tray menu. Renders the real widget inside.
- `src/pages/AnchoredPanel.tsx` — the widget itself (Versions C/D/E): collapsed icon rail → one-page scrolling content, the state **banner** (CLARION + tagline + window controls + status badge), and the "reconnecting" staleness pill.

### Window model — two views, hybrid tray + taskbar

Full spec: `Clarion/clarion-window-behaviour.md`. Clarion has **two views**, each with a home:

- **Sidebar (rail only) ↔ system tray.** Tray icon toggles it; click-away → tray.
- **Expanded (rail + content) ↔ taskbar.** Taskbar icon toggles it; click-away → taskbar. The taskbar button exists only while expanded is open or minimised.

Switch views with the **rail's nav icons** (click a category to expand to it; click the active one to collapse back). In the expanded banner, **– → taskbar**, **× → tray**. Right-click tray → **Exit** quits.

State lives in `DemoPage` (`open` = mounted, `expanded` = sidebar vs expanded, `minimized`, `pinned`, `exited`); the widget's expanded state is **controlled** (`AnchoredPanel` `expanded` / `onExpandedChange`, threaded via `AppShell`). Transitions are the `toTray` / `toTaskbar` / `showSidebar` / `showExpanded` helpers.

**Pinning** (opt-in, off by default) changes only automatic behaviour — it suppresses click-away (and conceptually keeps it on top). Pinned: the sidebar stays put on click-away; the expanded view collapses back to the strip instead of minimising. Deliberate –, ×, tray/taskbar clicks are unchanged, and pin persists. The toggle is a `PinToggle` in the rail footer (below the categories, above the IR logo) — an outline Lucide pin whose active state is the **filled brand button background** — and a checkable "Pin widget on top" item in the tray menu.
- `src/pages/SectionPage.tsx` / `PlatformPage.tsx` — the device / network / system / platform tile lists (with loading **skeletons** while syncing).
- `src/components/app/` — `AppShell` (routing + version switch) and `Sidebar` (the rail).
- `src/components/widget/` — `StatusBadge` (the readiness badge), `ClarionMark` (the "C" logo), `FixCard` (the inline issue alert, matches DS Alert `79:8042`).
- `src/components/ui/skeleton.tsx` — loading skeleton (shimmer by default).
- `src/components/icons/` — animated icons. `MotionIcon.tsx` wraps any lucide-react icon in a shared **"press"** micro-interaction with a `startAnimation()/stopAnimation()` handle; `index.ts` maps each component/nav item to its icon.
- `src/data/widget.ts` — **single source of truth** for the status model: the `Status` union, all demo `scenarios`, and per-component readings. Change a reading here and every surface updates.
- `src/styles/tokens.css` — design tokens, mirrored from the Figma design system (`primitives.json` + `semantic.json`). Status colours come from here — don't hardcode hex.

## Versions (hash routes)

`#/demo` (A, full app) · `/demo/b` (single panel) · `/demo/c` · `/demo/d` · `/demo/e` (final: flat header + readiness badge)

## Notes

- Design tokens are the contract with the Figma DS (`status.healthy → success.600`, etc.). Keep `tokens.css` in sync with the exported token JSON.
- Icons: `motion` + `lucide-react` are the only icon deps. The animation is one shared "press"; swap the `PRESS` variant in `MotionIcon.tsx` to change it globally.
