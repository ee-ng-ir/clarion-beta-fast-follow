import { useState } from "react"
import { CalendarDays } from "lucide-react"
import type { DateRange } from "react-day-picker"
import { Button, Calendar, InputButton, Popover, PopoverContent, PopoverTrigger, SegmentedControl, SegmentedControlItem } from "@ir/ui"
import { dayDate, fmtDay, fmtRange, fromIsoDay, historyStart, isoDay, rangeOfLast, type DayRange } from "./data"

const rangeText = (r: DayRange) => {
  const to = fromIsoDay(r.to)
  return `${fmtDay(fromIsoDay(r.from))} – ${fmtDay(to)} ${to.getFullYear()}`
}

/**
 * The period a dashboard covers, as one Picasso InputButton: "Last 30 days ·
 * 12 Oct – 10 Nov", or the dates of a custom range. Its Popover holds the
 * presets as a SegmentedControl and, for Custom, a Calendar (PO, 11 Nov:
 * investigating one incident needs its exact window). Replaces a segmented
 * control plus a second date field, which pushed the filter bar onto three rows.
 * Picasso components only, composed; nothing restyled.
 *
 * A preset is a whole answer, so it applies and closes. A custom range is a
 * draft until Apply, the same contract as Picasso's Select. A custom period is
 * kept as dates, so a saved dashboard opens on the same days; a preset keeps
 * counting back from today. The calendar is limited to the history Clarion holds.
 */
export function PeriodControl({ presets, days, range, onPreset, onRange, presetLabel }: {
  presets: number[]
  days: number
  range?: DayRange
  onPreset: (days: number) => void
  onRange: (range: DayRange) => void
  presetLabel: (days: number) => string
}) {
  const [open, setOpen] = useState(false)
  const [custom, setCustom] = useState(!!range)
  const [draft, setDraft] = useState<DateRange | undefined>()
  const current = range ?? rangeOfLast(days)

  const openChange = (next: boolean) => {
    if (next) { setCustom(!!range); setDraft({ from: fromIsoDay(current.from), to: fromIsoDay(current.to) }) }
    setOpen(next)
  }
  const choose = (v: string) => {
    if (!v) return
    if (v === "custom") { setCustom(true); return }
    onPreset(Number(v))
    setOpen(false)
  }
  const apply = () => {
    if (!draft?.from) return
    onRange({ from: isoDay(draft.from), to: isoDay(draft.to ?? draft.from) })
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={openChange}>
      <PopoverTrigger asChild>
        <InputButton size="sm" className="w-auto" aria-label="Period" icon={<CalendarDays />}
          value={range ? rangeText(range) : `${presetLabel(days)} · ${fmtRange(days)}`} />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto">
        <SegmentedControl size="sm" aria-label="Period" value={custom ? "custom" : String(days)} onValueChange={choose}>
          {presets.map((d) => <SegmentedControlItem key={d} value={String(d)}>{presetLabel(d)}</SegmentedControlItem>)}
          <SegmentedControlItem value="custom">Custom</SegmentedControlItem>
        </SegmentedControl>
        {custom && (
          <>
            <Calendar mode="range" selected={draft} onSelect={setDraft} defaultMonth={draft?.from ?? fromIsoDay(current.from)}
              disabled={[{ before: historyStart() }, { after: dayDate(0) }]} />
            <div className="flex justify-end gap-2">
              <Button variant="ghost" size="sm" onClick={() => setOpen(false)}>Cancel</Button>
              <Button size="sm" disabled={!draft?.from} onClick={apply}>Apply dates</Button>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  )
}
