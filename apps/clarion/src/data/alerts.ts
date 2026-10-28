// Real-time ALERT notifications (distinct from Issues): ephemeral events that
// surface on the bell. An alert raises/updates an Issue and links to its area.

export type AlertSeverity = "critical" | "warning" | "info"
export type AlertNavTo = "issues" | "endpoints"

export interface AlertNotification {
  id: string
  severity: AlertSeverity
  /** the alert TYPE — used for "mute this type of alert" */
  type: string
  title: string
  detail: string
  minutesAgo: number
  read: boolean
  /** where clicking the alert takes the user */
  navTo: AlertNavTo
  locationId?: string
}

export const initialAlerts: AlertNotification[] = [
  { id: "n1", severity: "critical", type: "Platform outage", title: "Genesys Cloud unreachable", detail: "Manila CC · 23 endpoints", minutesAgo: 2, read: false, navTo: "issues", locationId: "manilla" },
  { id: "n2", severity: "critical", type: "High latency", title: "Latency spike detected", detail: "New York · 12 endpoints", minutesAgo: 6, read: false, navTo: "issues", locationId: "newyork" },
  { id: "n3", severity: "warning", type: "Network jitter", title: "Jitter rising", detail: "Cebu · 8 endpoints", minutesAgo: 14, read: false, navTo: "issues", locationId: "cebu" },
  { id: "n4", severity: "warning", type: "Packet loss", title: "Packet loss elevated", detail: "Bangalore · 5 endpoints", minutesAgo: 23, read: true, navTo: "issues", locationId: "bangalore" },
  { id: "n5", severity: "info", type: "Recovery", title: "Endpoint back online", detail: "DESKTOP-LDN-0431 · London HQ", minutesAgo: 41, read: true, navTo: "endpoints", locationId: "london" },
]

// Pool of incoming alerts used to simulate real-time arrivals.
export const incomingAlerts: Omit<AlertNotification, "id" | "read" | "minutesAgo">[] = [
  { severity: "critical", type: "Platform outage", title: "Webex degraded", detail: "Cebu · 11 endpoints", navTo: "issues", locationId: "cebu" },
  { severity: "warning", type: "High latency", title: "Latency climbing", detail: "Bangalore · 7 endpoints", navTo: "issues", locationId: "bangalore" },
  { severity: "critical", type: "Packet loss", title: "Packet loss critical", detail: "Manila CC · 19 endpoints", navTo: "issues", locationId: "manilla" },
  { severity: "info", type: "Recovery", title: "Endpoint reconnected", detail: "DESKTOP-SYD-0512 · Sydney", navTo: "endpoints", locationId: "sydney" },
  { severity: "warning", type: "Network jitter", title: "Jitter threshold breached", detail: "Austin · 4 endpoints", navTo: "issues", locationId: "austin" },
  { severity: "critical", type: "High latency", title: "Severe latency", detail: "New York · 9 endpoints", navTo: "issues", locationId: "newyork" },
]

export const MUTE_DURATIONS = [
  { label: "1 hour", value: "1h" },
  { label: "8 hours", value: "8h" },
  { label: "24 hours", value: "24h" },
]
