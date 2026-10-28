// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import * as Popover from "@radix-ui/react-popover";
import { Check, Filter, Search } from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../button/button";
import { checkboxVariants } from "../checkbox/checkbox";
import { InputButton } from "../input-button/input-button";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../input-group/input-group";
import { Separator } from "../separator/separator";

/**
 * Select — Figma Select (1580:759), Select / Menu (1579:471).
 *
 * A FILTER, not a dropdown: the trigger keeps its label ("Filter actions…")
 * and shows how many are chosen; the menu is searchable, multi-select, and
 * grouped, and nothing takes effect until Apply.
 *
 * Why Apply rather than live: every tick in a filter re-queries the table
 * behind it. Picking four event types live means four reloads and a table that
 * jumps under the cursor. A draft that commits once is calmer and cheaper.
 * Closing without Apply (Escape, click away) discards the draft — the same
 * contract as Cancel in a dialog.
 *
 * Structure and a11y:
 * - Trigger: InputButton (Figma `Input button` with its count badge on), aria-expanded.
 * - Search: role="combobox" that owns the list via aria-activedescendant, so
 *   focus never leaves the search box. ArrowUp/Down move, Enter ticks,
 *   Ctrl/⌘+Enter applies, Escape closes.
 * - List: role="listbox" aria-multiselectable, options role="option" with
 *   aria-selected. The checkbox in each row is DRAWN (Checkbox's own styles on
 *   a span) rather than being a Checkbox — a real one would be a second
 *   control inside the option, announced twice and tabbable.
 * - Measurements from Figma: menu radius/xl on bg/overlay, rows 28px with
 *   6px gaps, the event value on the right in body/xs.
 */
export interface SelectOption {
  value: string;
  label: string;
  /** Right-aligned secondary text. Defaults to the value (Figma's "Event Value"). */
  detail?: string;
  /** Options sharing a group render under one label, in first-seen order. */
  group?: string;
  disabled?: boolean;
}

export interface SelectProps extends Omit<
  React.ComponentProps<"button">,
  "value" | "defaultValue" | "onChange" | "children"
> {
  options: SelectOption[];
  value?: string[];
  defaultValue?: string[];
  /** Called once, on Apply (or Clear + Apply), with the new selection. */
  onValueChange?: (value: string[]) => void;
  /** The trigger's label. It stays put when things are selected — the count says how many. */
  label: string;
  icon?: React.ReactNode;
  size?: "sm" | "md";
  searchPlaceholder?: string;
  emptyText?: string;
  clearLabel?: string;
  applyLabel?: string;
  /** Show each option's detail (or value) on the right. */
  showDetail?: boolean;
}

export const Select = React.forwardRef<HTMLButtonElement, SelectProps>(
  (
    {
      options,
      value,
      defaultValue = [],
      onValueChange,
      label,
      icon = <Filter />,
      size = "md",
      searchPlaceholder = "Search…",
      emptyText = "No matches",
      clearLabel = "Clear",
      applyLabel = "Apply",
      showDetail = true,
      disabled,
      ...triggerProps
    },
    ref,
  ) => {
    const controlled = value !== undefined;
    const [inner, setInner] = React.useState<string[]>(defaultValue);
    const selected = controlled ? value : inner;

    const [open, setOpen] = React.useState(false);
    const [draft, setDraft] = React.useState<string[]>(selected);
    const [query, setQuery] = React.useState("");
    const [active, setActive] = React.useState<string | null>(null);
    const uid = React.useId();
    const listId = `${uid}-list`;
    const optionId = (v: string) => `${uid}-opt-${v.replace(/\W/g, "_")}`;
    const searchRef = React.useRef<HTMLInputElement>(null);

    const onOpenChange = (next: boolean) => {
      if (next) {
        setDraft(selected);
        setQuery("");
        setActive(null);
      }
      setOpen(next);
    };

    const q = query.trim().toLowerCase();
    const visible = options.filter(
      (o) =>
        !q ||
        [o.label, o.detail ?? "", o.value].some((s) =>
          s.toLowerCase().includes(q),
        ),
    );
    const groups: [string | undefined, SelectOption[]][] = [];
    for (const o of visible) {
      const g = groups.find(([name]) => name === o.group);
      if (g) g[1].push(o);
      else groups.push([o.group, [o]]);
    }
    const navigable = groups.flatMap(([, os]) => os).filter((o) => !o.disabled);

    const toggle = (v: string) =>
      setDraft((d) => (d.includes(v) ? d.filter((x) => x !== v) : [...d, v]));
    const apply = () => {
      // Keep the options' own order, not the order they were ticked in.
      const next = options.map((o) => o.value).filter((v) => draft.includes(v));
      if (!controlled) setInner(next);
      onValueChange?.(next);
      setOpen(false);
    };
    const move = (by: number) => {
      if (!navigable.length) return;
      const i = navigable.findIndex((o) => o.value === active);
      // Nothing highlighted yet: Down starts at the top, Up at the bottom.
      const at =
        i < 0
          ? by > 0
            ? 0
            : navigable.length - 1
          : (i + by + navigable.length) % navigable.length;
      const next = navigable[at];
      setActive(next.value);
      document
        .getElementById(optionId(next.value))
        ?.scrollIntoView?.({ block: "nearest" });
    };

    const count = selected.length;
    return (
      <Popover.Root open={open} onOpenChange={onOpenChange}>
        <Popover.Trigger asChild disabled={disabled}>
          <InputButton
            ref={ref}
            size={size}
            icon={icon}
            placeholder={label}
            disabled={disabled}
            data-slot="select-trigger"
            adornment={
              count ? (
                <span
                  data-slot="select-count"
                  className={cn(
                    "inline-flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full border px-1 tabular-nums",
                    "border-line-neutral-muted bg-surface-neutral-muted text-label-sm text-content-neutral-emphasis",
                  )}
                >
                  <span aria-hidden>{count}</span>
                  <span className="sr-only">, {count} selected</span>
                </span>
              ) : null
            }
            {...triggerProps}
          />
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content
            align="start"
            sideOffset={8}
            data-slot="select-menu"
            onOpenAutoFocus={(e) => {
              e.preventDefault();
              searchRef.current?.focus();
            }}
            className={
              "z-floating w-(--radix-popover-trigger-width) min-w-60 overflow-hidden rounded-xl border border-line-neutral-muted bg-surface-overlay shadow-md outline-none " +
              "origin-(--radix-popover-content-transform-origin) " +
              "data-[state=open]:animate-popover-in data-[state=closed]:animate-popover-out"
            }
          >
            <div className="p-2">
              <InputGroup size="md">
                <InputGroupAddon>
                  <Search aria-hidden />
                </InputGroupAddon>
                <InputGroupInput
                  ref={searchRef}
                  role="combobox"
                  aria-label={`Search ${label.replace(/[.…]+$/, "")}`}
                  aria-expanded
                  aria-controls={listId}
                  aria-autocomplete="list"
                  aria-activedescendant={active ? optionId(active) : undefined}
                  placeholder={searchPlaceholder}
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setActive(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowDown") {
                      e.preventDefault();
                      move(1);
                    } else if (e.key === "ArrowUp") {
                      e.preventDefault();
                      move(-1);
                    } else if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault();
                      apply();
                    } else if (e.key === "Enter" && active) {
                      e.preventDefault();
                      toggle(active);
                    }
                  }}
                />
              </InputGroup>
            </div>
            <Separator />
            <div
              id={listId}
              role="listbox"
              aria-multiselectable
              aria-label={label.replace(/[.…]+$/, "")}
              data-slot="select-list"
              className="max-h-80 overflow-y-auto p-1"
            >
              {groups.length === 0 ? (
                <div
                  role="presentation"
                  className="px-1.5 py-4 text-center text-body-sm text-content-neutral-subtle"
                >
                  {emptyText}
                </div>
              ) : (
                groups.map(([name, os], gi) => {
                  const gid = `${uid}-g${gi}`;
                  return (
                    <React.Fragment key={name ?? `_${gi}`}>
                      {gi > 0 ? (
                        <div className="my-1">
                          <Separator />
                        </div>
                      ) : null}
                      <div
                        role="group"
                        aria-labelledby={name ? gid : undefined}
                      >
                        {name ? (
                          <div
                            id={gid}
                            role="presentation"
                            className="px-1.5 py-1 text-label-sm text-content-neutral-subtle"
                          >
                            {name}
                          </div>
                        ) : null}
                        {os.map((o) => {
                          const on = draft.includes(o.value);
                          return (
                            <div
                              key={o.value}
                              id={optionId(o.value)}
                              role="option"
                              aria-selected={on}
                              aria-disabled={o.disabled || undefined}
                              data-active={active === o.value || undefined}
                              data-slot="select-option"
                              onMouseDown={(e) => e.preventDefault()}
                              onMouseMove={() =>
                                !o.disabled &&
                                active !== o.value &&
                                setActive(o.value)
                              }
                              onClick={() => !o.disabled && toggle(o.value)}
                              className={cn(
                                "flex min-h-7 cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-body-md text-content-neutral-emphasis",
                                "data-[active]:bg-surface-neutral-subtle-hovered",
                                "aria-disabled:cursor-not-allowed aria-disabled:text-content-disabled",
                              )}
                            >
                              <span
                                aria-hidden
                                data-state={on ? "checked" : "unchecked"}
                                className={cn(
                                  checkboxVariants({ size: "md" }),
                                  "inline-flex items-center justify-center",
                                )}
                              >
                                {on ? <Check strokeWidth={3} /> : null}
                              </span>
                              <span className="min-w-0 flex-1 truncate">
                                {o.label}
                              </span>
                              {showDetail ? (
                                <span className="max-w-32 shrink-0 truncate text-body-xs text-content-neutral-subtle">
                                  {o.detail ?? o.value}
                                </span>
                              ) : null}
                            </div>
                          );
                        })}
                      </div>
                    </React.Fragment>
                  );
                })
              )}
            </div>
            <Separator />
            <div
              className="flex items-center justify-between gap-2 p-2"
              data-slot="select-footer"
            >
              <Button
                variant="ghost"
                size="sm"
                disabled={!draft.length}
                onClick={() => setDraft([])}
              >
                {clearLabel}
              </Button>
              <Button size="sm" onClick={apply}>
                {applyLabel}
              </Button>
            </div>
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    );
  },
);
Select.displayName = "Select";
