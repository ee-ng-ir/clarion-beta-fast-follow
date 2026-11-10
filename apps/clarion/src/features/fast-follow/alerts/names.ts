import type { AlertType } from "./catalogue"

/** One plain name per kind of alert (Settings › Alerts, off notices). Platforms go by the platform's name. */
const SHORT_NAME: Record<string, string> = {
  "call-quality": "Call quality", wifi: "Wi-Fi signal", cpu: "CPU", memory: "Memory",
  storage: "Storage space", battery: "Battery", "audio-device": "Headset and audio devices",
}
export const alertName = (t: AlertType) => (t.category === "platform" ? t.id.replace(/^platform:/, "") : SHORT_NAME[t.id] ?? t.warning)

/**
 * The alert's name in lists and pickers (dashboards, Iris answers): the agent-facing
 * Warning name, except platforms, which go by the platform alone ("Zoom", not
 * "Zoom call quality may be reduced"); their category already says they're platforms.
 */
export const listName = (t: AlertType) => (t.category === "platform" ? t.id.replace(/^platform:/, "") : t.warning)
