import { useEffect, useRef, useState } from "react"
import { ArrowRight, ArrowUp, BookOpen, Check, Copy, Database, Info, LayoutDashboard, Layers, RotateCcw, Save, X } from "lucide-react"
import { Button, Card, CardContent, Chip, Loader, Sparkline, Textarea } from "@ir/ui"
import { toast } from "@/components/ui/toast"
import { useIsMobile } from "@/components/dashboard/MobileNav"
import { endpointById, type Endpoint } from "@/data/endpoints"
import { pageLabel, type PageId } from "@/nav"
import { cn } from "@/lib/utils"
import { ExploringTag } from "../ExploringTag"
import { openGroup } from "../alerts/store"
import { DASH_TITLE, isSaved, openWith, saveSpec, useDashboards } from "../dashboards/store"
import type { BuiltDashboard } from "./build"
import { ask, clearThread, closeIris, setContext, useIris } from "./store"
import { suggestionsFor, timeLabel } from "./answers"
import { IrisMark, type IrisMood } from "./IrisMark"
import type { Answer, Basis, IrisContext, IrisLink, Message } from "./types"

const MAX_CHARS = 500

/**
 * Iris side panel. Docked beside the page (not a modal), so IT can keep working.
 * On phones it fills the screen below the Fast Follow preview banner.
 * Built on the Iris UX investigation (Nov 2026): context is always attached and
 * shown, every answer states its basis, sources and time, and a change of
 * context is marked in the thread.
 */
export function IrisPanel({
  page, onNavigate, onOpenEndpoint,
}: {
  page: PageId
  onNavigate: (p: PageId, then?: () => void) => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
}) {
  const { open, context, messages, thinking } = useIris()
  const isMobile = useIsMobile()
  const [text, setText] = useState("")
  const threadEnd = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const [listening, setListening] = useState(false)
  const mood = useIrisMood(thinking, listening)

  // Page context follows the page; a group or alert context stays until cleared.
  // The chips and every ask use the page you're on now, even before the effect below
  // catches up, so a suggestion never shows on, or is answered for, a page it isn't about.
  const current: IrisContext | null = context?.kind === "page" && context.page !== page ? { kind: "page", page, label: pageLabel(page) } : context
  const syncContext = () => { if (current && current !== context) setContext(current) }
  useEffect(() => {
    if (open && context?.kind === "page" && context.page !== page) setContext({ kind: "page", page, label: pageLabel(page) })
  }, [open, page, context])

  // Always land on the newest message (finding F9).
  useEffect(() => { threadEnd.current?.scrollIntoView({ block: "end" }) }, [messages.length, thinking])
  useEffect(() => { if (open) inputRef.current?.focus() }, [open])

  if (!open) return null

  const follow = (link: IrisLink) => {
    if (link.kind === "group") { openGroup(link.id); onNavigate("alerts") }
    else if (link.kind === "page") onNavigate(link.page)
    else if (link.kind === "dashboard") onNavigate("dashboards", () => openWith(link.view, link.state))
    else { const e = endpointById(link.id); if (e) onOpenEndpoint([e], 0) }
    if (isMobile) closeIris()
  }
  const send = () => { const t = text.trim(); if (!t || t.length > MAX_CHARS) return; syncContext(); ask({ text: t }); setText("") }
  const over = text.length > MAX_CHARS

  return (
    <aside
      aria-label="Iris"
      data-ff-offset={isMobile ? "" : undefined}
      className={cn(
        "flex flex-col bg-surface-card",
        isMobile ? "fixed inset-x-0 bottom-0 z-50" : "h-full w-100 shrink-0 border-s border-line-neutral-muted",
      )}
    >
      {/* header */}
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-line-neutral-muted px-4 md:h-20">
        <span className="flex size-7 items-center justify-center rounded-md border border-line-neutral-muted bg-surface-card text-content-neutral-emphasis">
          <IrisMark mood={mood} className="size-5" />
        </span>
        <h2 className="text-heading-xs text-content-neutral-emphasis">Iris</h2>
        <ExploringTag />
        <div className="ms-auto flex items-center gap-1">
          <Button variant="ghost" size="icon-sm" aria-label="Start a new conversation" title="Start a new conversation" onClick={clearThread}><RotateCcw /></Button>
          <Button variant="ghost" size="icon-sm" aria-label="Close Iris" title="Close Iris" onClick={closeIris}><X /></Button>
        </div>
      </div>

      {/* context: always visible, never a hidden toggle */}
      {context && <ContextBar context={context} page={page} />}

      {/* thread */}
      <div className="min-h-0 flex-1 overflow-y-auto bg-surface-app px-4 py-4">
        <div role="log" aria-live="polite" aria-label="Conversation with Iris" className="flex flex-col gap-3">
          {messages.length === 0 && <Empty />}
          {messages.map((m) => <MessageView key={m.id} m={m} onFollow={follow} />)}
          {thinking && (
            <p className="flex items-center gap-2 text-body-sm text-content-neutral-muted">
              <Loader variant="pulse" label={null} delay={0} />
              {thinking}
            </p>
          )}
          <div ref={threadEnd} />
        </div>
      </div>

      {/* suggestions + input */}
      <div className="flex shrink-0 flex-col gap-2 border-t border-line-neutral-muted p-3">
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Suggested questions">
          {suggestionsFor(current).map((s) => (
            <Chip key={s.id} disabled={!!thinking} onClick={() => { syncContext(); ask(s) }} className="shrink-0">{s.label}</Chip>
          ))}
        </div>
        <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); send() }}>
          <label htmlFor="iris-input" className="sr-only">Ask Iris about {context?.label ?? "your fleet"}</label>
          <Textarea
            id="iris-input" ref={inputRef} rows={1} value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setListening(true)} onBlur={() => setListening(false)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={context?.kind === "group" ? "Ask about this alert group" : context?.kind === "alert" ? "Ask about this alert" : "Ask about your fleet"}
            aria-describedby="iris-hint" aria-invalid={over || undefined}
            className="max-h-32 min-h-9 flex-1 resize-none"
          />
          <Button type="submit" size="icon-md" aria-label="Send question" disabled={!text.trim() || over || !!thinking}><ArrowUp /></Button>
        </form>
        <p id="iris-hint" className={cn("text-body-xs", over ? "text-content-danger-emphasis" : "text-content-neutral-subtle")}>
          {over ? `Questions can be up to ${MAX_CHARS} characters. This one is ${text.length}.` : "Answers use your Clarion data and the alert catalogue only. Iris can be wrong; check figures before acting."}
        </p>
      </div>
    </aside>
  )
}

/**
 * The header mark's mood. Thinking wins; when an answer lands the mark winks
 * once, then goes back to looking at you (prompt focused) or around the page.
 */
function useIrisMood(thinking: unknown, listening: boolean): IrisMood {
  const busy = !!thinking
  const [wasBusy, setWasBusy] = useState(busy)
  const [answered, setAnswered] = useState(false)
  if (wasBusy !== busy) {
    setWasBusy(busy)
    if (!busy) setAnswered(true)
  }
  useEffect(() => {
    if (!answered) return
    const t = setTimeout(() => setAnswered(false), 900)
    return () => clearTimeout(t)
  }, [answered])
  if (busy) return "thinking"
  if (answered) return "answered"
  return listening ? "listening" : "idle"
}

function ContextBar({ context, page }: { context: IrisContext; page: PageId }) {
  return (
    <div className="flex shrink-0 items-center gap-2 border-b border-line-neutral-subtle bg-surface-neutral-subtle px-4 py-2 text-body-xs">
      <Layers className="size-3.5 shrink-0 text-content-neutral-muted" aria-hidden />
      <span className="shrink-0 whitespace-nowrap text-content-neutral-muted">Looking at</span>
      <span className="min-w-0 truncate text-label-sm text-content-neutral-emphasis">{context.label}</span>
      {context.kind !== "page" && (
        <Button variant="link" size="xs" className="ms-auto shrink-0" aria-label="Ask about the whole fleet instead"
          onClick={() => setContext({ kind: "page", page, label: pageLabel(page) })}>
          Whole fleet
        </Button>
      )}
    </div>
  )
}

function Empty() {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2 text-body-md text-content-neutral-muted">
        <p className="text-content-neutral-emphasis">Ask about what's on screen. Iris already knows what you're looking at.</p>
        <p>Every answer shows where it came from and when the data was read.</p>
      </CardContent>
    </Card>
  )
}

function MessageView({ m, onFollow }: { m: Message; onFollow: (l: IrisLink) => void }) {
  if (m.role === "context") {
    return (
      <div className="flex items-center gap-2 py-1 text-body-xs text-content-neutral-subtle" role="separator" aria-label={`Now looking at ${m.context.label}`}>
        <span className="h-px flex-1 bg-line-neutral-muted" />
        <span className="max-w-3/4 truncate">Now looking at {m.context.label}</span>
        <span className="h-px flex-1 bg-line-neutral-muted" />
      </div>
    )
  }
  if (m.role === "user") {
    return (
      <p className="ms-auto max-w-4/5 rounded-xl rounded-ee-xs bg-surface-primary-subtle px-3 py-2 text-body-md text-content-on-primary-subtle">
        {m.text}
      </p>
    )
  }
  return <AnswerView a={m.answer} onFollow={onFollow} />
}

const basisMeta: Record<Basis, { label: string; icon: typeof Database }> = {
  data: { label: "From your Clarion data", icon: Database },
  catalogue: { label: "From the alert catalogue, applied to your data", icon: BookOpen },
  product: { label: "About Clarion's settings", icon: Info },
  none: { label: "No data used", icon: Info },
}

function AnswerView({ a, onFollow }: { a: Answer; onFollow: (l: IrisLink) => void }) {
  const [copied, setCopied] = useState(false)
  const B = basisMeta[a.basis]
  const copyText = a.note ?? [...a.paragraphs, ...(a.steps ?? []), ...(a.facts ?? []).map((f) => `${f.label}: ${f.value}`)].join("\n")
  const copy = () => { navigator.clipboard?.writeText(copyText).then(() => { setCopied(true); window.setTimeout(() => setCopied(false), 1500) }).catch(() => {}) }

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3 text-body-md text-content-neutral-emphasis">
        {a.paragraphs.map((p, i) => <p key={i}>{p}</p>)}

        {a.dashboard && <BuiltCard d={a.dashboard} onOpen={() => onFollow({ kind: "dashboard", view: a.dashboard!.view, state: a.dashboard!.state })} />}

        {a.steps && <ol className="flex list-decimal flex-col gap-1.5 ps-5">{a.steps.map((s, i) => <li key={i}>{s}</li>)}</ol>}

        {a.facts && a.facts.length > 0 && (
          <dl className="flex flex-col divide-y divide-line-neutral-subtle rounded-md border border-line-neutral-subtle">
            {a.facts.map((f, i) => (
              <div key={i} className="flex flex-col gap-0.5 px-3 py-2">
                <dt className="text-label-sm text-content-neutral-muted">
                  {f.link
                    ? <Button variant="link" size="xs" onClick={() => onFollow(f.link!)}>{f.label}<ArrowRight aria-hidden /></Button>
                    : f.label}
                </dt>
                <dd className="tabular-nums">{f.value}</dd>
              </div>
            ))}
          </dl>
        )}

        {a.note && <pre className="whitespace-pre-wrap rounded-md bg-surface-neutral-subtle p-3 font-sans text-body-sm">{a.note}</pre>}

        {a.links && a.links.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {a.links.map((l, i) => <Button key={i} variant="link" size="xs" onClick={() => onFollow(l.link)}>{l.label}<ArrowRight aria-hidden /></Button>)}
          </div>
        )}

        {/* provenance: basis, sources and time on every answer */}
        <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 border-t border-line-neutral-subtle pt-2 text-body-xs text-content-neutral-muted">
          <span className="inline-flex items-center gap-1"><B.icon className="size-3" aria-hidden />{B.label}</span>
          {(a.basis === "data" || a.basis === "catalogue") && <span>As of {timeLabel(a.asOf)}</span>}
          {a.sources.length > 0 && <span>Sources: {a.sources.join(", ")}</span>}
          <Button variant="ghost" size="xs" className="ms-auto" aria-label="Copy answer" onClick={copy}>
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}{copied ? "Copied" : "Copy"}
          </Button>
        </footer>
      </CardContent>
    </Card>
  )
}

/**
 * The dashboard Iris built, inside the answer. It's one of Clarion's own
 * dashboards with filters set, opened beside the chat; it isn't kept until you
 * save it, so trying ideas never fills up your saved list.
 */
function BuiltCard({ d, onOpen }: { d: BuiltDashboard; onOpen: () => void }) {
  useDashboards() // re-render when it's saved
  const saved = isSaved(d.name)
  const save = () => {
    saveSpec(d.view, d.name, d.state)
    toast({ title: `Saved "${d.name}"`, description: "Find it under Saved dashboards.", variant: "success" })
  }
  const max = Math.max(1, ...(d.bars ?? []))
  return (
    <div className="overflow-hidden rounded-lg border border-line-primary-muted bg-surface-card">
      {(d.bars || d.spark) && (
        <div aria-hidden className="flex h-16 items-end border-b border-line-neutral-subtle bg-surface-layer-subtle px-4 pt-3">
          {d.bars && (
            <div className="flex h-12 w-full items-end gap-1.5">
              {d.bars.map((v, i) => <span key={i} className="flex-1 rounded-t-xs bg-chart-1" style={{ height: `${Math.max(8, (v / max) * 100)}%` }} />)}
            </div>
          )}
          {d.spark && <Sparkline values={d.spark} label={null} variant="area" className="mb-2 h-11 w-full" />}
        </div>
      )}
      <div className="flex flex-col gap-2 p-3">
        <div className="flex flex-col gap-0.5">
          <span className="flex items-center gap-1.5 text-body-xs text-content-neutral-muted">
            <LayoutDashboard className="size-3" aria-hidden />{DASH_TITLE[d.view]} · {saved ? "saved" : "not saved yet"}
          </span>
          <span className="text-label-md text-content-neutral-emphasis">{d.name}</span>
          <span className="text-body-xs text-content-neutral-muted">{d.summary}</span>
        </div>
        <p className="flex items-baseline gap-2">
          <span className="text-metric-sm tabular-nums text-content-neutral-emphasis">{d.metric}</span>
          <span className="text-body-sm text-content-neutral-muted">{d.metricLabel}</span>
        </p>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" onClick={onOpen}>Open dashboard<ArrowRight aria-hidden /></Button>
          <Button size="sm" variant="outline" disabled={saved} onClick={save}>
            {saved ? <Check aria-hidden /> : <Save aria-hidden />}{saved ? "Saved" : "Save"}
          </Button>
        </div>
      </div>
    </div>
  )
}
