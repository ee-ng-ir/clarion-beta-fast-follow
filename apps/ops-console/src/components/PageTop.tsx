import type * as React from "react"
import { PageHeader } from "@ir/ui"

/**
 * Picasso's PageHeader with the page's primary actions beside it. PageHeader
 * has no actions slot yet (on purpose, see its notes), so this lays the two
 * side by side and keeps PageHeader's own rule under both.
 */
export function PageTop({ title, description, actions, meta }: {
  title: React.ReactNode
  description?: React.ReactNode
  actions?: React.ReactNode
  /** Small status line under the title (account status, last updated…). */
  meta?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 border-b border-line-neutral-muted pb-4">
      <div className="flex min-w-0 flex-col gap-2">
        <PageHeader title={title} description={description} divider={false} />
        {meta ? <div className="flex flex-wrap items-center gap-2 text-body-sm text-content-neutral-muted">{meta}</div> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  )
}
