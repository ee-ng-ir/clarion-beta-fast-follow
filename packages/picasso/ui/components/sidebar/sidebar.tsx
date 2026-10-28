// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { PanelLeft, PanelLeftClose } from "lucide-react";
import { cn } from "../../lib/utils";
import { overlayScrimVariants } from "../overlay/overlay";

/**
 * Sidebar — Figma's Sidebar menu page, thirteen sets over one navigation
 * tree. `Sidebar / SidebarMenuButton` 1137:443 is the centre of it.
 *
 * That button set has 56 variants across Type × State × Collapsed, and the
 * Type axis is mostly presence again: Simple, Collapsible, Dropdown, Tree,
 * Badge and Checkbox are all 216×32 with the same padding and gap, differing
 * only in which children they hold — an icon, a chevron, a badge, a
 * checkbox. Only `Big Icon` is a different size, so that is the one thing
 * that became a prop (`size="lg"`). The rest is composition.
 *
 * ⭐ State is carried by weight as well as fill. Active is bg/primary/subtle
 * *and* label/lg where every other state is body/md — 500 against 400. That
 * matters: on a sidebar where several items share a muted fill, the weight
 * is what survives. Worth keeping when anyone reaches for "just the
 * background".
 *
 * Measured: button 32 tall at radius/md, 8 padding, 8 gap; sub-item 28 tall
 * at 0/8; group padding 8; group label label/sm at xs and 32 tall; the
 * collapsed rail is a 32 square. Focused is bg/sidebar with a
 * border/primary/emphasis edge and ring/focus.
 *
 * ⭐ Hover is bg/sidebar-hovered and pressed is bg/sidebar-pressed — the
 * rail's own pair, not bg/neutral/subtle-hovered. The rail is neutral-100
 * in light, which is exactly what subtle-hovered resolves to, so the
 * standard hover painted the rail's own colour and nothing moved. The sidebar pair is one step past the rail in
 * both themes: 200 then 300 in light, 900 then 800 in dark. Anything that
 * sits on bg/sidebar takes this pair. Figma draws subtle-hovered; this is a
 * correction under rule 2 (a hover that equals its surface cannot render).
 *
 * ⚠️ On `SidebarMenuSubItem`, Hover and Active are the same fill —
 * bg/sidebar-hovered — so a selected sub-item is indistinguishable
 * from one the pointer happens to be over. The parent button does not have
 * this problem: its Active is bg/primary/subtle. Built as drawn, and raised.
 */
// 256 expanded and 48 collapsed. ⚠️ This was 248, and 248 was my mistake:
// the Sidebar page draws SidebarGroup at 248, and the group is the rail's
// *contents*, not the rail. App shell draws the rail itself — 256 wide with
// 4 of padding, which is exactly the 248 group inside it — and the Rules
// name the token: "Expanded is 256px (space/64); collapsed is 48px
// (space/12)." So the rail is 256 and always was.
//
// The collapsed arithmetic does not close the same way: App shell wraps a
// 48 rail around 4 of padding, which leaves 40 for a group whose button is
// 32 inside 8 of padding — 48. The rail is the number the Rules state, so
// the rail is 48 and the padding is the group's, not the shell's.
const SIDEBAR_WIDTH = "w-64";
const SIDEBAR_WIDTH_COLLAPSED = "w-12";

interface SidebarContextValue {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  /** Below md, with a `mobile="drawer"` Sidebar mounted. */
  phone: boolean;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
  registerMobile: (on: boolean) => void;
  /** True for parts rendered inside the full-screen phone nav. */
  inMobile: boolean;
  /* The brand decides its own ink from its artwork, and the header draws the
     phone nav's close on top of it — so the header has to be told. Null when
     there is no SidebarBrand, which is the case the close has to survive: a
     header with no brand still needs a way out. */
  brandInk: "on-dark" | "on-light" | null;
  registerBrandInk: (ink: "on-dark" | "on-light" | null) => void;
}

/* Registering in a layout effect, not an effect: the header paints the close
   in the same frame the brand mounts, so there is no flash of the wrong ink.
   Falls back to useEffect where there is no DOM, which is the only place
   useLayoutEffect warns. */
const useIsoLayoutEffect =
  typeof window !== "undefined" ? React.useLayoutEffect : React.useEffect;

/* md is 768 in the tokens and in Tailwind; below it is a phone. */
const PHONE_QUERY = "(max-width: 767.98px)";
function usePhone() {
  const [phone, setPhone] = React.useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia?.(PHONE_QUERY).matches === true,
  );
  React.useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia(PHONE_QUERY);
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener?.("change", on);
    return () => mq.removeEventListener?.("change", on);
  }, []);
  return phone;
}
const SidebarContext = React.createContext<SidebarContextValue | null>(null);

function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx)
    throw new Error("Sidebar parts must be used inside <SidebarProvider>.");
  return ctx;
}

export interface SidebarProviderProps extends React.ComponentProps<"div"> {
  collapsed?: boolean;
  defaultCollapsed?: boolean;
  onCollapsedChange?: (collapsed: boolean) => void;
  /** The phone nav drawer's open state (Sidebar `mobile="drawer"`). */
  mobileOpen?: boolean;
  onMobileOpenChange?: (open: boolean) => void;
}

export function SidebarProvider({
  className,
  collapsed,
  defaultCollapsed = false,
  onCollapsedChange,
  mobileOpen: mobileOpenProp,
  onMobileOpenChange,
  ...props
}: SidebarProviderProps) {
  const [uncontrolled, setUncontrolled] = React.useState(defaultCollapsed);
  const [mobileUncontrolled, setMobileUncontrolled] = React.useState(false);
  const [hasMobile, setHasMobile] = React.useState(false);
  const isPhone = usePhone();
  const mobileOpen = mobileOpenProp ?? mobileUncontrolled;
  const setMobileOpen = React.useCallback(
    (next: boolean) => {
      if (mobileOpenProp === undefined) setMobileUncontrolled(next);
      onMobileOpenChange?.(next);
    },
    [mobileOpenProp, onMobileOpenChange],
  );
  const isControlled = collapsed !== undefined;
  const value = isControlled ? collapsed : uncontrolled;

  const setCollapsed = React.useCallback(
    (next: boolean) => {
      if (!isControlled) setUncontrolled(next);
      onCollapsedChange?.(next);
    },
    [isControlled, onCollapsedChange],
  );

  const phone = isPhone && hasMobile;
  /* Crossing back up to md closes the phone nav, so it never reopens as a
     stale overlay.
     ⚠️ The guard is `hasMobile && !isPhone`, not `!phone`. `hasMobile` is set
     by an effect in the Sidebar child, which runs AFTER this one on the first
     pass — so `phone` is false on mount even on a phone, and `!phone` would
     close a nav that a product opened on mount before anyone saw it. Waiting
     for `hasMobile` means the guard only fires once there is something to
     guard. */
  React.useEffect(() => {
    if (hasMobile && !isPhone && mobileOpen) setMobileOpen(false);
  }, [hasMobile, isPhone, mobileOpen, setMobileOpen]);
  const [brandInk, setBrandInk] = React.useState<"on-dark" | "on-light" | null>(
    null,
  );
  const ctx = React.useMemo<SidebarContextValue>(
    () => ({
      collapsed: value,
      setCollapsed,
      phone,
      mobileOpen,
      setMobileOpen,
      registerMobile: setHasMobile,
      inMobile: false,
      brandInk,
      registerBrandInk: setBrandInk,
    }),
    [value, setCollapsed, phone, mobileOpen, setMobileOpen, brandInk],
  );

  return (
    <SidebarContext.Provider value={ctx}>
      {/* Fills whatever it is given rather than claiming the viewport: a
          component that hardcodes min-h-svh cannot be put in a panel, a
          story or a split view without a class fighting it. */}
      <div
        data-slot="sidebar-provider"
        className={cn("flex h-full w-full", className)}
        {...props}
      />
    </SidebarContext.Provider>
  );
}

export interface SidebarProps extends React.ComponentProps<"aside"> {
  /**
   * Figma: `Sidebar / Phone nav` 40000659:33057.
   * `"drawer"`: below md the rail is not drawn inline — SidebarTrigger opens
   * the same tree over the page instead, as a panel from the inline start
   * with a strip of scrim left at the end. 44-tall items, a close on the
   * brand, and picking an item closes it. From md up nothing changes.
   * Opt-in for now; see guidance `phone-nav`.
   *
   * `"fullscreen"` is the old name for the same thing, from when the panel
   * covered the whole screen. It still works.
   */
  mobile?: "drawer" | "fullscreen";
  /** Accessible name of the phone nav dialog. */
  mobileLabel?: string;
}

export function Sidebar({
  className,
  mobile,
  mobileLabel = "Navigation",
  children,
  ...props
}: SidebarProps) {
  const ctx = useSidebar();
  const { collapsed, registerMobile } = ctx;
  React.useEffect(() => {
    if (!mobile) return;
    registerMobile(true);
    return () => registerMobile(false);
  }, [mobile, registerMobile]);

  if (mobile && ctx.phone) {
    return (
      <DialogPrimitive.Root
        open={ctx.mobileOpen}
        onOpenChange={ctx.setMobileOpen}
      >
        <DialogPrimitive.Portal>
          {/* The strip of scrim at the end is the way out that needs no
              instruction: it shows there is a page behind, and tapping it
              closes. A panel that covers the whole screen reads as a new
              place rather than something over the page, and leaves Escape —
              a key a phone does not have — as the only exit. */}
          <DialogPrimitive.Overlay className={overlayScrimVariants()} />
          <DialogPrimitive.Content
            data-slot="sidebar-mobile"
            aria-describedby={undefined}
            className={cn(
              "fixed inset-y-0 start-0 end-14 z-modal flex outline-none",
              /* The same travel as a Drawer on the start side — it is the
                 same gesture, so it reads as one thing in the system. The
                 scrim behind it already fades. --direction-sign signs the
                 travel, so in RTL it comes from the other edge. */
              "data-[state=open]:animate-drawer-in-start",
              "data-[state=closed]:animate-drawer-out-start",
            )}
          >
            <DialogPrimitive.Title className="sr-only">
              {mobileLabel}
            </DialogPrimitive.Title>
            {/* The same tree, expanded and touch-sized. */}
            <SidebarContext.Provider
              value={{ ...ctx, collapsed: false, inMobile: true }}
            >
              <aside
                data-slot="sidebar"
                data-mobile
                className={cn(
                  "flex size-full flex-col bg-surface-sidebar",
                  className,
                )}
                {...props}
              >
                {children}
              </aside>
            </SidebarContext.Provider>
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>
    );
  }

  return (
    <aside
      data-slot="sidebar"
      data-collapsed={collapsed || undefined}
      className={cn(
        // No width transition, on purpose. Width is a layout property: the
        // page beside the rail would re-lay out on every frame, and that
        // page is charts and tables someone is reading. Picasso animates
        // `transform` and `opacity` only (docs/foundations/motion.md), and
        // there is no transform that makes a rail narrower.
        // The right edge is drawn in Figma as border/neutral/subtle, which
        // was invisible in both themes — it was neutral-100 in light, the
        // same as bg/sidebar, and neutral-900 in dark, the same as both
        // bg/sidebar and bg/app. subtle has since been retired into muted
        // (there is no room on the ramp for a border below muted that is
        // not also a surface), so the edge reads in both themes now.
        "flex shrink-0 flex-col border-e border-line-neutral-muted " +
          "bg-surface-sidebar",
        collapsed ? SIDEBAR_WIDTH_COLLAPSED : SIDEBAR_WIDTH,
        className,
      )}
      {...props}
    >
      {children}
    </aside>
  );
}

const sidebarHeaderVariants = cva("flex flex-col", {
  variants: {
    // `brand` exists for one reason: the brand block in Clarion and Iris runs
    // edge to edge and hard against the top, and padding is what stops it. A
    // product cannot cancel that padding from outside — no-restyle refuses the
    // class — so the header has to offer the shape itself.
    variant: { default: "gap-2 p-2", brand: "gap-0 p-0" },
  },
  defaultVariants: { variant: "default" },
});

export interface SidebarHeaderProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof sidebarHeaderVariants> {}

export interface SidebarHeaderCloseProps {
  /** The name of the close shown in the phone nav. "Close", not
   *  "Collapse": SidebarTrigger collapses the rail to 48 and this dismisses
   *  an overlay, so two buttons called the same thing would do two different
   *  things. */
  closeLabel?: string;
}

export function SidebarHeader({
  className,
  variant,
  closeLabel = "Close navigation",
  children,
  ...props
}: SidebarHeaderProps & SidebarHeaderCloseProps) {
  const { inMobile, setMobileOpen, brandInk } = useSidebar();
  return (
    <div
      data-slot="sidebar-header"
      className={cn(
        sidebarHeaderVariants({ variant }),
        // relative so the close can sit on the brand, which bleeds to all
        // three edges and leaves nowhere else to put it
        inMobile && "relative",
        className,
      )}
      {...props}
    >
      {children}
      {/* The phone nav covers the page, and Escape is a keyboard key. Without
          this there is no way back out except the scrim, so the close ships
          with the header — the one part every nav has — rather than with the
          brand, which a product may not use.
          Its ink comes from the brand underneath it: white over dark artwork,
          dark over pale. With no brand there is no artwork, so it takes the
          rail's own ink. */}
      {inMobile ? (
        <button
          type="button"
          data-slot="sidebar-mobile-close"
          aria-label={closeLabel}
          onClick={() => setMobileOpen(false)}
          className={cn(
            "absolute end-2 top-2 flex size-11 cursor-pointer items-center justify-center rounded-md",
            "outline-none transition-colors focus-visible:ring-2 focus-visible:ring-line-focused",
            "[&_svg]:size-5",
            brandInk === "on-dark" &&
              "text-content-on-primary-emphasis hover:bg-surface-layer-on-emphasis-subtle",
            brandInk !== "on-dark" &&
              "text-content-neutral-emphasis hover:bg-surface-neutral-subtle-hovered",
          )}
        >
          <PanelLeftClose aria-hidden className="rtl-mirror" />
        </button>
      ) : null}
    </div>
  );
}
/**
 * The brand — the product's identity at the top of the rail.
 *
 * Put it inside `<SidebarHeader variant="brand">`. 80 tall, bleeding to all
 * three edges, with the wordmark as children so each product brings its own:
 * Iris sets one word, Clarion sets a lockup over "powered by Iris".
 *
 * ⭐ Without an `image` it paints the rail's own surface, so a brand that has
 * not had brand artwork drawn yet reads as a quiet header rather than an empty
 * coloured box. The image is the normal path, not the exception — a new brand
 * supplies one asset and the block is done.
 *
 * ⚠️ Nothing can measure the contrast of a bitmap. On a token surface
 * `fg/on/*` is solved for us; over an `image` there is no value to solve
 * against, so the block lays a scrim under the text instead and the artwork
 * stops deciding whether the wordmark reads. What is left for the product is
 * the polarity: `ink="on-light"` for a pale asset, which also turns the
 * scrim pale.
 */
const sidebarBrandVariants = cva(
  "relative isolate flex h-20 shrink-0 flex-col justify-center overflow-hidden px-5",
  {
    variants: {
      ink: {
        "on-dark": "text-content-on-primary-emphasis",
        "on-light": "text-content-neutral-emphasis",
      },
    },
    defaultVariants: { ink: "on-dark" },
  },
);

export interface SidebarBrandProps
  extends
    React.ComponentProps<"div">,
    VariantProps<typeof sidebarBrandVariants> {
  /** The brand artwork. Covers the block; decorative, so it carries no name. */
  image?: string;
  /** A second line under the wordmark — Clarion's "powered by Iris". */
  subtitle?: React.ReactNode;
  /** Shown instead of the wordmark when the rail is collapsed to 48. */
  mark?: React.ReactNode;
}

export function SidebarBrand({
  className,
  ink,
  image,
  subtitle,
  mark,
  children,
  ...props
}: SidebarBrandProps) {
  const { collapsed, registerBrandInk } = useSidebar();
  /* The header draws the close on top of this, so it has to know whether the
     brand is dark. Without artwork there is nothing to sit on
     and the ink is the rail's own. */
  const effectiveInk = image ? (ink ?? "on-dark") : "on-light";
  useIsoLayoutEffect(() => {
    registerBrandInk(effectiveInk);
    return () => registerBrandInk(null);
  }, [effectiveInk, registerBrandInk]);
  return (
    <div
      data-slot="sidebar-brand"
      data-collapsed={collapsed || undefined}
      className={cn(
        sidebarBrandVariants({ ink: effectiveInk }),
        !image && "bg-surface-sidebar",
        collapsed && "items-center px-0",
        className,
      )}
      {...props}
    >
      {image ? (
        <>
          <img
            src={image}
            alt=""
            aria-hidden
            className="absolute inset-0 -z-20 size-full object-cover object-left"
          />
          {/* The scrim is what makes an arbitrary bitmap safe to put a
              wordmark on. Everywhere else the system solves ink against a
              token and can prove the result; artwork is the one surface it
              cannot measure, so instead of trusting each brand's file it
              lays a wash under the text and stops depending on what the
              file happens to contain. It fades out across the block so the
              artwork still reads where no text sits — physically, left to
              right, like everything else in the library (see the RTL note
              in packages/tokens/theme.css).

              Strength is a fraction of `bg/scrim`, so it moves with the
              theme rather than being a number of its own. Measured on the
              Clarion and Console artwork, the worst pixel under a glyph:
              5.3:1 for the 12px second line and 5.8:1 for the wordmark,
              against 4.5:1 needed. Lighter than this and the second line
              drops under 5; heavier and the brand colour goes grey where
              the wordmark sits, which is the one part of the block a brand
              will look at. */}
          <div
            data-slot="sidebar-brand-scrim"
            aria-hidden
            className={cn(
              // Darkest under the wordmark, which sits at the inline start.
              "absolute inset-0 -z-10 bg-linear-to-r to-transparent rtl:bg-linear-to-l",
              ink === "on-light"
                ? "from-surface-app/70 via-surface-app/35"
                : "from-surface-scrim/65 via-surface-scrim/30",
            )}
          />
        </>
      ) : null}
      {collapsed ? (
        /* The same step as the wordmark, because at 48 the mark IS the
           wordmark: a letter set in anything else beside the full name reads
           as two different brands. */
        <span data-slot="sidebar-brand-wordmark" className="text-wordmark">
          {mark ?? children}
        </span>
      ) : (
        <>
          <span data-slot="sidebar-brand-wordmark" className="text-wordmark">
            {children}
          </span>
          {/* Dimmer by size and weight, never by opacity — there is no
              on-primary ink below emphasis to reach for. */}
          {subtitle ? (
            <span data-slot="sidebar-brand-subtitle" className="text-body-xs">
              {subtitle}
            </span>
          ) : null}
        </>
      )}
    </div>
  );
}

export function SidebarContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        "flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarFooter({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      className={cn("flex flex-col gap-2 p-2", className)}
      {...props}
    />
  );
}

export function SidebarGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      className={cn("flex flex-col p-2", className)}
      {...props}
    />
  );
}

/** Hidden when the rail is collapsed — there is no room for a word. */
export function SidebarGroupLabel({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const { collapsed } = useSidebar();
  if (collapsed) return null;
  return (
    <div
      data-slot="sidebar-group-label"
      className={cn(
        "flex h-8 items-center justify-between rounded-md px-2 " +
          "text-label-sm text-content-neutral-emphasis",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarGroupAction({
  className,
  ...props
}: React.ComponentProps<"button">) {
  return (
    <button
      type="button"
      data-slot="sidebar-group-action"
      className={cn(
        "flex size-5 shrink-0 cursor-pointer items-center justify-center rounded-md " +
          "text-content-neutral-muted outline-none transition-colors " +
          "hover:bg-surface-sidebar-hovered active:bg-surface-sidebar-pressed " +
          "focus-visible:ring-2 focus-visible:ring-line-focused " +
          "[&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export function SidebarMenu({
  className,
  ...props
}: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      className={cn("flex w-full flex-col gap-1", className)}
      {...props}
    />
  );
}

export function SidebarMenuItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      className={cn("relative flex flex-col", className)}
      {...props}
    />
  );
}

const sidebarMenuButtonVariants = cva(
  "group/menu-button flex w-full cursor-pointer items-center gap-2 rounded-md p-2 " +
    "text-start text-content-neutral-emphasis outline-none transition-colors " +
    "hover:bg-surface-sidebar-hovered active:bg-surface-sidebar-pressed " +
    "focus-visible:border-line-primary-emphasis focus-visible:bg-surface-sidebar " +
    "focus-visible:ring-2 focus-visible:ring-line-focused " +
    "disabled:pointer-events-none disabled:text-content-disabled " +
    "[&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      // Active is a weight change as well as a fill — see the note above.
      active: {
        true: "bg-surface-primary-subtle text-label-lg",
        false: "text-body-md",
      },
      size: { default: "h-8", lg: "h-12" },
    },
    defaultVariants: { active: false, size: "default" },
  },
);

export interface SidebarMenuButtonProps
  extends
    React.ComponentProps<"button">,
    VariantProps<typeof sidebarMenuButtonVariants> {
  asChild?: boolean;
  /** Marks the current page. Sets `aria-current` as well as the treatment. */
  active?: boolean;
}

export function SidebarMenuButton({
  className,
  asChild,
  active = false,
  size,
  onClick,
  ...props
}: SidebarMenuButtonProps) {
  const { collapsed, inMobile, setMobileOpen } = useSidebar();
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="sidebar-menu-button"
      data-active={active || undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        sidebarMenuButtonVariants({ active, size }),
        // The collapsed rail is a 32 square with only the icon in it.
        collapsed && "size-8 justify-center p-2",
        // A thumb needs 44; the 32 rail rows are pointer-sized.
        inMobile && size !== "lg" && "h-11",
        className,
      )}
      {...(asChild ? {} : { type: "button" as const })}
      onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
        onClick?.(e);
        // Picking a page closes the phone nav — it was only ever in the way.
        if (inMobile && !e.defaultPrevented) setMobileOpen(false);
      }}
      {...props}
    />
  );
}

/** The label, hidden with the rail so the icon can centre itself. */
export function SidebarMenuLabel({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const { collapsed } = useSidebar();
  if (collapsed) return null;
  return (
    <span
      data-slot="sidebar-menu-label"
      className={cn("flex-1 truncate", className)}
      {...props}
    />
  );
}

export function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"span">) {
  const { collapsed } = useSidebar();
  if (collapsed) return null;
  return (
    <span
      data-slot="sidebar-menu-badge"
      className={cn(
        "ms-auto text-label-sm text-content-neutral-muted",
        className,
      )}
      {...props}
    />
  );
}

const sidebarMenuSubVariants = cva("flex flex-col gap-1 py-0.5", {
  variants: {
    variant: {
      default: "",
      indent: "px-1.5",
      border: "ms-4 border-s border-line-neutral-muted ps-4",
    },
  },
  defaultVariants: { variant: "default" },
});

export interface SidebarMenuSubProps
  extends
    React.ComponentProps<"ul">,
    VariantProps<typeof sidebarMenuSubVariants> {}

export function SidebarMenuSub({
  className,
  variant,
  ...props
}: SidebarMenuSubProps) {
  const { collapsed } = useSidebar();
  if (collapsed) return null;
  return (
    <ul
      data-slot="sidebar-menu-sub"
      className={cn(sidebarMenuSubVariants({ variant }), className)}
      {...props}
    />
  );
}

export function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      className={cn("flex", className)}
      {...props}
    />
  );
}

export interface SidebarMenuSubButtonProps extends React.ComponentProps<"button"> {
  asChild?: boolean;
  active?: boolean;
}

export function SidebarMenuSubButton({
  className,
  asChild,
  active = false,
  ...props
}: SidebarMenuSubButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-active={active || undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex h-7 w-full cursor-pointer items-center gap-2 rounded-md px-2 " +
          "text-body-md text-content-neutral-emphasis outline-none transition-colors " +
          "hover:bg-surface-sidebar-hovered active:bg-surface-sidebar-pressed " +
          "focus-visible:ring-2 focus-visible:ring-line-focused " +
          "[&_svg]:size-4 [&_svg]:shrink-0",
        // As drawn: the same fill as hover, so a selected sub-item and a
        // hovered one are the same picture. Raised.
        active && "bg-surface-sidebar-hovered",
        className,
      )}
      {...(asChild ? {} : { type: "button" as const })}
      {...props}
    />
  );
}

/** Figma's `Sidebar / Header Button` — a 28 square that folds the rail. */
export function SidebarTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<"button">) {
  const { collapsed, setCollapsed, phone, mobileOpen, setMobileOpen } =
    useSidebar();
  return (
    <button
      type="button"
      data-slot="sidebar-trigger"
      aria-expanded={phone ? mobileOpen : !collapsed}
      aria-label={
        phone
          ? "Open navigation"
          : collapsed
            ? "Expand sidebar"
            : "Collapse sidebar"
      }
      onClick={() =>
        phone ? setMobileOpen(!mobileOpen) : setCollapsed(!collapsed)
      }
      className={cn(
        "flex size-7 shrink-0 cursor-pointer items-center justify-center rounded-md " +
          "text-content-neutral-muted outline-none transition-colors " +
          "hover:bg-surface-sidebar-hovered active:bg-surface-sidebar-pressed " +
          "focus-visible:ring-2 focus-visible:ring-line-focused " +
          "[&_svg]:size-4",
        className,
      )}
      {...props}
    >
      {children ?? <PanelLeft aria-hidden className="rtl-mirror" />}
    </button>
  );
}

/** The page beside the rail. */
export function SidebarInset({
  className,
  ...props
}: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn("flex min-w-0 flex-1 flex-col", className)}
      {...props}
    />
  );
}

export { sidebarMenuButtonVariants, sidebarMenuSubVariants };
