import { useEffect, useMemo, useRef, useState } from "react"
import * as Dialog from "@radix-ui/react-dialog"
import { Search, MapPin, CornerDownLeft } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { locations, type Status } from "@/data/dashboard"
import { endpoints, type Endpoint, type EndpointStatus } from "@/data/endpoints"

const statusVar: Record<EndpointStatus, string> = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
  offline: "var(--status-unknown)",
}
const initials = (name: string) => name.split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase()

type Item =
  | { kind: "endpoint"; e: Endpoint }
  | { kind: "location"; id: string; name: string; status?: Status; count: number }

export function CommandPalette({
  open, onOpenChange, onPickEndpoint, onPickLocation,
}: {
  open: boolean
  onOpenChange: (o: boolean) => void
  onPickEndpoint: (e: Endpoint) => void
  onPickLocation: (id: string) => void
}) {
  const [q, setQ] = useState("")
  const [active, setActive] = useState(0)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => { if (open) { setQ(""); setActive(0) } }, [open])

  const { items, locMatches, epMatches } = useMemo(() => {
    const term = q.trim().toLowerCase()
    const locMatches: Item[] = locations
      .filter((l) => !term || l.name.toLowerCase().includes(term))
      .map((l) => ({ kind: "location" as const, id: l.id, name: l.name, status: l.status, count: l.endpoints }))
    const epMatches: Item[] = (term
      ? endpoints.filter((e) => `${e.user} ${e.machine}`.toLowerCase().includes(term))
      : endpoints.filter((e) => e.status !== "healthy")
    ).slice(0, 7).map((e) => ({ kind: "endpoint" as const, e }))
    return { items: [...locMatches, ...epMatches], locMatches, epMatches }
  }, [q])

  useEffect(() => { setActive(0) }, [q])

  const choose = (it: Item) => {
    if (it.kind === "endpoint") onPickEndpoint(it.e)
    else onPickLocation(it.id)
    onOpenChange(false)
  }

  const onKey = (ev: React.KeyboardEvent) => {
    if (ev.key === "ArrowDown") { ev.preventDefault(); setActive((a) => Math.min(items.length - 1, a + 1)) }
    if (ev.key === "ArrowUp") { ev.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    if (ev.key === "Enter" && items[active]) { ev.preventDefault(); choose(items[active]) }
  }

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${active}"]`)
    el?.scrollIntoView({ block: "nearest" })
  }, [active])

  let idx = -1
  const Row = (it: Item) => {
    idx += 1
    const myIdx = idx
    const isActive = myIdx === active
    const common = {
      "data-idx": myIdx,
      onMouseEnter: () => setActive(myIdx),
      onClick: () => choose(it),
      className: "flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
      style: { background: isActive ? "var(--bg-neutral-subtle-hovered)" : "transparent" } as React.CSSProperties,
    }
    if (it.kind === "location") {
      return (
        <div key={`l-${it.id}`} {...common}>
          <span className="flex size-8 items-center justify-center rounded-lg" style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}><MapPin className="size-4" /></span>
          <div className="flex min-w-px flex-1 flex-col">
            <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{it.name}</span>
            <span className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{it.count.toLocaleString()} endpoints</span>
          </div>
          <span className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>Filter endpoints</span>
          {isActive && <CornerDownLeft className="size-3.5" style={{ color: "var(--fg-neutral-subtle)" }} />}
        </div>
      )
    }
    const e = it.e
    return (
      <div key={`e-${e.id}`} {...common}>
        <Avatar className="size-8"><AvatarFallback>{initials(e.user)}</AvatarFallback></Avatar>
        <div className="flex min-w-px flex-1 flex-col">
          <span className="truncate text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{e.user}</span>
          <span className="truncate font-mono text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{e.machine} · {e.locationName}</span>
        </div>
        <span className="inline-flex items-center gap-1.5 text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
          <span className="size-1.5 rounded-full" style={{ background: statusVar[e.status] }} />
          {e.score === null ? "—" : e.score}
        </span>
        {isActive && <CornerDownLeft className="size-3.5" style={{ color: "var(--fg-neutral-subtle)" }} />}
      </div>
    )
  }

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 data-[state=open]:animate-in data-[state=open]:fade-in-0" style={{ background: "var(--bg-scrim)" }} />
        <Dialog.Content
          onKeyDown={onKey}
          className="fixed left-1/2 top-[12vh] z-50 flex max-h-[70vh] w-[640px] max-w-[94vw] -translate-x-1/2 flex-col overflow-hidden rounded-xl shadow-xl outline-none data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-neutral-muted)" }}
        >
          <Dialog.Title className="sr-only">Search</Dialog.Title>
          <Dialog.Description className="sr-only">Search endpoints and locations</Dialog.Description>
          <div className="flex items-center gap-2.5 px-4" style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
            <Search className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} />
            <input
              autoFocus value={q} onChange={(e) => setQ(e.target.value)}
              placeholder="Search endpoints, locations…"
              className="h-12 min-w-px flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--fg-neutral-muted)]"
              style={{ color: "var(--fg-neutral-emphasis)" }}
            />
            <kbd className="rounded-sm px-1.5 py-0.5 text-xs font-medium" style={{ background: "var(--bg-neutral-subtle)", color: "var(--fg-neutral-muted)" }}>esc</kbd>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-2">
            {items.length === 0 && (
              <div className="px-3 py-10 text-center text-sm" style={{ color: "var(--fg-neutral-muted)" }}>No matches for “{q}”.</div>
            )}
            {locMatches.length > 0 && (
              <div className="px-2 pb-1 pt-2 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>Locations</div>
            )}
            {locMatches.map(Row)}
            {epMatches.length > 0 && (
              <div className="px-2 pb-1 pt-3 text-xs font-medium uppercase tracking-wide" style={{ color: "var(--fg-neutral-subtle)" }}>
                {q.trim() ? "Endpoints" : "Needs attention"}
              </div>
            )}
            {epMatches.map(Row)}
          </div>

          <div className="flex items-center gap-3 px-4 py-2 text-xs" style={{ borderTop: "1px solid var(--border-neutral-subtle)", color: "var(--fg-neutral-subtle)" }}>
            <span>↑ ↓ to navigate</span><span>↵ to select</span><span>esc to close</span>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
