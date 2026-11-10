import { Sparkles } from "lucide-react"
import { Button } from "@ir/ui"
import { pageLabel, type PageId } from "@/nav"
import { openIris, closeIris, useIris } from "./store"

/** Top-bar entry point, quiet like the icons beside it (ghost; secondary while open). Opens Iris already looking at the current page. */
export function AskIrisButton({ page }: { page: PageId }) {
  const { open } = useIris()
  return (
    <Button
      variant={open ? "secondary" : "ghost"}
      size="sm"
      aria-pressed={open}
      aria-label="Ask Iris"
      onClick={() => (open ? closeIris() : openIris({ kind: "page", page, label: pageLabel(page) }))}
    >
      <Sparkles aria-hidden />
      <span className="hidden sm:inline">Ask Iris</span>
    </Button>
  )
}
