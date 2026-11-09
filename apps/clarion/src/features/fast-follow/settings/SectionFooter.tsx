import { Button, PageFooter } from "@ir/ui"

/** Picasso form footer: who last saved it, then Discard (outline) and the primary, last. */
export function SectionFooter({ saved, dirty, onDiscard, onSave, saveLabel, extra }: {
  saved: string; dirty: boolean; onDiscard: () => void; onSave: () => void; saveLabel: string; extra?: React.ReactNode
}) {
  return (
    <PageFooter>
      <span className="me-auto text-body-sm text-content-neutral-muted">{dirty ? "Unsaved changes" : saved}</span>
      {extra}
      <Button variant="outline" disabled={!dirty} onClick={onDiscard}>Discard</Button>
      <Button disabled={!dirty} onClick={onSave}>{saveLabel}</Button>
    </PageFooter>
  )
}
