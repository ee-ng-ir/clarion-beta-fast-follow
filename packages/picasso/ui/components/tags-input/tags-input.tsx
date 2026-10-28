// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { X } from "lucide-react";
import { cn } from "../../lib/utils";

/**
 * TagsInput — Figma's `Tags input` set (40000625:567), with Input chip (646:219) for each tag.
 *
 * - Enter or comma adds what has been typed; pasting "a, b, c" adds three.
 * - Backspace in an empty field removes the last tag.
 * - Duplicates are ignored (case-insensitive), so a tag list is a set.
 * - Each chip's × is a real button named "Remove <tag>".
 *
 * The box is the same as Input's but grows in height as chips wrap — Figma's
 * 6 / 8 padding and 6px gaps around 28px chips give the 40px resting height.
 * `validate` decides what may become a tag (an email, a hostname); a rejected
 * entry stays in the field so it can be corrected rather than lost.
 */
export interface InputChipProps extends React.ComponentProps<"span"> {
  onRemove?: () => void;
  removeLabel?: string;
  disabled?: boolean;
}

/** Figma "Input chip": a pill with a label and a remove ×. */
export function InputChip({
  className,
  children,
  onRemove,
  removeLabel,
  disabled,
  ...props
}: InputChipProps) {
  return (
    <span
      data-slot="input-chip"
      className={cn(
        /* 28, where a standalone Chip is 32 — not a drift. This pill lives
           inside the field, which is 36 at sm with py-1: 4 + 28 + 4 fills it
           exactly. A 32 pill would leave 2 above and below and read as
           jammed in. The two are different because one sits in a box and the
           other does not. */
        "inline-flex h-7 max-w-full items-center gap-1.5 rounded-full border border-line-neutral-muted ps-3 text-label-md text-content-neutral-emphasis",
        onRemove ? "pe-1.5" : "pe-3",
        disabled && "text-content-disabled",
        className,
      )}
      {...props}
    >
      <span className="truncate">{children}</span>
      {onRemove ? (
        <button
          type="button"
          aria-label={
            removeLabel ??
            `Remove ${typeof children === "string" ? children : "tag"}`
          }
          disabled={disabled}
          onClick={onRemove}
          className="inline-flex size-4 items-center justify-center rounded-full outline-none hover:bg-surface-neutral-subtle-hovered focus-visible:ring-2 focus-visible:ring-line-focused disabled:pointer-events-none relative after:absolute after:-inset-2 pointer-coarse:after:-inset-3.5"
        >
          <X aria-hidden className="size-3" />
        </button>
      ) : null}
    </span>
  );
}

export interface TagsInputProps extends Omit<
  React.ComponentProps<"input">,
  "size" | "value" | "defaultValue" | "onChange"
> {
  value?: string[];
  defaultValue?: string[];
  onValueChange?: (value: string[]) => void;
  /** Return false to refuse a tag; it stays in the field for correcting. */
  validate?: (tag: string) => boolean;
  size?: "sm" | "md";
  groupClassName?: string;
}

export const TagsInput = React.forwardRef<HTMLInputElement, TagsInputProps>(
  (
    {
      value,
      defaultValue = [],
      onValueChange,
      validate,
      size = "md",
      groupClassName,
      className,
      placeholder = "Add a tag…",
      disabled,
      onKeyDown,
      onBlur,
      onPaste,
      ...props
    },
    ref,
  ) => {
    const controlled = value !== undefined;
    const [inner, setInner] = React.useState<string[]>(defaultValue);
    const tags = controlled ? value : inner;
    const [text, setText] = React.useState("");
    const set = (next: string[]) => {
      if (!controlled) setInner(next);
      onValueChange?.(next);
    };

    const add = (raw: string[]) => {
      const next = [...tags];
      const rejected: string[] = [];
      for (const r of raw.map((s) => s.trim()).filter(Boolean)) {
        if (next.some((t) => t.toLowerCase() === r.toLowerCase())) continue;
        if (validate && !validate(r)) {
          rejected.push(r);
          continue;
        }
        next.push(r);
      }
      if (next.length !== tags.length) set(next);
      setText(rejected.join(", "));
    };

    return (
      <div
        data-slot="tags-input"
        className={cn(
          "flex w-full min-w-0 flex-wrap items-center rounded-md border bg-surface-input-default border-line-input-default " +
            "text-content-neutral-emphasis transition-colors hover:border-line-input-hovered " +
            "focus-within:border-line-input-focused focus-within:ring-2 focus-within:ring-line-focused " +
            "focus-within:ring-offset-2 focus-within:ring-offset-surface-app " +
            "has-[[aria-invalid=true]]:border-line-input-invalid " +
            "has-[input:disabled]:cursor-not-allowed has-[input:disabled]:bg-surface-input-disabled has-[input:disabled]:border-line-input-disabled",
          size === "sm"
            ? "min-h-9 gap-1.5 px-2 py-1 text-body-sm"
            : "min-h-10 gap-1.5 px-2 py-1.5 text-body-md",
          groupClassName,
        )}
        onMouseDown={(e) => {
          if ((e.target as HTMLElement).closest("button, input")) return;
          e.preventDefault();
          e.currentTarget.querySelector("input")?.focus();
        }}
      >
        {tags.map((t) => (
          <InputChip
            key={t}
            disabled={disabled}
            onRemove={() => set(tags.filter((x) => x !== t))}
          >
            {t}
          </InputChip>
        ))}
        <input
          ref={ref}
          data-slot="tags-input-control"
          value={text}
          disabled={disabled}
          placeholder={placeholder}
          onChange={(e) => {
            const v = e.target.value;
            if (v.includes(",")) {
              add(v.split(",").slice(0, -1));
              setText(
                (s) =>
                  (s ? `${s}, ` : "") + (v.split(",").at(-1) ?? "").trimStart(),
              );
            } else setText(v);
          }}
          onKeyDown={(e) => {
            onKeyDown?.(e);
            if (e.defaultPrevented) return;
            if (e.key === "Enter" && text.trim()) {
              e.preventDefault();
              add([text]);
            } else if (e.key === "Backspace" && !text && tags.length)
              set(tags.slice(0, -1));
          }}
          onPaste={(e) => {
            onPaste?.(e);
            const data = e.clipboardData.getData("text");
            if (/[,\n]/.test(data)) {
              e.preventDefault();
              add(data.split(/[,\n]/));
            }
          }}
          onBlur={(e) => {
            onBlur?.(e);
            if (text.trim()) add([text]);
          }}
          className={cn(
            "h-7 min-w-20 flex-1 bg-transparent px-1 outline-none placeholder:text-content-neutral-subtle disabled:cursor-not-allowed",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);
TagsInput.displayName = "TagsInput";
