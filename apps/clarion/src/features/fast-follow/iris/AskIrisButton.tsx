import { Chip } from "@ir/ui"
import { pageLabel, type PageId } from "@/nav"
import { openIris, closeIris, useIris } from "./store"
import { IrisMark } from "./IrisMark"

/**
 * Iris's entry point, as Picasso's AI chip (a Chip led by the Iris mark),
 * beside the page title rather than in the top bar: the App shell keeps the
 * top bar to the toggle and the breadcrumb. Opens Iris already looking at
 * this page. Never `selected` — Picasso's AI chip is an action, not a toggle.
 */
export function AskIrisButton({ page }: { page: PageId }) {
  const { open } = useIris()
  return (
    <Chip
      aria-expanded={open}
      onClick={() => (open ? closeIris() : openIris({ kind: "page", page, label: pageLabel(page) }))}
      className="shrink-0"
    >
      <IrisMark />
      Ask Iris about this page
    </Chip>
  )
}
