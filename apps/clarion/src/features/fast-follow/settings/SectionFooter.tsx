import { Alert, AlertDescription, Button, PageFooter } from "@ir/ui"

/** Picasso form footer, kept in view: who last saved it, then Discard (outline) and the primary, last. */
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
    {/* Sticky so Save is always in view on a long tab. Picasso's PageFooter doesn't stick
        (its docs say a sticky bar isn't built yet): logged as a Picasso gap. */}
    <PageFooter className="sticky -bottom-4 z-10 -mb-4 bg-surface-app pb-4">
      <span className="me-auto flex items-center gap-2 text-body-sm text-content-neutral-muted">
        {dirty && <span className="size-2 shrink-0 rounded-full bg-status-warning" aria-hidden />}
        {dirty ? <span className="text-label-md text-content-neutral-emphasis">Unsaved changes</span> : saved}
      </span>
      {extra}
      {/* only when there's something to save: disabled buttons at rest are just clutter */}
      {dirty && (
        <>
          <Button variant="outline" onClick={onDiscard}>Discard</Button>
          <Button onClick={onSave}>{saveLabel}</Button>
        </>
      )}
    </PageFooter>
    </>
  )
}
