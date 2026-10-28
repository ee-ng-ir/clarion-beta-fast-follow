// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../../lib/utils";
import { overlaySurfaceVariants } from "../overlay/overlay";

/**
 * Popover — Figma 2298:11200.
 *
 * The file's own note: *"Maps to shadcn/ui Popover, PopoverTrigger,
 * PopoverContent."*
 *
 * It is **exactly the Comfortable overlay surface** — 16 of padding, 16 gap,
 * radius/xl, bg/card on a 1px border/neutral/muted, `shadow/lg` — so the panel
 * takes `overlaySurfaceVariants({ density: "comfortable" })` rather than
 * restating any of it. Change the surface, and Popover moves with it.
 *
 * Header, when there is one: title in heading/xs on fg/neutral/emphasis over a
 * description in body/md on fg/neutral/subtle, gap 4. 288px (w-72) is the
 * drawn width and the default here; it is a starting point, not a constraint.
 *
 * ⚠️ `sideOffset` is 8, which Figma does not specify — a floating panel's
 * distance from its trigger is not something a static frame can show. 8
 * matches what Select already uses for its menu.
 *
 * Radix does not wire a popover's title and description to its panel the way
 * it does for Dialog, so a screen reader would meet an unnamed group. Here the
 * panel points `aria-labelledby` and `aria-describedby` at whichever of them
 * is actually rendered — and at neither when they are not, rather than at an
 * id that does not exist.
 */
const LabelContext = React.createContext<{
  titleId: string;
  descriptionId: string;
  register: (part: "title" | "description") => () => void;
} | null>(null);

export function Popover(
  props: React.ComponentProps<typeof PopoverPrimitive.Root>,
) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

export function PopoverTrigger(
  props: React.ComponentProps<typeof PopoverPrimitive.Trigger>,
) {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/** Anchor the panel to something other than the trigger. */
export function PopoverAnchor(
  props: React.ComponentProps<typeof PopoverPrimitive.Anchor>,
) {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

export interface PopoverContentProps extends React.ComponentProps<
  typeof PopoverPrimitive.Content
> {
  /**
   * Off for content that is already a surface of its own — a Calendar, say,
   * which draws its own card, border and padding. Two cards nested inside
   * each other produce a double border and doubled inset, and stripping the
   * outer one from the call site is what `no-restyle` refuses (rightly), so
   * it is a prop instead.
   *
   * Positioning, portalling and z-index stay; only the card goes.
   */
  surface?: boolean;
}

export function PopoverContent({
  className,
  align = "center",
  sideOffset = 8,
  surface = true,
  children,
  ...props
}: PopoverContentProps) {
  const titleId = React.useId();
  const descriptionId = React.useId();
  const [parts, setParts] = React.useState<{
    title: number;
    description: number;
  }>({ title: 0, description: 0 });

  const register = React.useCallback((part: "title" | "description") => {
    setParts((p) => ({ ...p, [part]: p[part] + 1 }));
    return () => setParts((p) => ({ ...p, [part]: Math.max(0, p[part] - 1) }));
  }, []);

  const value = React.useMemo(
    () => ({ titleId, descriptionId, register }),
    [titleId, descriptionId, register],
  );

  return (
    <PopoverPrimitive.Portal>
      <LabelContext.Provider value={value}>
        <PopoverPrimitive.Content
          data-slot="popover-content"
          align={align}
          sideOffset={sideOffset}
          aria-labelledby={parts.title > 0 ? titleId : undefined}
          aria-describedby={parts.description > 0 ? descriptionId : undefined}
          // The surface lands on Content itself — Radix positions and animates
          // this node, and a styled wrapper would leave the shadow behind.
          // Motion goes on with or without the surface: it grows from the
          // corner nearest the trigger; under reduced motion it only fades.
          className={cn(
            surface
              ? cn(overlaySurfaceVariants({ density: "comfortable" }), "w-72")
              : "z-floating",
            "origin-(--radix-popover-content-transform-origin)",
            "data-[state=open]:animate-popover-in data-[state=closed]:animate-popover-out",
            className,
          )}
          {...props}
        >
          {children}
        </PopoverPrimitive.Content>
      </LabelContext.Provider>
    </PopoverPrimitive.Portal>
  );
}

/** Title over description, gap 4 — Figma's `_PopoverHeader`. */
export function PopoverHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="popover-header"
      className={cn("flex flex-col gap-1", className)}
      {...props}
    />
  );
}

export function PopoverTitle({
  className,
  ...props
}: React.ComponentProps<"h2">) {
  const ctx = React.useContext(LabelContext);
  React.useEffect(() => ctx?.register("title"), [ctx]);
  return (
    <h2
      id={ctx?.titleId}
      data-slot="popover-title"
      className={cn("text-heading-xs text-content-neutral-emphasis", className)}
      {...props}
    />
  );
}

export function PopoverDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  const ctx = React.useContext(LabelContext);
  React.useEffect(() => ctx?.register("description"), [ctx]);
  return (
    <p
      id={ctx?.descriptionId}
      data-slot="popover-description"
      className={cn("text-body-md text-content-neutral-subtle", className)}
      {...props}
    />
  );
}

export function PopoverClose(
  props: React.ComponentProps<typeof PopoverPrimitive.Close>,
) {
  return <PopoverPrimitive.Close data-slot="popover-close" {...props} />;
}
