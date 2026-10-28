import { adminNavSections, adminDocNavItems, type NavItem, type PageId } from "@/nav"

/**
 * Sidebar for the Administration experience. Same chrome as the Fleet sidebar
 * (top-left header switches org), listing the admin nav plus the shared
 * Product development docs. The Fleet ↔ Admin switch lives in the top-right
 * account menu.
 */
export function AdminSidebar({
  active,
  onNavigate,
}: {
  active: PageId
  onNavigate: (id: PageId) => void
}) {
  return (
    <aside className="flex h-full w-64 shrink-0 flex-col" style={{ background: "var(--bg-sidebar)" }}>
      {/* Header — Administration lives in Iris, so the brand is Iris alone (no tagline) on the IR watercolour banner */}
      <div
        className="relative flex h-20 shrink-0 items-end overflow-hidden rounded-tr-2xl"
        style={{ backgroundImage: "url('/sidebar-header.jpg')", backgroundSize: "cover", backgroundPosition: "center" }}
      >
        <span className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(to top, rgba(0,0,0,0.28), rgba(0,0,0,0) 55%)" }} />
        <div className="relative flex flex-col justify-center px-4 pb-3 leading-tight" style={{ fontFamily: "'Poppins', ui-sans-serif, sans-serif" }}>
          <span className="text-xl" style={{ fontFamily: "'Oswald', ui-sans-serif, sans-serif", fontWeight: 600, letterSpacing: "0.02em", textTransform: "uppercase", color: "#fff" }}>Iris</span>
        </div>
      </div>

      {/* Content — admin nav + shared docs */}
      <div className="flex-1 overflow-y-auto p-2">
        {adminNavSections.map((sec, i) => (
          <div key={sec.label} className={i ? "mt-3" : undefined}>
            <NavGroup label={sec.label} items={sec.items} active={active} onNavigate={onNavigate} />
          </div>
        ))}
        <div className="mt-3">
          <NavGroup label="Product development" items={adminDocNavItems} active={active} onNavigate={onNavigate} />
        </div>
      </div>

      {/* Footer */}
      <div className="flex flex-col gap-2 px-4 py-2">
        {/* IR logo, bottom-left (min 'i' height ≈20px per brand book) */}
        <div className="flex items-start p-2">
          <img src="/ir-logo.png" alt="Integrated Research" className="h-9 w-auto dark:hidden" />
          <img src="/ir-logo-white.png" alt="Integrated Research" className="hidden h-9 w-auto dark:block" />
        </div>
      </div>
    </aside>
  )
}

function NavGroup({
  label, items, active, onNavigate,
}: {
  label: string
  items: NavItem[]
  active: PageId
  onNavigate: (id: PageId) => void
}) {
  return (
    <>
      <div className="flex h-8 items-center px-2 text-xs font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
        {label}
      </div>
      <nav className="flex flex-col gap-1">
        {items.map(({ id, label: itemLabel, icon: Icon }) => {
          const isActive = id === active
          return (
            <button
              key={id}
              type="button"
              onClick={() => onNavigate(id)}
              className="relative flex h-8 w-full items-center gap-2 rounded-md p-2 text-left text-sm transition-colors"
              style={isActive
                ? { background: "var(--bg-selected-subtle)", color: "var(--fg-neutral-emphasis)" }
                : { color: "var(--fg-neutral-emphasis)" }}
              onMouseEnter={(e) => { if (!isActive) e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)" }}
              onMouseLeave={(e) => { if (!isActive) e.currentTarget.style.background = "transparent" }}
            >
              {isActive && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-full" style={{ background: "var(--border-focused)" }} />
              )}
              <Icon className="size-4 shrink-0" style={{ color: isActive ? "var(--fg-primary-emphasis)" : "var(--fg-neutral-muted)" }} />
              <span className="truncate">{itemLabel}</span>
            </button>
          )
        })}
      </nav>
    </>
  )
}
