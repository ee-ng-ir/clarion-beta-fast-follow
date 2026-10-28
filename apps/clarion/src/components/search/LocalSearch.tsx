import { useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { Search, X } from "lucide-react"

// lightweight fuzzy: all query chars must appear in order; contiguous runs score higher
function fuzzyScore(text: string, q: string): number | null {
  const t = text.toLowerCase()
  const query = q.toLowerCase().trim()
  if (!query) return 0
  let ti = 0, score = 0, streak = 0
  for (const ch of query) {
    const idx = t.indexOf(ch, ti)
    if (idx === -1) return null
    streak = idx === ti ? streak + 1 : 0
    score += 1 + streak
    ti = idx + 1
  }
  return score - t.length * 0.01
}

export function LocalSearch<T>({
  placeholder,
  data,
  toText,
  renderRow,
  onSelect,
  className,
}: {
  placeholder: string
  data: T[]
  toText: (item: T) => string
  renderRow: (item: T, active: boolean) => ReactNode
  onSelect: (item: T) => void
  className?: string
}) {
  const [q, setQ] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const blur = useRef<ReturnType<typeof setTimeout> | null>(null)

  const results = useMemo(() => {
    if (!q.trim()) return [] as T[]
    return data
      .map((d) => ({ d, s: fuzzyScore(toText(d), q) }))
      .filter((x) => x.s !== null)
      .sort((a, b) => (b.s as number) - (a.s as number))
      .slice(0, 8)
      .map((x) => x.d)
  }, [q, data, toText])

  useEffect(() => setActive(0), [q])

  const pick = (item: T) => {
    onSelect(item)
    setQ("")
    setOpen(false)
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(results.length - 1, a + 1)) }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)) }
    if (e.key === "Enter" && results[active]) { e.preventDefault(); pick(results[active]) }
    if (e.key === "Escape") { setOpen(false) }
  }

  const showDropdown = open && q.trim().length > 0

  return (
    <div className={"relative " + (className ?? "w-full sm:max-w-xs")}>
      <div className="flex h-9 w-full items-center gap-1.5 rounded-lg px-2.5" style={{ background: "var(--bg-input-default)", border: "1px solid var(--border-input-default)" }}>
        <Search className="size-4 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          onBlur={() => { blur.current = setTimeout(() => setOpen(false), 120) }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          className="min-w-px flex-1 bg-transparent text-sm outline-none placeholder:text-[var(--fg-neutral-muted)]"
          style={{ color: "var(--fg-neutral-emphasis)" }}
        />
        {q && (
          <button type="button" aria-label="Clear search" onMouseDown={(e) => e.preventDefault()} onClick={() => setQ("")} className="flex size-5 shrink-0 items-center justify-center rounded-sm hover:bg-[var(--bg-neutral-subtle-hovered)]" style={{ color: "var(--fg-neutral-muted)" }}>
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {showDropdown && (
        <div
          className="absolute left-0 right-0 top-[calc(100%+4px)] z-40 overflow-hidden rounded-xl shadow-lg"
          style={{ background: "var(--bg-overlay)", border: "1px solid var(--border-neutral-muted)" }}
          onMouseEnter={() => { if (blur.current) clearTimeout(blur.current) }}
        >
          {results.length === 0 ? (
            <div className="px-3 py-6 text-center text-sm" style={{ color: "var(--fg-neutral-muted)" }}>No matches for “{q}”.</div>
          ) : (
            <div className="max-h-[320px] overflow-y-auto p-1">
              {results.map((item, i) => (
                <button
                  key={i}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => pick(item)}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left transition-colors"
                  style={{ background: i === active ? "var(--bg-neutral-subtle-hovered)" : "transparent" }}
                >
                  {renderRow(item, i === active)}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
