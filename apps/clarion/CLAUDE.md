# Clarion app

- The Fleet dashboard uses the prototype's own shadcn-style components (`src/components/ui`) and tokens
  (`src/styles/tokens.css`). Picasso (`@ir/ui`) is available but scoped to `<html data-picasso>`.
- Nothing admin lives here any more. Admin links go to the client console via `src/lib/apps.ts`.
