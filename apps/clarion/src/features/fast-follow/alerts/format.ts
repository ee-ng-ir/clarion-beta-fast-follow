export function ago(min: number): string {
  if (min <= 0) return "just now"
  if (min < 60) return `${min} min ago`
  const h = Math.floor(min / 60)
  if (h < 24) return `${h} h ago`
  return `${Math.floor(h / 24)} d ago`
}
export function duration(min: number): string {
  if (min < 60) return `${min} min`
  const h = Math.floor(min / 60), m = min % 60
  return m ? `${h} h ${m} min` : `${h} h`
}
/** "Sydney (138), Melbourne (4)" — at most `n` locations, then "+2 more" */
export function whereLine(locs: { name: string; count: number }[], n = 2): string {
  const shown = locs.slice(0, n).map((l) => `${l.name} (${l.count})`).join(", ")
  return locs.length > n ? `${shown} +${locs.length - n} more` : shown
}
