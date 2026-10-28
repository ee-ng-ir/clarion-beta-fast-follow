import * as React from "react"
import { X } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

/**
 * Chip — the interactive sibling of Badge.
 *
 * Badge is a static label (status, count). Chip is for things the user acts on:
 * filter chips (toggle `selected`), input/token chips (`onRemove` shows an ×),
 * and choice chips. Shares Badge's role variants so the two read as a family.
 *
 * Conventions (see COMPONENTS.md golden rules):
 *  - surfaces from --bg-*, text from --fg-*, lines from --border-*
 *  - interactive states use the matching -hovered / -pressed token
 *  - `selected` re-points to the --bg-selected-* + --border-focused tokens
 *  - dark mode is automatic via the semantic layer
 */
const chipVariants = cva(
  "group inline-flex items-center w-fit shrink-0 whitespace-nowrap rounded-full border font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&>svg]:shrink-0 [&>svg]:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "border-[var(--border-neutral-muted)] bg-transparent text-[var(--fg-neutral-emphasis)]",
        outline:
          "border-[var(--border-neutral-emphasis)] bg-transparent text-[var(--fg-neutral-emphasis)]",
        primary:
          "border-[var(--border-primary-muted)] bg-[var(--bg-primary-subtle)] text-[var(--fg-on-primary-subtle)]",
        success:
          "border-[var(--border-success-muted)] bg-[var(--bg-success-subtle)] text-[var(--fg-on-success-subtle)]",
        warning:
          "border-[var(--border-warning-muted)] bg-[var(--bg-warning-subtle)] text-[var(--fg-on-warning-subtle)]",
        danger:
          "border-[var(--border-danger-muted)] bg-[var(--bg-danger-subtle)] text-[var(--fg-on-danger-subtle)]",
        info: "border-[var(--border-info-muted)] bg-[var(--bg-info-subtle)] text-[var(--fg-on-info-subtle)]",
      },
      size: {
        sm: "h-6 gap-1 px-2 text-xs [&>svg]:size-3",
        md: "h-8 gap-1.5 px-3 text-sm [&>svg]:size-3.5",
      },
      // applied when the chip is clickable / toggleable
      interactive: {
        true: "cursor-pointer hover:bg-[var(--bg-neutral-subtle-hovered)] active:bg-[var(--bg-neutral-subtle-pressed)]",
        false: "",
      },
    },
    defaultVariants: { variant: "default", size: "md", interactive: false },
  }
)

// Selected filter chip = neutral soft fill + auto leading tick (per the
// Design System "Filter chip" spec). The tick is the selection signal, not a
// brand-coloured fill. Focus is conveyed by the ring, matching the other chips.
const selectedClasses =
  "border-[var(--border-neutral-muted)] bg-[var(--bg-neutral-muted)] text-[var(--fg-neutral-emphasis)] hover:bg-[var(--bg-neutral-muted-hovered)] active:bg-[var(--bg-neutral-muted-pressed)]"

type ChipBaseProps = VariantProps<typeof chipVariants> & {
  /** Leading content: an icon, status dot, or avatar. */
  leading?: React.ReactNode
  /** Filter/choice-chip on state. Adds aria-pressed when the chip is a button. */
  selected?: boolean
  /** When provided, renders a trailing × that calls this instead of selecting. */
  onRemove?: () => void
  /** Accessible label for the remove button. */
  removeLabel?: string
}

export type ChipProps = Omit<React.ComponentProps<"button">, "children"> &
  ChipBaseProps & { children?: React.ReactNode }

function Chip({
  className,
  variant,
  size,
  leading,
  selected = false,
  onRemove,
  removeLabel = "Remove",
  onClick,
  children,
  type = "button",
  ...props
}: ChipProps) {
  // A chip whose body can be clicked/toggled (filter & choice chips).
  const clickable = Boolean(onClick)

  return (
    <button
      data-slot="chip"
      type={type}
      aria-pressed={clickable ? selected : undefined}
      data-state={selected ? "selected" : undefined}
      onClick={onClick}
      className={cn(
        chipVariants({ variant, size, interactive: clickable }),
        selected && selectedClasses,
        // a chip that only removes shouldn't look clickable on its body
        !clickable && "cursor-default",
        className
      )}
      {...props}
    >
      {leading}
      {children}
      {onRemove && (
        <span
          role="button"
          tabIndex={0}
          aria-label={removeLabel}
          onClick={(e) => {
            e.stopPropagation()
            onRemove()
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault()
              e.stopPropagation()
              onRemove()
            }
          }}
          className={cn(
            "-mr-1 ml-0.5 inline-flex items-center justify-center rounded-full transition-colors",
            "hover:bg-[var(--bg-layer-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            size === "sm" ? "size-3.5 [&>svg]:size-2.5" : "size-4 [&>svg]:size-3"
          )}
        >
          <X aria-hidden />
        </span>
      )}
    </button>
  )
}

export { Chip, chipVariants }
