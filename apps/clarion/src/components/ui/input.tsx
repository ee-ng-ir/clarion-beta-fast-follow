import * as React from "react"
import { cn } from "@/lib/utils"

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-md border border-[var(--border-input-default)] bg-[var(--bg-input-default)] px-3 py-1 text-sm shadow-xs transition-colors outline-none",
        "placeholder:text-muted-foreground",
        "hover:border-[var(--border-input-hovered)]",
        "focus-visible:border-[var(--border-input-focused)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
        "aria-invalid:border-[var(--border-input-invalid)]",
        "disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[var(--bg-input-disabled)]",
        className
      )}
      {...props}
    />
  )
}
export { Input }
