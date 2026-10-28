// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../../lib/utils";

/**
 * Table
 *
 * FROM FIGMA (`Table (columns)` 40000377:22464 and `Table column`
 * 40000377:22458), as drawn:
 *
 *   header cell   h 40, padding 12/16, bg/neutral/muted (Figma still binds
 *                 subtle; moved 2 Oct so the band shows on any surface), border top AND
 *                 bottom, label/sm, fg/neutral/emphasis — 40 at BOTH sizes
 *   body cell     md: h 60, padding 0/16, body/md
 *                 sm: h 52, padding 0/12, body/sm
 *                 border-bottom only; the text is vertically centred
 *   hover         bg/neutral/subtle-hovered
 *   selected      bg/selected/subtle
 *
 * ⚠️ **Figma models the table as COLUMNS; this models it as rows.** In the
 * file a table is built by placing `Table column` components side by side,
 * each holding its own header and ten row slots, with a separate `Table row
 * highlight` laid over the top to draw hover and selection across them. That
 * is a sound way to author a table in Figma — it keeps a column's type
 * consistent down its length — but it has no equivalent in HTML.
 *
 * There is no column element. `<tr>` owns `<td>`, and that is what a screen
 * reader announces, what sorting and selection attach to, and what makes a
 * row highlight a single element instead of an overlay. A column-oriented
 * DOM would have to fake all of it. So the code is row-oriented and the two
 * models are not reconciled — the same divergence the theme-architecture
 * note records for Input's `Type` axis, and it resolves the same way: the
 * code shape is the contract.
 *
 * What this means in practice: Figma's `Table column` types (Text, Mono,
 * Score, Badge, Avatar, Checkbox, Actions …) are cell *content* here, not
 * variants. A Mono column is `<TableCell className="font-mono">` — or
 * better, whatever component that content actually is.
 *
 * The one thing v2 has that rows do not is **a width set once for the whole
 * column**. HTML has exactly one column-shaped element for that — `<col>` —
 * so `TableColGroup` / `TableCol` are here to carry it. Declaring widths
 * there keeps them in one place, in column order, the way the Figma
 * component does, instead of scattered across the first row's cells.
 *
 * ⚠️ The card, toolbar and pagination bar around the table in Figma are NOT
 * part of this component. That surface is a Card — same radius, same border,
 * same fill — so it composes rather than being rebuilt here. The stories
 * show it.
 */
type Size = "md" | "sm";

const TableContext = React.createContext<Size>("md");
const useTableSize = () => React.useContext(TableContext);

export interface TableProps extends React.ComponentProps<"table"> {
  /** Figma's `Size`: md rows are 60 tall, sm rows 52. Headers are 40 in both. */
  size?: Size;
}

export function Table({ className, size = "md", ...props }: TableProps) {
  return (
    <TableContext.Provider value={size}>
      {/* The scroll container is part of the component: a table that cannot
          scroll horizontally either overflows its card or collapses its
          columns, and both are worse than a scrollbar. */}
      <div data-slot="table-container" className="w-full overflow-x-auto">
        <table
          data-slot="table"
          data-size={size}
          className={cn(
            "w-full caption-bottom border-collapse text-start",
            className,
          )}
          {...props}
        />
      </div>
    </TableContext.Provider>
  );
}

/**
 * `<colgroup>` — where a column's width is declared once, for every cell in
 * it. The closest HTML gets to Figma v2's column slot.
 */
export function TableColGroup({
  className,
  ...props
}: React.ComponentProps<"colgroup">) {
  return (
    <colgroup data-slot="table-colgroup" className={cn(className)} {...props} />
  );
}

/**
 * One column's width. `<col>` accepts almost no styling — width and
 * background and little else — which is the point: it sets the column's
 * size without becoming another place to style cells.
 *
 * The width comes in as a class, which `no-restyle` would normally refuse.
 * It is allowed by a `contracts` entry in `eslint.config.mjs` scoped to this
 * component and to layout classes only — colour and typography on a `<col>`
 * are still refused. Carrying an arbitrary width is the entire reason the
 * element exists, and the colgroup IS the parent, so there is nowhere else
 * for it to go.
 */
export function TableCol({ className, ...props }: React.ComponentProps<"col">) {
  return <col data-slot="table-col" className={cn(className)} {...props} />;
}

export function TableHeader({
  className,
  ...props
}: React.ComponentProps<"thead">) {
  return (
    <thead data-slot="table-header" className={cn(className)} {...props} />
  );
}

export function TableBody({
  className,
  ...props
}: React.ComponentProps<"tbody">) {
  return <tbody data-slot="table-body" className={cn(className)} {...props} />;
}

/** `<tfoot>` — a totals row. The pagination bar in Figma is not this; it is a card footer. */
export function TableFooter({
  className,
  ...props
}: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t border-line-neutral-muted font-medium",
        className,
      )}
      {...props}
    />
  );
}

export interface TableRowProps extends React.ComponentProps<"tr"> {
  /** Draws the selected fill and sets aria-selected. */
  selected?: boolean;
}

export function TableRow({ className, selected, ...props }: TableRowProps) {
  return (
    <tr
      data-slot="table-row"
      data-state={selected ? "selected" : undefined}
      // aria-selected belongs on the row, not the checkbox inside it — the
      // row is the thing that is selected.
      aria-selected={selected || undefined}
      className={cn(
        "border-b border-line-neutral-muted transition-colors",
        "hover:bg-surface-neutral-subtle-hovered",
        "data-[state=selected]:bg-surface-selected-subtle",
        className,
      )}
      {...props}
    />
  );
}

/* Figma's column Types split three ways: what the cell contains (Badge,
 * Avatar, Checkbox, Actions — components, not variants here), how it reads
 * (Title + supporting — layout inside the cell), and how it is SET —
 * Mono / Score / Statistic are all "a number, right-aligned, in mono". That
 * last group is a property of the column, so it lives in the contract as
 * `numeric` rather than as two classes remembered at each call site. */
const cellVariants = cva("align-middle", {
  variants: {
    align: { start: "text-start", center: "text-center", end: "text-end" },
    /**
     * A number: right-aligned and mono, so place values line up down the
     * column. Right in **every** locale — the units digit is on the right in
     * Arabic and Hebrew too, as it is in a spreadsheet. `ltr-island` keeps a
     * sign or a unit from being reordered, and makes `text-end` mean right.
     */
    numeric: { true: "ltr-island text-end font-mono", false: "" },
  },
  defaultVariants: { numeric: false },
});

export interface TableHeadProps
  // `align` is a deprecated HTML attribute on th/td, so the native one is
  // dropped — same collision Input has with the native `size`.
  extends
    Omit<React.ComponentProps<"th">, "align">,
    VariantProps<typeof cellVariants> {}

export function TableHead({
  className,
  align,
  numeric,
  ...props
}: TableHeadProps) {
  return (
    <th
      data-slot="table-head"
      scope="col"
      className={cn(
        // 40 tall at both sizes, and bordered top and bottom — the top border
        // is what separates it from the toolbar above.
        "h-10 border-y border-line-neutral-muted bg-surface-neutral-muted px-4",
        "text-label-sm text-content-neutral-emphasis whitespace-nowrap",
        // A numeric column heads right with the figures, but stays in the
        // label face — Figma's header is label/sm whatever the column holds.
        cellVariants({ align }),
        // eslint-disable-next-line picasso/no-physical-properties -- the heading sits over figures that are right-aligned in every locale (see `numeric`); its own text may be Arabic, so it cannot be an LTR island and `text-end` would put it on the left.
        numeric && "text-right",
        className,
      )}
      {...props}
    />
  );
}

export interface TableCellProps
  extends
    Omit<React.ComponentProps<"td">, "align">,
    VariantProps<typeof cellVariants> {}

export function TableCell({
  className,
  align,
  numeric,
  ...props
}: TableCellProps) {
  const size = useTableSize();
  return (
    <td
      data-slot="table-cell"
      className={cn(
        "text-content-neutral-emphasis",
        size === "sm" ? "h-13 px-3 text-body-sm" : "h-15 px-4 text-body-md",
        cellVariants({ align, numeric }),
        className,
      )}
      {...props}
    />
  );
}

export function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-body-sm text-content-neutral-muted", className)}
      {...props}
    />
  );
}
