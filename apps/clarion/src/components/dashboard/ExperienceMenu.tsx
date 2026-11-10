import { Check, FlaskConical, Landmark, LayoutDashboard, LogOut } from "lucide-react"
import { access, accessLine, initials } from "@ir/mock-data/access"
import {
  Avatar, AvatarFallback,
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@ir/ui"
import { clarionViewAsPeople, setViewAs, useViewer } from "@/lib/viewer"
import type { Experience } from "@/nav"

/**
 * Top-right account menu (Picasso). The trigger is the avatar alone; who you
 * are signed in as, and your role, open at the top of the menu.
 * Prototype only: "View as" signs in as someone else from the shared dummy tenant
 * (@ir/mock-data), so each screen shows what their Clarion roles allow.
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
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={`Account: ${person.name}`}
          className="shrink-0 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-line-focused"
        >
          <Avatar size="sm">
            <AvatarFallback>{initials(person.name)}</AvatarFallback>
          </Avatar>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <div className="flex items-center gap-3 px-1.5 py-2">
          <Avatar size="md"><AvatarFallback>{initials(person.name)}</AvatarFallback></Avatar>
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-label-md text-content-neutral-emphasis">{person.name}</span>
            <span className="truncate text-body-xs text-content-neutral-muted">{accessLine(id)}</span>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuLabel className="flex items-center gap-1.5">
            <FlaskConical className="size-3.5" aria-hidden /> View as (prototype)
          </DropdownMenuLabel>
          {clarionViewAsPeople().map((pid) => {
            const p = access.person(pid)!
            return (
              <DropdownMenuItem key={pid} onSelect={() => setViewAs(pid)} className="h-auto items-start py-1.5">
                <span className="flex min-w-0 flex-1 flex-col">
                  <span>{p.name}</span>
                  <span className="truncate text-body-xs text-content-neutral-muted">{accessLine(pid)}</span>
                </span>
                {pid === id && <Check className="mt-0.5" aria-label="Current" />}
              </DropdownMenuItem>
            )
          })}
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          {onSwitch && (experience === "admin" ? (
            <DropdownMenuItem onSelect={() => onSwitch("fleet")}><LayoutDashboard aria-hidden /> Back to Clarion</DropdownMenuItem>
          ) : (
            <DropdownMenuItem onSelect={() => onSwitch("admin")}><Landmark aria-hidden /> Go to Admin Portal</DropdownMenuItem>
          ))}
          <DropdownMenuItem><LogOut aria-hidden /> Sign out</DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
