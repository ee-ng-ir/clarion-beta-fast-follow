import { Landmark, LayoutDashboard, LogOut } from "lucide-react"
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Experience } from "@/nav"

export const currentUser = { name: "Ian Lowe", initials: "IL", email: "ian.lowe@ir.com" }

/**
 * Top-right account menu — avatar + name trigger, then Account actions.
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Account — ${currentUser.name}`}
          className="flex h-10 shrink-0 items-center gap-2 rounded-lg p-1 transition-colors md:pr-3 data-[state=open]:bg-[var(--bg-info-subtle)] hover:bg-[var(--bg-neutral-subtle-hovered)]"
          style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-subtle)", color: "var(--fg-neutral-emphasis)" }}
        >
          <Avatar className="size-8">
            <AvatarFallback className="text-xs font-medium">{currentUser.initials}</AvatarFallback>
          </Avatar>
          <span className="hidden text-sm font-medium md:inline">{currentUser.name}</span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="text-xs font-normal" style={{ color: "var(--fg-neutral-muted)" }}>Account</DropdownMenuLabel>
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
