import type { LucideIcon } from "lucide-react"
import { Card } from "@/components/ui/card"
import { ExploringTag } from "./ExploringTag"

/** Placeholder for a Fast Follow section that is designed but not built yet in the demo. */
export function ComingSoon({
  icon: Icon, title, body, exploring = false, questions = [],
}: {
  icon: LucideIcon
  title: string
  body: string
  exploring?: boolean
  /** IDs from the design questions log that shape this section */
  questions?: string[]
}) {
  return (
    <Card className="w-full items-start gap-3 rounded-xl p-6">
      <div className="flex size-9 items-center justify-center rounded-lg" style={{ background: "var(--bg-neutral-subtle)" }}>
        <Icon className="size-4" style={{ color: "var(--fg-neutral-muted)" }} />
      </div>
      <div className="flex items-center gap-2">
        <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{title}</h2>
        {exploring && <ExploringTag />}
      </div>
      <p className="max-w-prose text-sm" style={{ color: "var(--fg-neutral-muted)" }}>{body}</p>
      {questions.length > 0 && (
        <p className="text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>
          Open questions: {questions.join(", ")}
        </p>
      )}
    </Card>
  )
}
