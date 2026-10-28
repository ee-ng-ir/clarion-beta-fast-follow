// The demo agents. Each one is a person running the Clarion widget on their own
// machine, and the same machine appears as an endpoint in the Clarion dashboard.
// `endpointId` points at a healthy endpoint the dashboard generates, so with no
// widget activity the dashboard looks exactly as it always did.

export interface DemoAgent {
  id: string
  name: string
  email: string
  loginId: string
  /** Shown in the widget and as the endpoint's machine name in Clarion. */
  machine: string
  /** Clarion dashboard endpoint this agent's machine is. */
  endpointId: string
  /** Clarion dashboard location id + display name. */
  locationId: string
  locationName: string
  team: string
  headset: string
}

export const agents: DemoAgent[] = [
  { id: "jordan", name: "Jordan Lee", email: "jordan.lee@acme.com", loginId: "acme\\jordan.lee", machine: "DESKTOP-SYD-0423",
    endpointId: "sydney-423", locationId: "sydney", locationName: "Sydney", team: "Customer Support · Tier 1", headset: "Jabra Evolve2 75" },
  { id: "maria", name: "Maria Santos", email: "maria.santos@acme.com", loginId: "acme\\maria.santos", machine: "DESKTOP-MNL-0471",
    endpointId: "manilla-471", locationId: "manilla", locationName: "Manila CC", team: "Customer Support · Tier 2", headset: "Poly Voyager 4320" },
  { id: "tom", name: "Tom Walsh", email: "tom.walsh@acme.com", loginId: "acme\\tom.walsh", machine: "DESKTOP-LDN-0425",
    endpointId: "london-425", locationId: "london", locationName: "London HQ", team: "Retentions", headset: "Jabra Evolve2 65" },
  { id: "aisha", name: "Aisha Khan", email: "aisha.khan@acme.com", loginId: "acme\\aisha.khan", machine: "DESKTOP-NYC-0435",
    endpointId: "newyork-435", locationId: "newyork", locationName: "New York", team: "Sales", headset: "Logitech Zone Vibe 100" },
]

export const agentById = (id: string) => agents.find((a) => a.id === id)
export const agentByEndpoint = (endpointId: string) => agents.find((a) => a.endpointId === endpointId)
