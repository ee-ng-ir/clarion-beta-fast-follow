import type { LucideIcon } from "lucide-react"
import { Badge, Card, EmptyState } from "@ir/ui"

/** A not-yet-built Administration section. Picasso's EmptyState in a Card. */
export function PlaceholderPage({
  title,
  icon: Icon,
  description,
}: {
  title: string
  icon: LucideIcon
  description: string
}) {
  return (
    <Card className="w-full py-10">
      <EmptyState
        icon={<Icon />}
        title={title}
        description={description}
        action={<Badge>Coming soon</Badge>}
      />
    </Card>
  )
}
