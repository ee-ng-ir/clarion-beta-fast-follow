// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { Slot, Slottable } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Check, X } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * Chip — Figma `Chip` 635:291, 10 variants.
 *
 * One component, five jobs. Figma carried five separate sets until 29 Sept —
 * Filter, Assistive, Input, Suggestion and AI — and they turned out to be
 * **paint-identical across all five states**. They differed only in which
 * icon slots were on and one glyph, which is presence, not paint, so they
 * collapsed into this one set rather than into a `Type` axis that would have
 * painted the same forty ways. Assistive and Suggestion were literally the
 * same component twice.
 *
 * So the old vocabulary maps onto props, not variants:
 *
 * | was            | now                                    |
 * |----------------|----------------------------------------|
 * | Filter chip    | `selected` — a toggle                  |
 * | Assistive      | the plain chip                         |
 * | Suggestion     | the plain chip                         |
 * | Input chip     | `onRemove` — a token with a ✕          |
 * | AI chip        | a leading `<Sparkles />` as a child    |
 *
 * ⭐ Selection is carried by a check mark, not by the fill. `Selected` does
 * change the fill — but only at rest: on hover, focus and press a selected
 * chip takes the same fill as an unselected one, and the check is the only
 * thing still telling them apart. That is the right way round, and it is why
 * the check is not optional when `selected` is set.
 *
 * Measured from the file: 32 tall, pill radius, 12 of horizontal padding,
 * gap 6, label/md at 13px Medium, icons at 14. Rest is unfilled on
 * border/neutral/muted; a selected or focused chip is bg/card; hover and
 * press take the neutral subtle ramp;
 * disabled is bg/disabled with fg/disabled.
 */
const chipVariants = cva(
  "inline-flex h-8 max-w-full items-center gap-1.5 rounded-full border border-line-neutral-muted " +
    "px-3 text-label-md text-content-neutral-emphasis outline-none " +
    "[&_svg]:size-3.5 [&_svg]:shrink-0",
  {
    variants: {
      selected: { true: "bg-surface-card", false: "" },
      interactive: {
        true:
          // A chip you can press gives 3% under the pointer, like Button;
          // a removable token is not itself a control, so it does not.
          "transition-press motion-safe:active:scale-97 " +
          "cursor-pointer hover:bg-surface-neutral-subtle-hovered " +
          "active:bg-surface-neutral-subtle-pressed " +
          "focus-visible:bg-surface-card focus-visible:ring-2 " +
          "focus-visible:ring-line-focused focus-visible:ring-offset-2 " +
          "focus-visible:ring-offset-surface-app " +
          "disabled:pointer-events-none disabled:bg-surface-disabled disabled:text-content-disabled",
        false: "transition-colors",
      },
    },
    defaultVariants: { selected: false, interactive: true },
  },
);

export interface ChipProps
  extends
    Omit<React.ComponentProps<"button">, "onSelect">,
    Pick<VariantProps<typeof chipVariants>, "selected"> {
  asChild?: boolean;
  /**
   * Makes the chip a toggle: renders the check and sets `aria-pressed`. Leave
   * it undefined for a chip that performs an action rather than holding a
   * state — there is nothing to press-and-stay.
   */
  selected?: boolean;
  /**
   * Makes the chip a removable token — Figma's old Input chip.
   *
   * ⚠️ This changes the element. A chip is a `<button>` by default, and a
   * button inside a button is invalid HTML that browsers silently unnest, so
   * a removable chip renders as a `<span>` whose ✕ is the only control. That
   * is also the right semantics: the token is not itself an action.
   */
  onRemove?: () => void;
  /** Names the ✕ for screen readers. Defaults to "Remove". */
  removeLabel?: string;
}

export function Chip({
  className,
  selected,
  asChild,
  onRemove,
  removeLabel = "Remove",
  children,
  disabled,
  ...props
}: ChipProps) {
  const removable = onRemove !== undefined;
  const interactive = !removable;
  const classes = cn(
    chipVariants({ selected: selected ?? false, interactive }),
    className,
  );

  if (removable) {
    const { type: _type, ...rest } = props;
    return (
      <span
        data-slot="chip"
        data-selected={selected ?? undefined}
        className={classes}
        {...rest}
      >
        {selected ? <Check aria-hidden data-slot="chip-check" /> : null}
        <span className="truncate">{children}</span>
        <button
          type="button"
          data-slot="chip-remove"
          aria-label={removeLabel}
          disabled={disabled}
          onClick={onRemove}
          className={
            "-me-1 inline-flex size-4 shrink-0 cursor-pointer items-center justify-center " +
            // the target reaches past the icon; a 24-tall chip cannot hold a
            // 44 box, so the box stays 16 and the hit area does not
            "relative after:absolute after:-inset-2 pointer-coarse:after:-inset-3.5 " +
            "rounded-full outline-none transition-colors " +
            "hover:bg-surface-neutral-subtle-hovered " +
            "focus-visible:ring-2 focus-visible:ring-line-focused " +
            "disabled:pointer-events-none disabled:text-content-disabled"
          }
        >
          <X aria-hidden />
        </button>
      </span>
    );
  }

  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="chip"
      data-selected={selected ?? undefined}
      aria-pressed={selected}
      disabled={disabled}
      className={classes}
      {...(asChild ? {} : { type: "button" as const })}
      {...props}
    >
      {/* Slottable, not a bare child: with asChild the check and the children
          are two children, and Slot takes exactly one. */}
      {selected ? <Check aria-hidden data-slot="chip-check" /> : null}
      <Slottable>{children}</Slottable>
    </Comp>
  );
}

export { chipVariants };
