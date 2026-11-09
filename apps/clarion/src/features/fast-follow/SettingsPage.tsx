import { Tabs, TabsContent, TabsList, TabsTrigger } from "@ir/ui"
import { ThresholdsPage } from "@/pages/ThresholdsPage"
import { ComingSoon } from "./ComingSoon"
import { NewDot } from "./ExploringTag"

/**
 * Settings: the top-level home for everything an IT Admin configures in Clarion.
 * Thresholds used to be the dumping ground; it's now one section. Sections are
 * sibling views of the same object, so they're Picasso Tabs. Hierarchy is still
 * a draft (questions log X2).
 */
export function SettingsPage() {
  return (
    <Tabs defaultValue="alerts" className="flex w-full flex-col gap-4">
      <TabsList aria-label="Settings sections">
        <TabsTrigger value="alerts">Alerts and thresholds</TabsTrigger>
        <TabsTrigger value="notifications">Notifications <NewDot className="ms-1.5" /></TabsTrigger>
        <TabsTrigger value="stability">Alert stability <NewDot className="ms-1.5" /></TabsTrigger>
        <TabsTrigger value="devices">Approved headsets <NewDot className="ms-1.5" /></TabsTrigger>
      </TabsList>
      <TabsContent value="alerts"><ThresholdsPage /></TabsContent>
      <TabsContent value="notifications">
        <ComingSoon illustration="issue-alerts" title="Notifications"
          body="Proactive emails to your service desk when an alert group is significant: a recipient list, rules for what counts, and a cooldown. Send to IT routing moves here too."
          questions={["A7", "A8"]} />
      </TabsContent>
      <TabsContent value="stability">
        <ComingSoon illustration="fleet-health" title="Alert stability"
          body="Stops alerts popping up and clearing when a reading hovers around its threshold, such as weak Wi-Fi. Applies to the widget and Fleet-view alike."
          questions={["A1", "A2"]} />
      </TabsContent>
      <TabsContent value="devices">
        <ComingSoon illustration="call-readiness" title="Approved headsets"
          body="Choose the headset models your company approves. Endpoints on other headsets are flagged for review; agents can keep using them."
          questions={["H1", "H2", "H5", "H6"]} />
      </TabsContent>
    </Tabs>
  )
}
