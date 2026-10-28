// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  CircleCheck,
  Info,
  OctagonAlert,
  TriangleAlert,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Alert
 *
 * Something the page needs to say about itself, in place. An Alert sits in
 * the layout and stays there — it is not a Toast, which arrives, speaks and
 * leaves, and it is not a Dialog, which stops everything until answered.
 *
 * FROM FIGMA (`79:8042`, 12 variants = 4 tones × 3 actions), as drawn:
 *
 *   box        rounded-md, 1px border, padding 8/10, gap 8, centred
 *   tone       bg/<tone>/subtle + border/<tone>/emphasis — the tone lives in
 *              the surface and the border, and nowhere else
 *   title row  icon 16 · title (label/lg) · dismiss 16, gap 4
 *   body       body/md, fg/neutral/muted, 4 below the title
 *   action     an xs Outline Button at the end of the box
 *
 * ⚠️ The icon and the dismiss take `fg/neutral/emphasis`, the same ink as the
 * title, in all four tones. That is Figma's spec, and it is why the tone has
 * to be carried by the surface — do not tint the icon to compensate.
 *
 * ⚠️ **The icon and the dismiss live inside the title row**, which is where
 * Figma puts them, so they align with the title rather than floating against
 * the middle of a two-line block. It also means an Alert with no
 * `AlertTitle` has neither — again, Figma's shape, since both are children
 * of the title row there. If a dismissible alert with no title is wanted,
 * that is a change to the Figma component first.
 */
const alertVariants = cva(
  "flex w-full items-center gap-2 rounded-md border px-2.5 py-2",
  {
    variants: {
      variant: {
        info: "bg-surface-info-subtle border-line-info-emphasis",
        destructive: "bg-surface-danger-subtle border-line-danger-emphasis",
        warning: "bg-surface-warning-subtle border-line-warning-emphasis",
        success: "bg-surface-success-subtle border-line-success-emphasis",
      },
    },
    defaultVariants: { variant: "info" },
  },
);

const ICONS = {
  info: Info,
  destructive: OctagonAlert,
  warning: TriangleAlert,
  success: CircleCheck,
} as const;

type Tone = keyof typeof ICONS;

interface AlertContextValue {
  variant: Tone;
  icon: boolean;
  onDismiss?: () => void;
  dismissLabel: string;
}

const AlertContext = React.createContext<AlertContextValue | null>(null);

export interface AlertProps
  extends
    Omit<React.ComponentProps<"div">, "title">,
    VariantProps<typeof alertVariants> {
  /** Hide the tone icon. Figma's `Icon` boolean. */
  icon?: boolean;
  /** Renders the dismiss control at the end of the title row. */
  onDismiss?: () => void;
  /** Label for the dismiss control — it is an ✕, so it needs words. */
  dismissLabel?: string;
  /** The trailing action, an xs Outline Button in Figma's `Action=Button`. */
  action?: React.ReactNode;
}

export function Alert({
  className,
  variant = "info",
  icon = true,
  onDismiss,
  dismissLabel = "Dismiss",
  action,
  children,
  ...props
}: AlertProps) {
  const ctx = React.useMemo<AlertContextValue>(
    () => ({ variant: variant ?? "info", icon, onDismiss, dismissLabel }),
    [variant, icon, onDismiss, dismissLabel],
  );
  return (
    <AlertContext.Provider value={ctx}>
      <div
        // No role by default, on purpose. `role="alert"` interrupts a screen
        // reader mid-sentence: right for something that just happened, wrong
        // for something that was on the page when it loaded — and an Alert is
        // usually the second. The caller knows which it is, so the caller says:
        // `role="alert"` for something that just went wrong, `role="status"`
        // for something that just succeeded, nothing for a standing notice.
        data-slot="alert"
        data-variant={variant}
        className={cn(alertVariants({ variant }), className)}
        {...props}
      >
        <div
          data-slot="alert-body"
          className="flex min-w-0 flex-1 flex-col gap-1"
        >
          {children}
        </div>
        {action ? (
          <div data-slot="alert-action" className="shrink-0">
            {action}
          </div>
        ) : null}
      </div>
    </AlertContext.Provider>
  );
}

/**
 * The title row: icon, one line of label/lg, and the dismiss. One line — a
 * title that wraps is a description.
 */
export function AlertTitle({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  const ctx = React.useContext(AlertContext);
  const Icon = ICONS[ctx?.variant ?? "info"];
  return (
    <div
      data-slot="alert-title"
      className={cn(
        "flex items-center gap-1 text-label-lg text-content-neutral-emphasis",
        className,
      )}
      {...props}
    >
      {ctx?.icon !== false ? (
        <Icon data-slot="alert-icon" aria-hidden className="size-4 shrink-0" />
      ) : null}
      <span className="min-w-0 flex-1">{children}</span>
      {ctx?.onDismiss ? (
        <button
          type="button"
          data-slot="alert-dismiss"
          onClick={ctx.onDismiss}
          aria-label={ctx.dismissLabel}
          className={cn(
            "flex size-4 shrink-0 items-center justify-center rounded-xs",
            // the target reaches past the icon; the box stays 16
            "relative after:absolute after:-inset-2 pointer-coarse:after:-inset-3.5 ",
            "outline-none transition-colors",
            "hover:bg-surface-layer-on-emphasis-subtle",
            "focus-visible:bg-surface-layer-on-emphasis-subtle",
            "focus-visible:ring-2 focus-visible:ring-line-focused",
          )}
        >
          <X className="size-4" aria-hidden />
        </button>
      ) : null}
    </div>
  );
}

/** body/md, muted. Says what happened and what to do about it. */
export function AlertDescription({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="alert-description"
      className={cn("text-body-md text-content-neutral-muted", className)}
      {...props}
    />
  );
}

export { alertVariants };
