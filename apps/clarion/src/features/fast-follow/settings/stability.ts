import type { Stability } from "./store"

export const PRESETS: Record<Stability, { label: string; raise: number; clear: number; margin: number; words: string }> = {
  sensitive: { label: "Sensitive", raise: 1, clear: 1, margin: 0, words: "Raised the first minute a reading is past its threshold, cleared the first minute it's back. Most alerts, most noise." },
  balanced: { label: "Balanced", raise: 3, clear: 3, margin: 5, words: "Raised after 3 minutes past the threshold. Cleared after 3 minutes back inside it by at least 5 points. IR's default." },
  calm: { label: "Calm", raise: 5, clear: 5, margin: 8, words: "Raised after 5 minutes past the threshold. Cleared after 5 minutes back inside it by at least 8 points. Fewest alerts; real problems surface a little later." },
}

const WARN = 50

/** How many alerts a preset raises on a series: consecutive readings to raise, and to clear past a margin. */
export function countAlerts(series: number[], p: { raise: number; clear: number; margin: number }, threshold = WARN) {
  let alerting = false, below = 0, recovered = 0, raised = 0
  for (const v of series) {
    if (!alerting) {
      below = v < threshold ? below + 1 : 0
      if (below >= p.raise) { alerting = true; raised++; recovered = 0 }
    } else {
      recovered = v >= threshold + p.margin ? recovered + 1 : 0
      if (recovered >= p.clear) { alerting = false; below = 0 }
    }
  }
  return raised
}

