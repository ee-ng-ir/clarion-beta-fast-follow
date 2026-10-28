import { Check, FlaskConical, Landmark, LayoutDashboard, LogOut } from "lucide-react"
import { access, accessLine, initials } from "@ir/mock-data/access"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { clarionViewAsPeople, setViewAs, useViewer } from "@/lib/viewer"
import type { Experience } from "@/nav"

/**
 * Top-right account menu — avatar + name trigger, then Account actions.
 * Prototype only: "View as" signs in as someone else from the shared dummy tenant
 * (@ir/mock-data), so each screen shows what their Clarion roles allow. Same pattern
 * as the client console's account menu.
 * "Go to Admin Portal" (or "Back to Clarion" from the admin shell) appears when
 * `onSwitch` is passed; sign out is always present.
 */
export function ExperienceMenu({
  experience = "fleet",
  onSwitch,
}: {
  experience?: Experience
  onSwitch?: (e: Experience) => void
}) {
  const { id, person } = useViewer()
  const muted = { color: "var(--fg-neutral-muted)" }
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Account — ${person.name}`}
          className="flex h-10 shrink-0 items-center gap-2 rounded-lg p-1 transition-colors md:pr-3 data-[state=open]:bg-[var(--bg-info-subtle)] hover:bg-[var(--bg-neutral-subtle-hovered)]"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-subtle)", color: "var(--fg-neutral-emphasis)" }}
        >
          <Avatar className="size-8">
            <AvatarFallback className="text-xs font-medium">{initials(person.name)}</AvatarFallback>
          </Avatar>
          <span className="hidden flex-col items-start leading-tight md:flex">
            <span className="text-sm font-medium">{person.name}</span>
            <span className="max-w-56 truncate text-xs" style={muted}>{accessLine(id)}</span>
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-1.5 text-xs font-normal" style={muted}>
          <FlaskConical className="size-3.5" aria-hidden /> View as (prototype)
        </DropdownMenuLabel>
        {clarionViewAsPeople().map((pid) => {
          const p = access.person(pid)!
          return (
            <DropdownMenuItem key={pid} onSelect={() => setViewAs(pid)} className="h-auto items-start py-1.5">
              <span className="flex min-w-0 flex-1 flex-col">
                <span>{p.name}</span>
                <span className="truncate text-xs" style={muted}>{accessLine(pid)}</span>
              </span>
              {pid === id && <Check className="mt-0.5" aria-label="Current" />}
            </DropdownMenuItem>
          )
        })}
        <DropdownMenuSeparator />
        <DropdownMenuLabel className="text-xs font-normal" style={muted}>Account</DropdownMenuLabel>
        {onSwitch && (experience === "admin" ? (
          <DropdownMenuItem onSelect={() => onSwitch("fleet")}><LayoutDashboard /> Back to Clarion</DropdownMenuItem>
        ) : (
          <DropdownMenuItem onSelect={() => onSwitch("admin")}><Landmark /> Go to Admin Portal</DropdownMenuItem>
        ))}
        <DropdownMenuItem><LogOut /> Sign out</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
