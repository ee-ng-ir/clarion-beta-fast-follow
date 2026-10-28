// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as SeparatorPrimitive from "@radix-ui/react-separator";
import { cn } from "../../lib/utils";

/**
 * Separator — Figma 2055:4783.
 *
 * A 1px rule on border/neutral/muted that divides related groups inside the
 * same surface: menu sections, card sections, toolbar groups. Horizontal
 * fills its container's width; vertical fills the height of the row it is in.
 *
 * Drawn as a background, not a border — `h-px bg-line-neutral-muted` is
 * already the house pattern for a rule (Select uses it three times, Meter
 * once). A 1px background and a 1px border render identically, and the
 * background version cannot be accidentally overridden by a border utility.
 *
 * **Decorative by default**, so it is hidden from assistive technology. A rule
 * is a visual grouping cue, and a screen reader already hears the grouping
 * from the headings, lists and landmarks around it — announcing "separator"
 * between every pair of sections is noise. Pass `decorative={false}` only
 * where the rule is the *only* thing marking a boundary.
 *
 * A vertical separator needs a parent that gives it a height. In a flex row it
 * takes one from `self-stretch`; anywhere else, set a height on it (`h-5` in a
 * toolbar). With neither it is 1px wide and 0 tall, which is nothing at all.
 */
export type SeparatorProps = React.ComponentProps<
  typeof SeparatorPrimitive.Root
>;

export function Separator({
  className,
  orientation = "horizontal",
  decorative = true,
  ...props
}: SeparatorProps) {
  return (
    <SeparatorPrimitive.Root
      data-slot="separator"
      orientation={orientation}
      decorative={decorative}
      className={cn(
        "shrink-0 bg-line-neutral-muted " +
          "data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full " +
          "data-[orientation=vertical]:w-px data-[orientation=vertical]:self-stretch",
        className,
      )}
      {...props}
    />
  );
}
