import { cn } from "@/lib/utils"

/**
 * Switch — binary toggle.
 *
 * The OFF (false) state is a filled neutral track WITH a border so the control
 * is clearly visible on card/app surfaces (previously it was indistinguishable).
 * ON uses the brand emphasis. Thumb is a card-coloured circle with a shadow.
 *
 * Tokens: off track `--bg-neutral-subtle-pressed` + `--border-neutral-emphasis`;
 * on track `--bg-primary-emphasis`; thumb `--bg-card`. Dark mode is automatic.
 */
export function Switch({
  checked,
  onCheckedChange,
  disabled,
  id,
  className,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledby,
}: {
  checked: boolean
  onCheckedChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
  className?: string
  "aria-label"?: string
  "aria-labelledby"?: string
}) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledby}
      disabled={disabled}
      onClick={() => onCheckedChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full transition-colors outline-none",
        "focus-visible:ring-2 focus-visible:ring-[var(--border-focused)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--bg-card)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      style={{
        background: checked ? "var(--bg-primary-emphasis)" : "var(--bg-neutral-subtle-pressed)",
        border: `1px solid ${checked ? "var(--bg-primary-emphasis)" : "var(--border-neutral-emphasis)"}`,
      }}
    >
      <span
        className="pointer-events-none block size-4 rounded-full transition-transform"
        style={{
          background: "var(--bg-card)",
          boxShadow: "var(--shadow-sm)",
          transform: checked ? "translateX(18px)" : "translateX(2px)",
        }}
      />
    </button>
  )
}
