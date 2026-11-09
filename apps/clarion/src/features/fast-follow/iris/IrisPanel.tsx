import { useEffect, useRef, useState } from "react"
import { ArrowUp, BookOpen, Check, Copy, Database, ArrowRight, Info, Layers, RotateCcw, Sparkles, X } from "lucide-react"
import { useIsMobile } from "@/components/dashboard/MobileNav"
import { endpointById, type Endpoint } from "@/data/endpoints"
import { pageLabel, type PageId } from "@/nav"
import { cn } from "@/lib/utils"
import { ExploringTag } from "../ExploringTag"
import { openGroup } from "../alerts/store"
import { ask, clearThread, closeIris, setContext, useIris } from "./store"
import { suggestionsFor, timeLabel } from "./answers"
import type { Answer, Basis, IrisContext, IrisLink, Message } from "./types"

const MAX_CHARS = 500

/**
 * Iris side panel. Docked beside the page (not a modal), so IT can keep working.
 * On phones it fills the screen below the 32px Fast Follow preview banner,
 * Built on the Iris UX investigation (Nov 2026): context is
 * always attached and shown, every answer states its basis, sources and time,
 * and a change of context is marked in the thread.
 */
export function IrisPanel({
  page, onNavigate, onOpenEndpoint,
}: {
  page: PageId
  onNavigate: (p: PageId) => void
  onOpenEndpoint: (rows: Endpoint[], index: number) => void
}) {
  const { open, context, messages, thinking } = useIris()
  const isMobile = useIsMobile()
  const [text, setText] = useState("")
  const threadEnd = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Page context follows the page; a group context stays until cleared.
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
    else { const e = endpointById(link.id); if (e) onOpenEndpoint([e], 0) }
    if (isMobile) closeIris()
  }
  const send = () => { const t = text.trim(); if (!t || t.length > MAX_CHARS) return; ask({ text: t }); setText("") }
  const over = text.length > MAX_CHARS

  return (
    <aside
      aria-label="Iris"
      className={cn(
        "flex flex-col",
        isMobile ? "fixed inset-x-0 bottom-0 top-8 z-50" : "h-full w-[400px] shrink-0",
      )}
      style={{ background: "var(--bg-card)", borderLeft: isMobile ? undefined : "1px solid var(--border-neutral-muted)" }}
    >
      {/* header */}
      <div className="flex h-12 shrink-0 items-center gap-2 px-4 md:h-20" style={{ borderBottom: "1px solid var(--border-neutral-muted)" }}>
        <span className="flex size-7 items-center justify-center rounded-lg" style={{ background: "var(--bg-primary-emphasis)", color: "var(--fg-on-primary-emphasis)" }}>
          <Sparkles className="size-4" aria-hidden />
        </span>
        <h2 className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Iris</h2>
        <ExploringTag />
        <div className="ml-auto flex items-center gap-1">
          <IconBtn label="Start a new conversation" onClick={clearThread}><RotateCcw className="size-4" /></IconBtn>
          <IconBtn label="Close Iris" onClick={closeIris}><X className="size-4" /></IconBtn>
        </div>
      </div>

      {/* context: always visible, never a hidden toggle */}
      {context && <ContextBar context={context} page={page} />}

      {/* thread */}
      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4" style={{ background: "var(--bg-app)" }}>
        <div role="log" aria-live="polite" aria-label="Conversation with Iris" className="flex flex-col gap-3">
          {messages.length === 0 && <Empty />}
          {messages.map((m) => <MessageView key={m.id} m={m} onFollow={follow} />)}
          {thinking && (
            <p className="flex items-center gap-2 text-sm" style={{ color: "var(--fg-neutral-muted)" }}>
              <span className="size-2 animate-pulse rounded-full" style={{ background: "var(--fg-primary-emphasis)" }} aria-hidden />
              {thinking}
            </p>
          )}
          <div ref={threadEnd} />
        </div>
      </div>

      {/* suggestions + input */}
      <div className="flex shrink-0 flex-col gap-2 p-3" style={{ borderTop: "1px solid var(--border-neutral-muted)" }}>
        <div className="flex gap-1.5 overflow-x-auto pb-1" role="group" aria-label="Suggested questions">
          {suggestionsFor(context).map((s) => (
            <button key={s.id} type="button" disabled={!!thinking} onClick={() => ask(s)}
              className="h-7 shrink-0 rounded-full border px-2.5 text-xs transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)] disabled:opacity-50"
              style={{ borderColor: "var(--border-primary-muted)", color: "var(--fg-primary-emphasis)" }}>
              {s.label}
            </button>
          ))}
        </div>
        <form className="flex items-end gap-2" onSubmit={(e) => { e.preventDefault(); send() }}>
          <label htmlFor="iris-input" className="sr-only">Ask Iris about {context?.label ?? "your fleet"}</label>
          <textarea
            id="iris-input" ref={inputRef} rows={1} value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder={context?.kind === "group" ? "Ask about this alert group…" : "Ask about your fleet…"}
            aria-describedby="iris-hint" aria-invalid={over}
            className="max-h-32 min-h-9 flex-1 resize-none rounded-lg px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[var(--border-focused)]"
            style={{ background: "var(--bg-input-default)", border: `1px solid ${over ? "var(--border-input-invalid)" : "var(--border-input-default)"}`, color: "var(--fg-neutral-emphasis)" }}
          />
          <button type="submit" aria-label="Send question" disabled={!text.trim() || over || !!thinking}
            className="flex size-9 shrink-0 items-center justify-center rounded-lg transition-opacity disabled:opacity-40"
            style={{ background: "var(--bg-primary-emphasis)", color: "var(--fg-on-primary-emphasis)" }}>
            <ArrowUp className="size-4" aria-hidden />
          </button>
        </form>
        <p id="iris-hint" className="text-[11px]" style={{ color: over ? "var(--fg-danger-emphasis)" : "var(--fg-neutral-subtle)" }}>
          {over ? `Questions can be up to ${MAX_CHARS} characters. This one is ${text.length}.` : "Answers use your Clarion data and the alert catalogue only. Iris can be wrong; check figures before acting."}
        </p>
      </div>
    </aside>
  )
}

function ContextBar({ context, page }: { context: IrisContext; page: PageId }) {
  return (
    <div className="flex shrink-0 items-center gap-2 px-4 py-2 text-xs" style={{ borderBottom: "1px solid var(--border-neutral-subtle)", background: "var(--bg-neutral-subtle)" }}>
      <Layers className="size-3.5 shrink-0" style={{ color: "var(--fg-neutral-muted)" }} aria-hidden />
      <span className="shrink-0 whitespace-nowrap" style={{ color: "var(--fg-neutral-muted)" }}>Looking at</span>
      <span className="min-w-0 truncate font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{context.label}</span>
      {context.kind === "group" && (
        <button type="button" aria-label="Ask about the whole fleet instead" onClick={() => setContext({ kind: "page", page, label: pageLabel(page) })}
          className="ml-auto shrink-0 rounded px-1.5 py-0.5 underline-offset-2 hover:underline" style={{ color: "var(--fg-link-default)" }}>
          Whole fleet
        </button>
      )}
    </div>
  )
}

function Empty() {
  return (
    <div className="flex flex-col items-start gap-2 rounded-xl p-4 text-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)", color: "var(--fg-neutral-muted)" }}>
      <p style={{ color: "var(--fg-neutral-emphasis)" }}>Ask about what's on screen. Iris already knows what you're looking at.</p>
      <p>Every answer shows where it came from and when the data was read.</p>
    </div>
  )
}

function MessageView({ m, onFollow }: { m: Message; onFollow: (l: IrisLink) => void }) {
  if (m.role === "context") {
    return (
      <div className="flex items-center gap-2 py-1 text-[11px]" style={{ color: "var(--fg-neutral-subtle)" }} role="separator" aria-label={`Now looking at ${m.context.label}`}>
        <span className="h-px flex-1" style={{ background: "var(--border-neutral-muted)" }} />
        <span className="max-w-[75%] truncate">Now looking at {m.context.label}</span>
        <span className="h-px flex-1" style={{ background: "var(--border-neutral-muted)" }} />
      </div>
    )
  }
  if (m.role === "user") {
    return (
      <p className="ml-auto max-w-[85%] rounded-xl rounded-br-sm px-3 py-2 text-sm"
        style={{ background: "var(--bg-primary-subtle)", color: "var(--fg-on-primary-subtle)" }}>
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
    <article className="flex flex-col gap-3 rounded-xl p-3.5 text-sm" style={{ background: "var(--bg-card)", border: "1px solid var(--border-neutral-muted)", color: "var(--fg-neutral-emphasis)" }}>
      {a.paragraphs.map((p, i) => <p key={i} className="leading-relaxed">{p}</p>)}

      {a.steps && (
        <ol className="flex list-decimal flex-col gap-1.5 pl-5">{a.steps.map((s, i) => <li key={i} className="leading-relaxed">{s}</li>)}</ol>
      )}

      {a.facts && a.facts.length > 0 && (
        <dl className="flex flex-col rounded-lg" style={{ border: "1px solid var(--border-neutral-subtle)" }}>
          {a.facts.map((f, i) => (
            <div key={i} className="flex flex-col gap-0.5 px-3 py-2" style={{ borderTop: i ? "1px solid var(--border-neutral-subtle)" : undefined }}>
              <dt className="text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
                {f.link
                  ? <button type="button" onClick={() => onFollow(f.link!)} className="inline-flex items-center gap-1 font-medium underline-offset-2 hover:underline" style={{ color: "var(--fg-link-default)" }}>{f.label}<ArrowRight className="size-3" aria-hidden /></button>
                  : f.label}
              </dt>
              <dd className="tabular-nums">{f.value}</dd>
            </div>
          ))}
        </dl>
      )}

      {a.note && (
        <pre className="whitespace-pre-wrap rounded-lg p-3 font-sans text-[13px] leading-relaxed" style={{ background: "var(--bg-neutral-subtle)" }}>{a.note}</pre>
      )}

      {a.links && a.links.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {a.links.map((l, i) => (
            <button key={i} type="button" onClick={() => onFollow(l.link)} className="inline-flex items-center gap-1 text-sm font-medium underline-offset-2 hover:underline" style={{ color: "var(--fg-link-default)" }}>
              {l.label}<ArrowRight className="size-3.5" aria-hidden />
            </button>
          ))}
        </div>
      )}

      {/* provenance: basis, sources and time on every answer */}
      <footer className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-2 text-[11px]" style={{ borderTop: "1px solid var(--border-neutral-subtle)", color: "var(--fg-neutral-muted)" }}>
        <span className="inline-flex items-center gap-1"><B.icon className="size-3" aria-hidden />{B.label}</span>
        {(a.basis === "data" || a.basis === "catalogue") && <span>As of {timeLabel(a.asOf)}</span>}
        {a.sources.length > 0 && <span>Sources: {a.sources.join(", ")}</span>}
        <button type="button" onClick={copy} aria-label="Copy answer" className="ml-auto inline-flex items-center gap-1 rounded px-1 hover:bg-[var(--bg-neutral-subtle-hovered)]">
          {copied ? <Check className="size-3" aria-hidden /> : <Copy className="size-3" aria-hidden />}{copied ? "Copied" : "Copy"}
        </button>
      </footer>
    </article>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" aria-label={label} title={label} onClick={onClick}
      className="flex size-8 items-center justify-center rounded-md transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
      style={{ color: "var(--fg-neutral-muted)" }}>
      {children}
    </button>
  )
}
