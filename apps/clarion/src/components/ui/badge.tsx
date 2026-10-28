import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center justify-center rounded-md border px-2 py-0.5 text-xs font-medium w-fit whitespace-nowrap shrink-0 gap-1 [&>svg]:size-3 transition-colors",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground",
        secondary: "border-[var(--border-neutral-muted)] bg-secondary text-secondary-foreground",
        outline: "border-[var(--border-neutral-emphasis)] text-foreground",
        success: "border-[var(--border-success-muted)] bg-success-subtle text-[var(--fg-on-success-subtle)]",
        warning: "border-[var(--border-warning-muted)] bg-warning-subtle text-[var(--fg-on-warning-subtle)]",
        danger: "border-[var(--border-danger-muted)] bg-danger-subtle text-[var(--fg-on-danger-subtle)]",
        info: "border-[var(--border-info-muted)] bg-info-subtle text-[var(--fg-on-info-subtle)]",
      },
    },
    defaultVariants: { variant: "default" },
  }
)

function Badge({
  className,
  variant,
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "span"
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />
}
export { Badge, badgeVariants }
