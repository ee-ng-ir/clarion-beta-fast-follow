import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { Loader2 } from "lucide-react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-xs hover:bg-[var(--bg-primary-emphasis-hovered)] active:bg-[var(--bg-primary-emphasis-pressed)]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-xs hover:bg-[var(--bg-danger-emphasis-hovered)] active:bg-[var(--bg-danger-emphasis-pressed)]",
        outline:
          "border border-[var(--border-neutral-emphasis)] bg-card text-foreground shadow-xs hover:bg-accent",
        secondary:
          "bg-secondary text-secondary-foreground border border-[var(--border-neutral-muted)] hover:bg-accent",
        ghost: "text-foreground hover:bg-accent",
        link: "text-[var(--fg-link-default)] underline-offset-4 hover:underline hover:text-[var(--fg-link-hovered)]",
      },
      size: {
        default: "h-9 px-4 py-2 has-[>svg]:px-3",
        sm: "h-8 rounded-md gap-1.5 px-3 text-xs has-[>svg]:px-2.5",
        lg: "h-10 rounded-md px-6 has-[>svg]:px-4",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  }
)

function Button({
  className,
  variant,
  size,
  asChild = false,
  loading = false,
  disabled,
  children,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean
    /** Show a spinner, disable interaction, and mark the control busy. */
    loading?: boolean
  }) {
  const Comp = asChild ? Slot : "button"
  // Slot requires a single child, so only decorate when rendering a real button.
  const showSpinner = loading && !asChild
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      disabled={asChild ? undefined : disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {showSpinner ? (
        <>
          <Loader2 className="animate-spin" aria-hidden />
          {children}
        </>
      ) : (
        children
      )}
    </Comp>
  )
}

export { Button, buttonVariants }
