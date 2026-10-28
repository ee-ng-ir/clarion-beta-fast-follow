import { EndpointsTable } from "@/components/endpoints/EndpointsTable"
import type { Endpoint } from "@/data/endpoints"

export function EndpointsPage({
  locationIds,
  onLocationsChange,
  onOpenEndpoint,
  openEndpointId,
}: {
  locationIds: string[]
  onLocationsChange: (ids: string[]) => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
  openEndpointId?: string | null
}) {
  return (
    <EndpointsTable
      locationIds={locationIds}
      onLocationsChange={onLocationsChange}
      onOpenEndpoint={onOpenEndpoint}
      openEndpointId={openEndpointId}
    />
  )
}
