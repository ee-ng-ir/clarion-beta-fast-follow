import { useSyncExternalStore } from "react"
import { feed, type FeedState } from "./feed"

/** Re-renders when any agent's reading changes, in this tab or another. */
export function useFeed(): FeedState {
  return useSyncExternalStore(feed.subscribe, feed.get, feed.get)
}
