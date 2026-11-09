import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ir/ui"
import { ThresholdsPage } from "@/pages/ThresholdsPage"
import { ComingSoon } from "./ComingSoon"
import { NewDot } from "./ExploringTag"
import { AlertTypesSection } from "./settings/AlertTypesSection"
import { NotificationsSection } from "./settings/NotificationsSection"
import { StabilitySection } from "./settings/StabilitySection"

/**
 * Settings: the top-level home for everything an IT Admin configures in Clarion.
 * Thresholds used to be the dumping ground; it's now one section. Sections are
 * sibling views of the same object, so they're Picasso Tabs. Hierarchy is still
 * a draft (questions log X2). Thresholds is the existing Clarion page (not yet
 * on Picasso: questions log P2).
 */
export function SettingsPage() {
  const [tab, setTab] = useState("types")
  return (
    <Tabs value={tab} onValueChange={setTab} className="flex w-full flex-col gap-4">
      <TabsList aria-label="Settings sections">
        <TabsTrigger value="types">Alert types <NewDot className="ms-1.5" /></TabsTrigger>
        <TabsTrigger value="thresholds">Thresholds</TabsTrigger>
        <TabsTrigger value="notifications">Notifications <NewDot className="ms-1.5" /></TabsTrigger>
        <TabsTrigger value="stability">Alert stability <NewDot className="ms-1.5" /></TabsTrigger>
        <TabsTrigger value="devices">Approved headsets <NewDot className="ms-1.5" /></TabsTrigger>
      </TabsList>
      <TabsContent value="types"><AlertTypesSection onEditThresholds={() => setTab("thresholds")} /></TabsContent>
      <TabsContent value="thresholds"><ThresholdsPage /></TabsContent>
      <TabsContent value="notifications"><NotificationsSection /></TabsContent>
      <TabsContent value="stability"><StabilitySection /></TabsContent>
      <TabsContent value="devices">
        <ComingSoon illustration="call-readiness" title="Approved headsets"
          body="Choose the headset models your company approves. Endpoints on other headsets are flagged for review; agents can keep using them."
          questions={["H1", "H2", "H5", "H6"]} />
      </TabsContent>
    </Tabs>
  )
}
