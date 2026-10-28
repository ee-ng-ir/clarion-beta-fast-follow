// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * Tabs — Figma: _Tab button base 966:33308, Horizontal tabs 966:33657,
 * Vertical tabs 966:33872.
 *
 * Five looks, and the file says what each is for: **Underline** for
 * page-level sections (the default), **Minimal** inside a drawer or card,
 * and **Brand / Gray / Border** as segmented controls for compact toggles.
 * **Line** is Underline's vertical counterpart, for settings-style
 * navigation when there are more than about six sections.
 *
 * Measured, per size — padding is the same at both sizes for every type but
 * Line; the height difference comes from the type ramp:
 *
 *   type        md                          sm
 *   segmented   h44  py-2 px-2.5  r-lg      h36  same padding, label/md
 *   underline   h36  pb-3 px-0.5            h32  same padding, label/md
 *   line        h32  py-1 px-3.5            h24  py-0.5 px-3
 *
 * Those heights are set explicitly, the way Input and Button do. Padding plus
 * a line-height lands 6-9px short of them — measured — and a tab row whose
 * height depends on font metrics is not a row anything else can align to.
 *
 * Track and spacing come from the container, not the button: Underline is a
 * 1px bottom rule with a 12 gap (16 when full width), Gray and Brand are bare
 * 4-gap rows, Minimal is a radius-md tray at gap 2, and Border is a radius-xl
 * tray with 6 of padding. 14px resolves to `rounded-xl` exactly — the scale
 * derives xl as radius × 1.4, and radius is 10.
 *
 * The Border type's current tab has no stroke at all: it is bg/card lifted
 * with the `shadow/sm` effect style. Brand and Minimal DO carry a border when
 * current, so their resting state holds a transparent one — otherwise every
 * selection would shift the row by two pixels.
 *
 * ⚠️ One defect followed in code but not in the file: Figma's
 * `Current=False, Type=Underline, State=Focus` is byte-identical to its
 * Default — no ring, no indicator. Every other Focus variant carries
 * `ring/focus`. A focus state that does not show focus is a keyboard trap, so
 * the code rings every tab; the file wants the same fix.
 */
type Variant = "underline" | "brand" | "gray" | "border" | "minimal" | "line";
type Size = "sm" | "md";

const TabsContext = React.createContext<{
  variant: Variant;
  size: Size;
  fullWidth: boolean;
}>({
  variant: "underline",
  size: "md",
  fullWidth: false,
});

const tabsListVariants = cva("flex", {
  variants: {
    variant: {
      underline: "border-line-neutral-muted",
      line: "",
      gray: "gap-1",
      brand: "gap-1",
      border:
        "gap-1 rounded-xl border border-line-neutral-muted bg-surface-app p-1.5",
      minimal:
        "gap-0.5 rounded-md border border-line-neutral-muted bg-surface-app",
    },
    orientation: {
      horizontal: "flex-row items-center",
      vertical: "flex-col items-stretch",
    },
    fullWidth: { true: "w-full", false: "" },
  },
  compoundVariants: [
    // The rule under the row, which the current tab's 2px indicator sits on.
    {
      variant: "underline",
      orientation: "horizontal",
      class: "gap-3 border-b",
    },
    {
      variant: "underline",
      orientation: "horizontal",
      fullWidth: true,
      class: "gap-4",
    },
    { variant: "line", orientation: "vertical", class: "gap-2" },
  ],
  defaultVariants: {
    variant: "underline",
    orientation: "horizontal",
    fullWidth: false,
  },
});

const tabsTriggerVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-1.5 whitespace-nowrap outline-none transition-colors " +
    "text-content-neutral-muted " +
    "focus-visible:ring-2 focus-visible:ring-line-focused focus-visible:ring-offset-2 " +
    "focus-visible:ring-offset-surface-app " +
    "disabled:pointer-events-none disabled:opacity-50 " +
    "[&_svg]:shrink-0",
  {
    variants: {
      variant: {
        gray:
          "rounded-lg px-2.5 py-2 enabled:hover:bg-surface-neutral-subtle-hovered " +
          "enabled:hover:text-content-neutral-emphasis " +
          "data-[state=active]:bg-surface-neutral-muted data-[state=active]:text-content-neutral-emphasis",
        brand:
          "rounded-lg border border-transparent px-2.5 py-2 " +
          "enabled:hover:text-content-neutral-emphasis " +
          "data-[state=active]:border-line-primary-muted data-[state=active]:bg-surface-primary-subtle " +
          "data-[state=active]:text-content-primary-emphasis",
        minimal:
          "rounded-lg border border-transparent px-2.5 py-2 " +
          "enabled:hover:text-content-neutral-emphasis " +
          "data-[state=active]:border-line-neutral-muted data-[state=active]:bg-surface-card " +
          "data-[state=active]:text-content-neutral-emphasis",
        // No stroke on the current tab — it is lifted, not outlined.
        border:
          "rounded-lg px-2.5 py-2 enabled:hover:text-content-neutral-emphasis " +
          "data-[state=active]:bg-surface-card data-[state=active]:text-content-neutral-emphasis " +
          "data-[state=active]:shadow-sm",
        underline:
          "-mb-px border-b-2 border-transparent px-0.5 pb-3 " +
          "enabled:hover:border-line-primary-emphasis enabled:hover:text-content-primary-emphasis " +
          "data-[state=active]:border-line-primary-emphasis data-[state=active]:text-content-primary-emphasis",
        line:
          "justify-start border-s-2 border-transparent " +
          "enabled:hover:text-content-neutral-emphasis " +
          "data-[state=active]:border-line-primary-emphasis data-[state=active]:text-content-primary-emphasis",
      },
      size: { sm: "text-label-md", md: "text-label-lg" },
      fullWidth: { true: "flex-1", false: "" },
    },
    compoundVariants: [
      { variant: "line", size: "md", class: "h-8 px-3.5 py-1" },
      { variant: "line", size: "sm", class: "h-6 px-3 py-0.5" },
      // Heights are explicit, as they are on Input and Button. Padding plus a
      // line-height lands 6-9px short of what Figma draws, and a tab row that
      // changes height with the font is not a row anyone can align to.
      { variant: "gray", size: "md", class: "h-11" },
      { variant: "brand", size: "md", class: "h-11" },
      { variant: "minimal", size: "md", class: "h-11" },
      { variant: "border", size: "md", class: "h-11" },
      { variant: "gray", size: "sm", class: "h-9" },
      { variant: "brand", size: "sm", class: "h-9" },
      { variant: "minimal", size: "sm", class: "h-9" },
      { variant: "border", size: "sm", class: "h-9" },
      { variant: "underline", size: "md", class: "h-9" },
      { variant: "underline", size: "sm", class: "h-8" },
    ],
    defaultVariants: { variant: "underline", size: "md", fullWidth: false },
  },
);

export interface TabsProps extends React.ComponentProps<
  typeof TabsPrimitive.Root
> {
  variant?: Variant;
  size?: Size;
  /** Stretch the tabs to fill the row. Figma's `Full width`. */
  fullWidth?: boolean;
}

export function Tabs({
  className,
  variant = "underline",
  size = "md",
  fullWidth = false,
  orientation = "horizontal",
  ...props
}: TabsProps) {
  return (
    <TabsContext.Provider value={{ variant, size, fullWidth }}>
      <TabsPrimitive.Root
        data-slot="tabs"
        orientation={orientation}
        className={cn(
          orientation === "vertical" ? "flex gap-6" : "flex flex-col gap-4",
          className,
        )}
        {...props}
      />
    </TabsContext.Provider>
  );
}

export function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  const { variant, fullWidth } = React.useContext(TabsContext);
  const orientation = variant === "line" ? "vertical" : "horizontal";
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        tabsListVariants({ variant, orientation, fullWidth }),
        className,
      )}
      {...props}
    />
  );
}

export interface TabsTriggerProps
  extends
    React.ComponentProps<typeof TabsPrimitive.Trigger>,
    Omit<
      VariantProps<typeof tabsTriggerVariants>,
      "variant" | "size" | "fullWidth"
    > {}

export function TabsTrigger({ className, ...props }: TabsTriggerProps) {
  const { variant, size, fullWidth } = React.useContext(TabsContext);
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        tabsTriggerVariants({ variant, size, fullWidth }),
        className,
      )}
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn(
        "flex-1 outline-none focus-visible:ring-2 focus-visible:ring-line-focused",
        className,
      )}
      {...props}
    />
  );
}

export { tabsListVariants, tabsTriggerVariants };
