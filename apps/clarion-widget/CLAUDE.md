# Widget app

- Built with `base: "/widget/"` and served by the Clarion app at `/widget`. Public asset paths must use
  `import.meta.env.BASE_URL` (e.g. `${import.meta.env.BASE_URL}call/priya.png`), never a leading `/`.
- The demo harness (`src/pages/DemoPage.tsx`) has an **agent picker**. Each agent's scenario is published to
  `@ir/telemetry`, which the Clarion dashboard applies to that agent's endpoint. Add agents in
  `packages/telemetry/src/agents.ts`.
- `src/data/widget.ts` stays the source of truth for what the widget itself shows.
