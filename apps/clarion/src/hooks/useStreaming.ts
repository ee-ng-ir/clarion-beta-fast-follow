import { useEffect, useState } from "react"
import { fleetTotals, type FleetTotals } from "@/data/dashboard"

export interface LiveFleet extends FleetTotals {
  /** epoch ms of the last "stream" refresh; the sidebar derives "Ns ago" from this */
  lastRefreshAt: number
}

const REFRESH_EVERY = 30_000 // ms

/**
 * Simulates a live data stream: every REFRESH_EVERY the online-endpoint count and
 * Clarion Network Score jitter slightly.
 *
 * NOTE: this hook only re-renders its consumer on an actual refresh (every 30s) —
 * NOT once per second. The per-second "streaming Ns ago" counter is owned locally
 * by the Sidebar so the whole app tree isn't reconciled every tick.
 */
export function useStreaming(): LiveFleet {
  const base = fleetTotals()
  const [stream, setStream] = useState({ offline: 0, score: 0, lastRefreshAt: Date.now() })

  useEffect(() => {
    const id = setInterval(() => {
      setStream({
        offline: Math.floor(Math.random() * 12),
        score: Math.round((Math.random() - 0.5) * 3), // CNS jitter on a 0–100 scale
        lastRefreshAt: Date.now(),
      })
    }, REFRESH_EVERY)
    return () => clearInterval(id)
  }, [])

  return {
    ...base,
    // `offline` is how many of the fleet aren't reporting, so online can only dip
    // BELOW total — never exceed it.
    online: Math.max(0, Math.min(base.endpoints, base.online - stream.offline)),
    score: Math.round(Math.min(100, Math.max(0, base.score + stream.score))),
    lastRefreshAt: stream.lastRefreshAt,
  }
}
