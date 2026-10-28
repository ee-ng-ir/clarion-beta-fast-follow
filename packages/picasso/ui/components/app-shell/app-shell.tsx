// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../../lib/utils";

/**
 * AppShell — Figma's App shell page, `Layout / App shell` 40000390:30130.
 *
 * Ten variants across Screen × Sidebar, but only one of those axes survives
 * the trip into code. Screen (md 768, lg 1024, xl 1280, wide-laptop 1440, 2xl 1536)
 * is Figma drawing breakpoints the only way it can — as variants — and the
 * browser does that itself. Strip it out and the ten collapse to two
 * structures, which the Sidebar's own collapsed state already carries. So
 * AppShell has no variants at all: it is chrome, and the chrome is fixed.
 *
 * What the Screen axis actually says, once decoded: the page padding and the
 * top bar's inline padding are 16 below xl, and 24 from xl (1280) up. Nothing
 * else moves. Widths, gaps and the 48 top bar are the same at every size.
 *
 * The padding steps at 1280 — `xl:` in the tokens, in Tailwind and in this
 * file, all the same number. That used to need a paragraph: IR's ladder was
 * Tailwind's shifted up a step, so "lg and above" in the Rules meant 1280
 * and `lg:p-6` in a class meant 1024. The scales are aligned now
 * (@ir/tokens theme.css), and `screen/desktop/*` is the source of both.
 *
 * Figma's `Screen` labels were renamed to this ladder on 1 Oct (md 768,
 * lg 1024, xl 1280, wide-laptop 1440, 2xl 1536) and each variant's width is bound
 * to the `screen/desktop/*` variable of the same name.
 *
 * This component is also why three tokens moved. bg/app, bg/sidebar and
 * border/neutral/subtle were all palette-neutral-900 in dark, so the
 * sidebar, the page and every edge between them were one colour — no rail,
 * no top bar rule, nothing. bg/sidebar is neutral-950 in dark now, one step
 * recessed from the page exactly as it is in light, and subtle is retired
 * into muted.
 *
 * Measured from the file: sidebar 256 expanded / 48 collapsed, top bar 48
 * high with 8 gap, content padding 16 / 24, no gap anywhere else. Overlay
 * widths live with Dialog and Drawer and already match the Rules — dialog
 * sm 400 / md 560 / lg 720, drawer 480 / 640 / inset 80×40.
 */
export function AppShell({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-shell"
      // h-full rather than h-svh: a shell that claims the viewport cannot be
      // put in a story, a split view or a preview pane without a class
      // fighting it. The page decides how tall the shell is.
      className={cn(
        "flex h-full w-full overflow-hidden bg-surface-app",
        className,
      )}
      {...props}
    />
  );
}

/**
 * The column beside the rail — Figma's `Main`, which holds the top bar and
 * the content.
 *
 * A plain div, not a `<main>`. Figma's "Main" frame contains the top bar,
 * and a top bar is chrome rather than page content: put `<main>` around it
 * and the breadcrumb and the sidebar toggle become part of the document's
 * main landmark, and the `<header>` inside it stops being a banner — a
 * `<header>` only carries that role when it is not inside main, aside, nav,
 * section or article. So the landmarks go where HTML wants them: this column
 * is a div, `AppShellHeader` is the banner, and `AppShellContent` is the
 * `<main>`. Same boxes as the file, the roles the browser expects.
 */
export function AppShellMain({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="app-shell-main"
      className={cn("flex min-h-0 min-w-0 flex-1 flex-col", className)}
      {...props}
    />
  );
}

/**
 * The top bar: the sidebar toggle and the breadcrumb, and nothing else.
 *
 * The Rules are explicit that the page title and page actions belong in the
 * page header inside the content area. A 48-high bar that also carries a
 * title, a search and three buttons is how every app shell ends up, and it
 * is why the breadcrumb stops being readable.
 */
export function AppShellHeader({
  className,
  ...props
}: React.ComponentProps<"header">) {
  return (
    <header
      data-slot="app-shell-header"
      className={cn(
        "flex h-12 shrink-0 items-center gap-2 border-b " +
          "border-line-neutral-muted px-gutter",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Content width — three modes, set per page. The cap sits on the column,
 * inside the page padding, and the column stays left-aligned to the rail in
 * every mode, so the start of the page heading does not move when a page
 * switches between fluid and capped.
 *
 * | mode       | max width | for                              |
 * |------------|-----------|----------------------------------|
 * | `fluid`    | none      | dashboards, tables, log viewer   |
 * | `standard` | 1280      | detail, settings, mixed pages    |
 * | `reading`  | 768       | forms and prose                  |
 *
 * `standard` only bites above a 1584 viewport (1280 + 256 rail + 48
 * padding), so it is a wide-screen rule. The numbers are `size/content/*`.
 */
const appShellContentColumnVariants = cva(
  // The column is the query container, so `@3xl:` and friends inside a page
  // answer to the content width — the rail, the padding and the cap already
  // taken off — not to the viewport. Viewport breakpoints are the shell's.
  "@container",
  {
    variants: {
      width: {
        fluid: "",
        standard: "max-w-content-standard",
        reading: "max-w-content-reading",
      },
    },
    defaultVariants: { width: "fluid" },
  },
);

export interface AppShellContentProps
  extends
    React.ComponentProps<"main">,
    VariantProps<typeof appShellContentColumnVariants> {}

/**
 * The scrolling page area, and the document's `<main>`.
 *
 * Padding is `p-gutter`: 16 below xl and 24 from xl (1280) up, from
 * `--page-gutter` in @ir/tokens' theme.css. The Rules make the grid gap equal
 * to the page padding, so a dashboard grid writes `gap-gutter` and follows
 * the shell without a viewport breakpoint of its own.
 */
export function AppShellContent({
  className,
  width,
  children,
  ...props
}: AppShellContentProps) {
  return (
    <main
      data-slot="app-shell-content"
      data-width={width ?? "fluid"}
      className={cn("min-h-0 flex-1 overflow-y-auto p-gutter", className)}
      {...props}
    >
      <div
        data-slot="app-shell-content-column"
        className={cn(appShellContentColumnVariants({ width }))}
      >
        {children}
      </div>
    </main>
  );
}

export { appShellContentColumnVariants };
