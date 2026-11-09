import { Card, CardContent, EmptyState, type IllustrationName } from "@ir/ui"
import { ExploringTag } from "./ExploringTag"

/** Placeholder for a Fast Follow section that is designed but not built yet in the demo. */
export function ComingSoon({
  illustration, title, body, exploring = false, questions = [],
}: {
  illustration: IllustrationName
  title: string
  body: string
  exploring?: boolean
  /** IDs from the design questions log that shape this section */
  questions?: string[]
}) {
  return (
    <Card>
      <CardContent>
        <EmptyState
          illustration={illustration}
          title={title}
          description={body}
          action={
            exploring || questions.length ? (
              <span className="flex flex-wrap items-center justify-center gap-2 text-body-xs text-content-neutral-muted">
                {exploring && <ExploringTag />}
                {questions.length > 0 && <>Open questions: {questions.join(", ")}</>}
              </span>
            ) : undefined
          }
        />
      </CardContent>
    </Card>
  )
}
