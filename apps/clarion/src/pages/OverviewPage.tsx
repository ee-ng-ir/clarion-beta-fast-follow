import { useState } from "react"
import { StatsStrip } from "@/components/dashboard/StatsStrip"
import { MapAndLocations } from "@/components/dashboard/MapAndLocations"
import { TopIssuesCard } from "@/features/fast-follow/alerts/TopIssuesCard"
import { locationById } from "@/data/dashboard"
import type { LiveFleet } from "@/hooks/useStreaming"
import type { Endpoint } from "@/data/endpoints"

export function OverviewPage({
  live,
  selectedId,
  onSelect,
  onViewEndpoints,
  onOpenAlertGroup,
  onViewAlerts,
}: {
  live: LiveFleet
  selectedId: string
  onSelect: (id: string) => void
  onViewEndpoints: (loc?: string | string[]) => void
  onOpenEndpoint?: (rows: Endpoint[], index: number) => void
  openEndpointId?: string | null
  onOpenAlertGroup: (id: string) => void
  onViewAlerts: () => void
}) {
  // The drilled-into country is the map's scope (used only by the map now).
  const [country, setCountry] = useState<string | null>(() => {
    const loc = selectedId === "all" ? undefined : locationById(selectedId)
    return loc?.countryId ?? null
  })

  return (
    <div className="flex flex-col gap-4">
      <StatsStrip live={live} />
      <MapAndLocations
        selectedId={selectedId}
        onSelect={onSelect}
        country={country}
        onCountryChange={setCountry}
        onViewEndpoints={onViewEndpoints}
      />
      {/* Fast Follow: Top issues replaces "Endpoints needing attention" */}
      <TopIssuesCard onOpenGroup={onOpenAlertGroup} onViewAll={onViewAlerts} />
    </div>
  )
}
