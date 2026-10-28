// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { cva, type VariantProps } from "class-variance-authority";
import {
  CircleCheck,
  Info,
  OctagonAlert,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { useDirection } from "../direction/direction";

/**
 * Toast — Figma `Toast` 94:59093, 24 variants (Variant × Style × Action).
 *
 * Transient confirmation of something that already happened. Anything the
 * person has to act on belongs in an Alert, which stays put.
 *
 * ⚠️ Figma's `Style` axis is `appearance` here, because `style` is a DOM
 * prop and a component that spreads onto a div cannot own the name. Values
 * keep Figma's: Emphasis fills with the tone, Subtle tints it.
 *
 * Tone names follow Alert — `destructive` on `danger` tokens — so the two
 * read the same in props even though the token family is spelled otherwise.
 *
 * | appearance | surface            | border                | title                    | description             |
 * |------------|--------------------|-----------------------|--------------------------|-------------------------|
 * | emphasis   | bg/{tone}/emphasis | border/{tone}/emphasis| fg/on/{tone}-emphasis    | fg/on/{tone}-emphasis   |
 * | subtle     | bg/{tone}/subtle   | border/{tone}/muted   | fg/neutral/emphasis      | fg/neutral/muted        |
 *
 * ⚠️ **One correction.** On an Emphasis toast the file paints the dismiss ✕
 * with `fg/on/primary-emphasis` while the tone icon and both text lines use
 * `fg/on/{tone}-emphasis`. For three tones that happens to be the same white
 * and nobody would notice — but `fg/on/warning-emphasis` is neutral-950 where
 * `fg/on/primary-emphasis` is white, so a **Warning Emphasis** toast in light
 * mode draws a white ✕ on a light surface. The close follows its own toast's
 * on-colour here. Same class as the wrong-family tokens the audit already
 * cleared; Figma needs it too.
 *
 * ⚠️ Raised, not acted on: the action Button instance overrides the radius to
 * radius/lg (10) where every one of Button's 294 variants is radius/md (8),
 * and its border is border/neutral/subtle where code's Outline is
 * border/neutral/muted. The code Button is used as-is.
 *
 * Also note Alert draws the same card with border/{tone}/**emphasis** where
 * Toast Subtle uses border/{tone}/**muted** — two members of one family
 * disagreeing about their edge.
 */
const toastVariants = cva(
  "flex w-115 max-w-full items-center gap-2 rounded-md border px-2.5 py-2 shadow-md outline-none " +
    // Motion. It arrives from the edge its viewport sits on (inline end: the
    // right, or the left under dir="rtl") over motion/duration/slow and
    // leaves the same way over base, whether it timed out, was closed or
    // was swiped. Under reduced motion it fades in and out instead.
    "data-[state=open]:animate-toast-in data-[state=closed]:animate-toast-out " +
    // The swipe. The card follows the finger, carries on from where it was
    // let go, and settles back if the swipe is abandoned. Following a
    // finger is not animation, so it stays on under reduced motion; only
    // the settle is switched off.
    "data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) " +
    "data-[swipe=end]:translate-x-(--radix-toast-swipe-end-x) " +
    "data-[swipe=cancel]:translate-x-0 motion-safe:data-[swipe=cancel]:transition-transform data-[swipe=cancel]:ease-out",
  {
    variants: {
      variant: { info: "", destructive: "", warning: "", success: "" },
      appearance: { emphasis: "", subtle: "" },
    },
    compoundVariants: [
      {
        variant: "info",
        appearance: "emphasis",
        class:
          "border-line-info-emphasis bg-surface-info-emphasis text-content-on-info-emphasis",
      },
      {
        variant: "destructive",
        appearance: "emphasis",
        class:
          "border-line-danger-emphasis bg-surface-danger-emphasis text-content-on-danger-emphasis",
      },
      {
        variant: "warning",
        appearance: "emphasis",
        class:
          "border-line-warning-emphasis bg-surface-warning-emphasis text-content-on-warning-emphasis",
      },
      {
        variant: "success",
        appearance: "emphasis",
        class:
          "border-line-success-emphasis bg-surface-success-emphasis text-content-on-success-emphasis",
      },
      {
        variant: "info",
        appearance: "subtle",
        class: "border-line-info-muted bg-surface-info-subtle",
      },
      {
        variant: "destructive",
        appearance: "subtle",
        class: "border-line-danger-muted bg-surface-danger-subtle",
      },
      {
        variant: "warning",
        appearance: "subtle",
        class: "border-line-warning-muted bg-surface-warning-subtle",
      },
      {
        variant: "success",
        appearance: "subtle",
        class: "border-line-success-muted bg-surface-success-subtle",
      },
    ],
    defaultVariants: { variant: "info", appearance: "emphasis" },
  },
);

const ICONS = {
  info: Info,
  destructive: OctagonAlert,
  warning: TriangleAlert,
  success: CircleCheck,
} as const;

type Tone = keyof typeof ICONS;
type Appearance = "emphasis" | "subtle";

const ToastContext = React.createContext<{
  variant: Tone;
  appearance: Appearance;
}>({
  variant: "info",
  appearance: "emphasis",
});

/**
 * Wrap the app once. Radix owns the queue, the timers and the swipe.
 *
 * RTL: the viewport and the slide mirror in CSS. The swipe cannot — Radix's
 * `swipeDirection` is physical and defaults to "right" — so it is set here
 * from the direction provider: a toast is swiped away toward the edge it
 * came from, which is the left in Arabic. Pass `swipeDirection` to override.
 */
export function ToastProvider(
  props: React.ComponentProps<typeof ToastPrimitive.Provider>,
) {
  const direction = useDirection();
  return (
    <ToastPrimitive.Provider
      swipeDirection={direction === "rtl" ? "left" : "right"}
      {...props}
    />
  );
}

/**
 * Where toasts stack. Bottom-right by default; full width below `sm`, where
 * a 460 card would not fit.
 */
export function ToastViewport({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      data-slot="toast-viewport"
      className={cn(
        "fixed end-0 bottom-0 z-notification flex max-h-screen w-full flex-col gap-2 p-4 sm:w-auto",
        className,
      )}
      {...props}
    />
  );
}

export interface ToastProps
  extends
    React.ComponentProps<typeof ToastPrimitive.Root>,
    VariantProps<typeof toastVariants> {}

export function Toast({
  className,
  variant,
  appearance,
  children,
  ...props
}: ToastProps) {
  const ctx = React.useMemo(
    () =>
      ({
        variant: variant ?? "info",
        appearance: appearance ?? "emphasis",
      }) as const,
    [variant, appearance],
  );
  return (
    <ToastContext.Provider value={ctx}>
      <ToastPrimitive.Root
        data-slot="toast"
        className={cn(toastVariants({ variant, appearance }), className)}
        {...props}
      >
        {children}
      </ToastPrimitive.Root>
    </ToastContext.Provider>
  );
}

/** The icon and the two text lines. Top-aligned, so a wrapped description does not drag the icon down. */
export function ToastBody({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="toast-body"
      className={cn("flex flex-1 items-start gap-2", className)}
      {...props}
    />
  );
}

/** The tone icon — Figma's `Toast Icon` boolean. Colour follows the title. */
export function ToastIcon({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const { variant, appearance } = React.useContext(ToastContext);
  const Icon = ICONS[variant];
  return (
    <div
      data-slot="toast-icon"
      className={cn(
        "flex shrink-0 pt-0.5",
        appearance === "subtle" && "text-content-neutral-emphasis",
        className,
      )}
      {...props}
    >
      {children ?? <Icon aria-hidden className="size-4" />}
    </div>
  );
}

export function ToastContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="toast-content"
      className={cn("flex flex-1 flex-col gap-0.5", className)}
      {...props}
    />
  );
}

export function ToastTitle({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Title>) {
  const { appearance } = React.useContext(ToastContext);
  return (
    <ToastPrimitive.Title
      data-slot="toast-title"
      className={cn(
        "text-label-lg",
        appearance === "subtle" && "text-content-neutral-emphasis",
        className,
      )}
      {...props}
    />
  );
}

export function ToastDescription({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Description>) {
  const { appearance } = React.useContext(ToastContext);
  return (
    <ToastPrimitive.Description
      data-slot="toast-description"
      className={cn(
        "text-body-md",
        appearance === "subtle" && "text-content-neutral-muted",
        className,
      )}
      {...props}
    />
  );
}

/** Figma's `Action=Button` — pass a Button as the child. */
export function ToastAction({
  className,
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Action>) {
  return (
    <ToastPrimitive.Action
      data-slot="toast-action"
      className={cn("shrink-0", className)}
      {...props}
    />
  );
}

/**
 * Figma's `Action=Dismiss`. Inherits the toast's own on-colour rather than
 * the file's `fg/on/primary-emphasis` — see the note at the top.
 */
export function ToastClose({
  className,
  label = "Dismiss",
  ...props
}: React.ComponentProps<typeof ToastPrimitive.Close> & { label?: string }) {
  const { appearance } = React.useContext(ToastContext);
  return (
    <ToastPrimitive.Close
      data-slot="toast-close"
      aria-label={label}
      className={cn(
        // The Toast clips its own content for the swipe, so the expanded-hit-
        // area trick the other dismissers use is cut off at the edge — this
        // one grows a real box instead. The icon stays 16; 24 is the floor.
        "flex size-6 shrink-0 cursor-pointer items-center justify-center self-start rounded-xs " +
          "outline-none focus-visible:ring-2 focus-visible:ring-line-focused " +
          "focus-visible:ring-offset-2 focus-visible:ring-offset-surface-card",
        appearance === "subtle" && "text-content-neutral-emphasis",
        className,
      )}
      {...props}
    >
      <X aria-hidden className="size-4" />
    </ToastPrimitive.Close>
  );
}

export { toastVariants };
