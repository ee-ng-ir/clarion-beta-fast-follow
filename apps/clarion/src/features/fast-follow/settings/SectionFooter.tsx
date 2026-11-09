import { Alert, AlertDescription, Button, PageFooter } from "@ir/ui"

/** Picasso form footer: who last saved it, then Discard (outline) and the primary, last. */
export function SectionFooter({ saved, dirty, onDiscard, onSave, saveLabel, extra, confirmation }: {
  saved: string; dirty: boolean; onDiscard: () => void; onSave: () => void; saveLabel: string; extra?: React.ReactNode
  /** shown after a save until the next edit, so it's unmistakable that it landed */
  confirmation?: string | null
}) {
  return (
    <>
    {confirmation && !dirty && (
      <Alert variant="success" role="status">
        <AlertDescription>{confirmation}</AlertDescription>
      </Alert>
    )}
    <PageFooter>
      <span className="me-auto text-body-sm text-content-neutral-muted">{dirty ? "Unsaved changes" : saved}</span>
      {extra}
      <Button variant="outline" disabled={!dirty} onClick={onDiscard}>Discard</Button>
      <Button disabled={!dirty} onClick={onSave}>{saveLabel}</Button>
    </PageFooter>
    </>
  )
}
