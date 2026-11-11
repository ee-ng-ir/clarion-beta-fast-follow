import { DatePicker, SegmentedControl, SegmentedControlItem } from "@ir/ui"
import { dayDate, fromIsoDay, historyStart, isoDay, rangeOfLast, type DayRange } from "./data"

/**
 * The period a dashboard covers: the presets, plus Custom for a From and To of
 * your own (PO, 11 Nov). Investigating one incident needs its exact window;
 * presets blur it. A custom period is kept as dates, so a saved dashboard opens
 * on the same days; a preset keeps counting back from today.
 * Custom starts on whatever the preset covered, and is limited to the history.
 */
export function PeriodControl({ presets, days, range, onPreset, onRange, presetLabel }: {
  presets: number[]
  days: number
  range?: DayRange
  onPreset: (days: number) => void
  onRange: (range: DayRange) => void
  presetLabel: (days: number) => string
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SegmentedControl aria-label="Period" value={range ? "custom" : String(days)}
        onValueChange={(v) => { if (!v) return; if (v === "custom") onRange(range ?? rangeOfLast(days)); else onPreset(Number(v)) }}>
        {presets.map((d) => <SegmentedControlItem key={d} value={String(d)}>{presetLabel(d)}</SegmentedControlItem>)}
        <SegmentedControlItem value="custom">Custom</SegmentedControlItem>
      </SegmentedControl>
      {range && (
        <DatePicker mode="range" className="w-60"
          value={{ from: fromIsoDay(range.from), to: fromIsoDay(range.to) }}
          onValueChange={(r) => { if (r?.from) onRange({ from: isoDay(r.from), to: isoDay(r.to ?? r.from) }) }}
          calendarProps={{ disabled: [{ before: historyStart() }, { after: dayDate(0) }], defaultMonth: fromIsoDay(range.from) }} />
      )}
    </div>
  )
}
