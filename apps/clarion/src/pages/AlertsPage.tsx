import { AlertsTable } from "@/components/alerts/AlertsTable"
import type { Rollup } from "@/data/endpoints"

export function AlertsPage({
  locationId,
  onLocationChange,
  onOpenAlert,
  openAlertId,
}: {
  locationId: string
  onLocationChange: (id: string) => void
  onOpenAlert: (rollups: Rollup[], index: number) => void
  openAlertId?: string | null
}) {
  return (
    <AlertsTable locationId={locationId} onLocationChange={onLocationChange} onOpenAlert={onOpenAlert} openAlertId={openAlertId} />
  )
}
