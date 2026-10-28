// Small compositions of Picasso parts that the Ops console repeats. Nothing
// here draws its own surface: every colour, size and radius is Picasso's.

import * as React from "react"
import { Check, Copy, Search } from "lucide-react"
import {
  Badge,
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  InputButton,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  Progress,
  type BadgeProps,
} from "@ir/ui"
import { navigate } from "@/lib/router"
import { cx } from "@/lib/format"

/** An in-app link: a real <a> for new tabs, routed in place on a plain click. */
export function Link({ to, className, children, ...props }: { to: string } & Omit<React.ComponentProps<"a">, "href">) {
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        props.onClick?.(e)
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return
        e.preventDefault()
        navigate(to)
      }}
      {...props}
    >
      {children}
    </a>
  )
}

/**
 * A single choice. Picasso's Select is a multi-select filter with Apply, so a
 * one-of-n form control is its InputButton opening a DropdownMenu — both
 * Picasso parts — with a tick on the current option.
 */
export function ChoiceSelect<T extends string>({
  value, onChange, options, placeholder, size, disabled, icon, className, id, ...aria
}: {
  value: T | undefined
  onChange: (v: T) => void
  options: { value: T; label: React.ReactNode; detail?: string; disabled?: boolean }[]
  placeholder?: string
  size?: "sm" | "md"
  disabled?: boolean
  icon?: React.ReactNode
  className?: string
  id?: string
  "aria-label"?: string
  "aria-describedby"?: string
}) {
  const current = options.find((o) => o.value === value)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild disabled={disabled}>
        <InputButton id={id} size={size} icon={icon} value={current?.label} placeholder={placeholder} className={className} disabled={disabled} {...aria} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-(--radix-dropdown-menu-trigger-width)">
        {options.map((o) => (
          <DropdownMenuItem key={o.value} disabled={o.disabled} onSelect={() => onChange(o.value)}>
            <span className="flex-1">{o.label}</span>
            {o.detail ? <span className="text-body-xs text-content-neutral-subtle">{o.detail}</span> : null}
            <Check aria-hidden className={cx("text-content-primary-emphasis", o.value !== value && "invisible")} />
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

export function SearchField({ value, onChange, placeholder, className, size = "md" }: {
  value: string; onChange: (v: string) => void; placeholder: string; className?: string; size?: "sm" | "md"
}) {
  return (
    <InputGroup size={size} className={cx("w-full sm:w-72", className)}>
      <InputGroupAddon><Search aria-hidden /></InputGroupAddon>
      <InputGroupInput type="search" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label={placeholder} />
    </InputGroup>
  )
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const [done, setDone] = React.useState(false)
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={`Copy ${label}`}
          onClick={() => {
            void navigator.clipboard?.writeText(value).catch(() => {})
            setDone(true)
            window.setTimeout(() => setDone(false), 1500)
          }}
        >
          {done ? <Check aria-hidden /> : <Copy aria-hidden />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{done ? "Copied" : `Copy ${label}`}</TooltipContent>
    </Tooltip>
  )
}

// ---------------------------------------------------------------- status --

type Tone = NonNullable<BadgeProps["color"]>
const STATUS: Record<string, { label: string; color: Tone }> = {
  active: { label: "Active", color: "success" },
  cancelled: { label: "Cancelled", color: "neutral" },
  failed: { label: "Failed", color: "danger" },
  suspended: { label: "Suspended", color: "warning" },
  invited: { label: "Invited", color: "info" },
  inactive: { label: "Inactive", color: "neutral" },
  "in-sync": { label: "In sync", color: "success" },
  pending: { label: "Syncing", color: "info" },
  "sync-failed": { label: "Sync failed", color: "danger" },
  deployed: { label: "Deployed", color: "success" },
  "no-state": { label: "No state", color: "neutral" },
  delivered: { label: "Delivered", color: "success" },
  opened: { label: "Opened", color: "success" },
  processed: { label: "Processed", color: "info" },
  deferred: { label: "Deferred", color: "warning" },
  bounced: { label: "Bounced", color: "danger" },
  dropped: { label: "Dropped", color: "danger" },
}

/** Status is colour AND a dot AND a word, never colour alone. */
export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const s = STATUS[status] ?? { label: status, color: "neutral" as Tone }
  return <Badge color={s.color} dot className={className}>{s.label}</Badge>
}

export const SyncBadge = ({ sync }: { sync: string }) => <StatusBadge status={sync === "failed" ? "sync-failed" : sync} />

export function TrialBadge() {
  return <Badge color="info" variant="outline">Trial</Badge>
}

/** A label/value row in a details list. */
export function DetailRow({ label, children, copyValue }: { label: string; children: React.ReactNode; copyValue?: string }) {
  return (
    <div className="flex min-h-11 flex-wrap items-center gap-x-4 gap-y-0.5 border-b border-line-neutral-muted py-2 last:border-b-0 @xl:flex-nowrap">
      <dt className="w-full shrink-0 text-body-md text-content-neutral-muted @xl:w-44">{label}</dt>
      <dd className="flex min-w-0 flex-1 items-center justify-between gap-2 text-body-md text-content-neutral-emphasis">
        <span className="min-w-0 [overflow-wrap:anywhere]">{children}</span>
        {copyValue ? <CopyButton value={copyValue} label={label.toLowerCase()} /> : null}
      </dd>
    </div>
  )
}

/** Monospace identifiers: tenant ids, flag keys, message ids. */
export function Mono({ children, className }: { children: React.ReactNode; className?: string }) {
  return <span className={cx("font-mono text-code-sm", className)}>{children}</span>
}

/** Sortable column header. */
export function SortHead({ label, active, dir, onClick }: { label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="-mx-1 inline-flex cursor-pointer items-center gap-1 rounded-sm px-1 outline-none hover:text-content-primary-emphasis focus-visible:ring-2 focus-visible:ring-line-focused">
      {label}
      <span aria-hidden className={cx("text-content-neutral-subtle", !active && "opacity-0")}>{dir === "asc" ? "↑" : "↓"}</span>
      {active ? <span className="sr-only">, sorted {dir === "asc" ? "ascending" : "descending"}</span> : null}
    </button>
  )
}

/** Licence use: a label and count on one line, Picasso's Progress under it. */
export function Usage({ label, used, total }: { label: string; used: number; total: number }) {
  const pct = total ? Math.min(100, (used / total) * 100) : 0
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between gap-2 text-body-sm">
        <span className="text-content-neutral-muted">{label}</span>
        <span className="text-label-md text-content-neutral-emphasis">{used.toLocaleString()} <span className="text-content-neutral-muted">/ {total.toLocaleString()}</span></span>
      </div>
      <Progress value={pct} aria-label={`${label}: ${used} of ${total}`} />
    </div>
  )
}
