import { SearchX } from "lucide-react"
import { Button, EmptyState } from "@ir/ui"
import { Link } from "@/components/ui"

export function NotFoundPage({ what = "page" }: { what?: string }) {
  return (
    <EmptyState
      icon={<SearchX />}
      title={`That ${what} doesn't exist`}
      description={what === "tenant" ? "It may have been removed. Search the tenant list instead." : "Check the address, or pick a page from the sidebar."}
      action={<Button variant="outline" asChild><Link to="/tenants">Go to tenants</Link></Button>}
      className="py-16"
    />
  )
}
