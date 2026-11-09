import { Sparkles } from "lucide-react"
import { pageLabel, type PageId } from "@/nav"
import { openIris, closeIris, useIris } from "./store"

/** Top-bar entry point. Opens Iris already looking at the current page. */
export function AskIrisButton({ page }: { page: PageId }) {
  const { open } = useIris()
  return (
    <button
      type="button"
      aria-pressed={open}
      aria-label="Ask Iris"
      onClick={() => (open ? closeIris() : openIris({ kind: "page", page, label: pageLabel(page) }))}
      className="inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium transition-colors"
      style={open
        ? { background: "var(--bg-primary-emphasis)", color: "var(--fg-on-primary-emphasis)" }
        : { background: "var(--bg-primary-subtle)", color: "var(--fg-on-primary-subtle)" }}
    >
      <Sparkles className="size-4" aria-hidden />
      <span className="hidden sm:inline">Ask Iris</span>
    </button>
  )
}
