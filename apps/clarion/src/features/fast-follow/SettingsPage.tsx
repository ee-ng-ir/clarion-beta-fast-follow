import { useState } from "react"
import { BellRing, Headphones, SlidersHorizontal, Waves, type LucideIcon } from "lucide-react"
import { ThresholdsPage } from "@/pages/ThresholdsPage"
import { cn } from "@/lib/utils"
import { ComingSoon } from "./ComingSoon"
import { NewTag } from "./ExploringTag"

/**
 * Settings: the new top-level home for everything an IT Admin configures in
 * Clarion. Thresholds used to be the dumping ground; it's now one section.
 * Hierarchy is still a draft (questions log X2).
 */
type SectionId = "alerts" | "notifications" | "stability" | "devices"

const SECTIONS: { id: SectionId; label: string; description: string; icon: LucideIcon; isNew?: boolean }[] = [
  { id: "alerts", label: "Alerts and thresholds", description: "Which alerts are on, and when an endpoint is flagged Warning or Critical.", icon: SlidersHorizontal },
  { id: "notifications", label: "Notifications", description: "Who's emailed about significant issues, and when.", icon: BellRing, isNew: true },
  { id: "stability", label: "Alert stability", description: "How long a problem must last before it's raised, and before it clears.", icon: Waves, isNew: true },
  { id: "devices", label: "Approved headsets", description: "The headset models your company approves.", icon: Headphones, isNew: true },
]

export function SettingsPage() {
  const [section, setSection] = useState<SectionId>("alerts")
  const current = SECTIONS.find((s) => s.id === section)!

  return (
    <div className="flex w-full flex-col gap-4 lg:flex-row lg:items-start">
      {/* Section list: a column on desktop, a scrolling row on small screens */}
      <nav
        aria-label="Settings sections"
        className="flex shrink-0 gap-1 overflow-x-auto lg:sticky lg:top-0 lg:w-56 lg:flex-col"
      >
        {SECTIONS.map(({ id, label, icon: Icon, isNew }) => {
          const active = id === section
          return (
            <button
              key={id}
              type="button"
              onClick={() => setSection(id)}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex h-9 shrink-0 items-center gap-2 rounded-md px-2.5 text-left text-sm transition-colors",
                !active && "hover:bg-[var(--bg-neutral-subtle-hovered)]",
              )}
              style={active ? { background: "var(--bg-selected-subtle)", color: "var(--fg-neutral-emphasis)" } : { color: "var(--fg-neutral-emphasis)" }}
            >
              <Icon className="size-4 shrink-0" style={{ color: active ? "var(--fg-primary-emphasis)" : "var(--fg-neutral-muted)" }} />
              <span className="truncate">{label}</span>
              {isNew && <NewTag className="ml-auto" />}
            </button>
          )
        })}
      </nav>

      <section className="flex min-w-0 flex-1 flex-col gap-4" aria-label={current.label}>
        {section === "alerts" && <ThresholdsPage />}
        {section === "notifications" && (
          <ComingSoon
            icon={BellRing}
            title="Notifications"
            body="Proactive emails to your service desk when an alert group is significant: a recipient list, rules for what counts as significant, and a cooldown. Send to IT routing moves here too."
            questions={["A7", "A8"]}
          />
        )}
        {section === "stability" && (
          <ComingSoon
            icon={Waves}
            title="Alert stability"
            body="Stops alerts popping up and clearing when a reading hovers around its threshold, such as weak Wi-Fi. Applies to the widget and Fleet-view alike."
            questions={["A1", "A2"]}
          />
        )}
        {section === "devices" && (
          <ComingSoon
            icon={Headphones}
            title="Approved headsets"
            body="Choose the headset models your company approves. Endpoints on other headsets are flagged for review; agents can keep using them."
            questions={["H1", "H2", "H5", "H6"]}
          />
        )}
      </section>
    </div>
  )
}
