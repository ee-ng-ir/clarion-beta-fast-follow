import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { InfoTip } from "@/components/ui/info-tip"
import { cn } from "@/lib/utils"

export function KpiCard({
  title,
  icon: Icon,
  value,
  delta,
  info,
  children,
  className,
  fixedWidth = false,
}: {
  title: ReactNode
  icon: LucideIcon
  value: ReactNode
  delta?: ReactNode
  /** optional explanatory tooltip shown via an (i) icon next to the title */
  info?: string
  children?: ReactNode
  className?: string
  fixedWidth?: boolean
}) {
  return (
    <Card
      className={cn(
        "gap-0 rounded-xl",
        fixedWidth ? "w-60 shrink-0" : "min-w-px flex-1",
        className
      )}
    >
      <div className="flex items-start gap-2 p-4">
        <div className="flex min-w-0 flex-1 items-center gap-1.5">
          <h3
            className="text-heading-sm truncate"
            style={{ color: "var(--fg-neutral-emphasis)" }}
          >
            {title}
          </h3>
          {info && <InfoTip text={info} />}
        </div>
        <Icon className="size-4 shrink-0" style={{ color: "var(--fg-neutral-subtle)" }} />
      </div>
      <div className="flex flex-col gap-2 px-4 pb-4">
        <div className="flex items-baseline gap-2">
          <div
            className="text-metric-xl"
            style={{ color: "var(--fg-neutral-emphasis)" }}
          >
            {value}
          </div>
          {delta}
        </div>
        {children}
      </div>
    </Card>
  )
}
