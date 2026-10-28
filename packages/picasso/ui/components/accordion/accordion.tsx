// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { cva, type VariantProps } from "class-variance-authority";
import { ChevronDown, ChevronUp, CircleMinus, CirclePlus } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Accordion — Figma `Accordion / Item` 1136:1487, 16 variants.
 *
 * ⚠️ Figma's axis is `Type` (FAQ | Default); here it is `variant`, because
 * Radix's Root already owns `type` for single-versus-multiple open. The
 * values keep Figma's names.
 *
 * The axis is **not** inert, which a structural dump makes it look. Both
 * types are identical node for node — same heights, same type styles, same
 * gaps — and differ only in the INSTANCE_SWAP default on the icon:
 *
 * | variant   | collapsed   | expanded    |
 * |-----------|-------------|-------------|
 * | `faq`     | CirclePlus  | CircleMinus |
 * | `default` | ChevronDown | ChevronUp   |
 *
 * Plus or minus is a promise that something appears; a chevron is a promise
 * that something unfolds. Same mechanism, different expectation.
 *
 * The icon colour follows the **state**, not the type: fg/neutral/subtle
 * collapsed, fg/neutral/emphasis expanded, on both types. (Read from the
 * Divider=True variants, the only ones whose glyph is resolved in the file;
 * the swap targets are shared with their Divider=False siblings.)
 *
 * Layout: the icon sits beside the whole text column at 24, gap 16, aligned
 * to the top. The trigger is a full-width row of title and icon, so the
 * content below is inset by 40 — the icon plus its gap — to keep its edge
 * with the title's. Trigger is heading/xs in fg/neutral/emphasis; content is
 * body/lg in fg/neutral/muted, 4 below the trigger.
 *
 * `divider` draws the rule **above** an item, with 24 of padding under it, so
 * a list of items is separated without a trailing rule at the bottom.
 *
 * Motion (2 Oct): a row opens over motion/duration/base and closes over
 * fast, animating to the height Radix measures and publishes as
 * `--radix-accordion-content-height`, with a fade riding on the height.
 * Height is the one layout property Picasso animates: nothing else opens a
 * row. Under reduced motion the row fades in at full height instead.
 */
type AccordionVariant = "faq" | "default";
type IconPosition = "left" | "right";

interface AccordionContextValue {
  variant: AccordionVariant;
  iconPosition: IconPosition;
}

const AccordionContext = React.createContext<AccordionContextValue>({
  variant: "default",
  iconPosition: "right",
});

const accordionItemVariants = cva("flex flex-col", {
  variants: {
    divider: { true: "border-t border-line-neutral-muted pt-6", false: "" },
  },
  defaultVariants: { divider: false },
});

/**
 * A type, not an interface, and the root props are rebuilt before spreading:
 * Radix's Root is a union of its single and multiple forms, which an
 * interface cannot extend and JSX cannot narrow once extra keys are mixed in.
 */
export type AccordionProps = React.ComponentProps<
  typeof AccordionPrimitive.Root
> & {
  /** Figma's `Type` axis, renamed — Radix owns `type`. Picks the icon pair. */
  variant?: AccordionVariant;
  /** Figma's `Icon position`. */
  iconPosition?: IconPosition;
};

export function Accordion({
  variant = "default",
  iconPosition = "right",
  ...props
}: AccordionProps) {
  const ctx = React.useMemo(
    () => ({ variant, iconPosition }),
    [variant, iconPosition],
  );
  // Hyphenated JSX attributes are never type-checked, so data-slot stays an
  // attribute; only the spread needs steering back onto the union.
  const rootProps = props as React.ComponentProps<
    typeof AccordionPrimitive.Root
  >;
  return (
    <AccordionContext.Provider value={ctx}>
      <AccordionPrimitive.Root data-slot="accordion" {...rootProps} />
    </AccordionContext.Provider>
  );
}

export interface AccordionItemProps
  extends
    React.ComponentProps<typeof AccordionPrimitive.Item>,
    VariantProps<typeof accordionItemVariants> {}

export function AccordionItem({
  className,
  divider,
  ...props
}: AccordionItemProps) {
  return (
    <AccordionPrimitive.Item
      data-slot="accordion-item"
      className={cn(accordionItemVariants({ divider }), className)}
      {...props}
    />
  );
}

const ICONS = {
  faq: { closed: CirclePlus, open: CircleMinus },
  default: { closed: ChevronDown, open: ChevronUp },
} as const;

export function AccordionTrigger({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  const { variant, iconPosition } = React.useContext(AccordionContext);
  const { closed: Closed, open: Open } = ICONS[variant];

  const icon = (
    <span
      data-slot="accordion-icon"
      className="flex size-6 shrink-0 items-center justify-center"
    >
      <Closed
        aria-hidden
        className="size-6 text-content-neutral-subtle group-data-[state=open]/trigger:hidden"
      />
      <Open
        aria-hidden
        className="hidden size-6 text-content-neutral-emphasis group-data-[state=open]/trigger:block"
      />
    </span>
  );

  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "group/trigger flex flex-1 cursor-pointer items-start gap-4 rounded-xs text-start " +
            "text-heading-xs text-content-neutral-emphasis outline-none " +
            "focus-visible:ring-2 focus-visible:ring-line-focused focus-visible:ring-offset-2 " +
            "focus-visible:ring-offset-surface-app",
          className,
        )}
        {...props}
      >
        {iconPosition === "left" ? icon : null}
        <span className="flex-1">{children}</span>
        {iconPosition === "right" ? icon : null}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

/**
 * Inset by the icon's 24 plus the row's gap of 16, so the body lines up with
 * the title rather than running under the icon.
 */
export function AccordionContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  const { iconPosition } = React.useContext(AccordionContext);
  return (
    <AccordionPrimitive.Content
      data-slot="accordion-content"
      className={cn(
        "overflow-hidden text-body-lg text-content-neutral-muted",
        "data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up",
        className,
      )}
      {...props}
    >
      <div className={cn("pt-1", iconPosition === "left" ? "ps-10" : "pe-10")}>
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

export { accordionItemVariants };
