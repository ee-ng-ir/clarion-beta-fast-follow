import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import type { Series } from "./evidence"

/**
 * How a reading developed around the alert: warning and critical thresholds as
 * dashed lines, the moment the alert was raised marked. Fixed height, never an
 * aspect ratio (Picasso App shell: charts stay 240–320 high; 220 in a drawer).
 */
export function TrendChart({ s, raisedAt, tone = "var(--fg-info-emphasis)" }: { s: Series; raisedAt: number; tone?: string }) {
  const label = (t: number) => (t === 0 ? "Now" : Math.abs(t) >= 90 ? `${Math.round(Math.abs(t) / 60 * 10) / 10} h ago` : `${Math.abs(t)} min ago`)
  const ticks = [s.points[0].t, Math.round(s.points[0].t / 2), 0]
  return (
    <figure className="flex flex-col gap-1">
      <figcaption className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>{s.name}</figcaption>
      <div className="h-[220px] w-full" role="img" aria-label={`${s.name}: from ${s.points[0].v}${s.unit} to ${s.points[s.points.length - 1].v}${s.unit}. Warning threshold ${s.warn}${s.unit}, critical ${s.crit}${s.unit}. Alert raised ${Math.abs(raisedAt)} minutes ago.`}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={s.points} margin={{ top: 20, right: 12, bottom: 0, left: -12 }}>
            <CartesianGrid stroke="var(--border-neutral-subtle)" vertical={false} />
            <XAxis dataKey="t" type="number" domain={[s.points[0].t, 0]} ticks={ticks} tickFormatter={label} tick={{ fontSize: 11, fill: "var(--fg-neutral-muted)" }} axisLine={false} tickLine={false} />
            <YAxis domain={[s.min, s.max]} tick={{ fontSize: 11, fill: "var(--fg-neutral-muted)" }} axisLine={false} tickLine={false} width={44} />
            <ReferenceArea x1={raisedAt} x2={0} fill="var(--bg-danger-subtle)" fillOpacity={0.5} />
            <ReferenceLine y={s.warn} stroke="var(--status-warning)" strokeDasharray="4 4" label={{ value: `Warning ${s.warn}${s.unit}`, position: "insideTopRight", fontSize: 11, fill: "var(--fg-warning-emphasis)" }} />
            <ReferenceLine y={s.crit} stroke="var(--status-critical)" strokeDasharray="4 4" label={{ value: `Critical ${s.crit}${s.unit}`, position: "insideBottomRight", fontSize: 11, fill: "var(--fg-danger-emphasis)" }} />
            <ReferenceLine x={raisedAt} stroke="var(--status-critical)" label={{ value: "Alert raised", position: "top", fontSize: 11, fill: "var(--fg-danger-emphasis)" }} />
            <Tooltip formatter={(v) => [`${v}${s.unit}`, s.name.split(" (")[0]]} labelFormatter={(t) => label(Number(t))} contentStyle={{ fontSize: 12, borderRadius: 8, borderColor: "var(--border-neutral-muted)", background: "var(--bg-card)" }} />
            <Line type="monotone" dataKey="v" stroke={tone} strokeWidth={2} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </figure>
  )
}
