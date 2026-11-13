import { useSyncExternalStore } from "react"
import type { IrisContext, Message } from "./types"
import { answer, type Intent } from "./answers"
import { openWith } from "../dashboards/store"

interface State { open: boolean; context: IrisContext | null; messages: Message[]; thinking: string | null }

let state: State = { open: false, context: null, messages: [], thinking: null }
let nextId = 1
const subs = new Set<() => void>()
const set = (patch: Partial<State>) => { state = { ...state, ...patch }; subs.forEach((f) => f()) }

export const useIris = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f) } }, () => state)

const key = (c: IrisContext) => (c.kind === "group" ? `g:${c.groupId}` : c.kind === "alert" ? `a:${c.alertId}` : `p:${c.page}`)
const sameContext = (a: IrisContext | null, b: IrisContext) => !!a && key(a) === key(b)

/**
 * Point Iris at something. Browsing alone leaves no trace in the thread: the
 * context bar shows what Iris is looking at. The thread only marks a context
 * when something is asked in it (see `ask`), so earlier answers are never
 * mistaken for this context (finding C2, C4).
 */
export function setContext(context: IrisContext) {
  if (sameContext(state.context, context)) return
  set({ context })
}

/** The context the thread last marked, if any. */
const lastMarked = (msgs: Message[]) => {
  for (let i = msgs.length - 1; i >= 0; i--) { const m = msgs[i]; if (m.role === "context") return m.context }
  return null
}

export function openIris(context: IrisContext, first?: Intent) {
  set({ open: true })
  const changed = !sameContext(state.context, context)
  setContext(context)
  if (first && changed) ask(first)
}

export const closeIris = () => set({ open: false })
export const clearThread = () => set({ messages: [] })

/** Ask a question. `q` is a suggested intent or free text. */
export function ask(q: Intent | { text: string }, shownAs?: string) {
  if (!state.context || state.thinking) return
  const text = "text" in q ? q.text : shownAs ?? q.label
  const ctx = state.context
  // mark the context only when something is asked in it, and only when it changed
  const marked: Message[] = sameContext(lastMarked(state.messages), ctx) ? state.messages : [...state.messages, { id: nextId++, role: "context", context: ctx }]
  const msgs: Message[] = "text" in q || shownAs || !q.auto ? [...marked, { id: nextId++, role: "user", text }] : marked
  const { answer: a, thinking } = answer(ctx, q)
  // short, honest pause: the status line says what Iris is reading, step by step when it's building
  const steps = Array.isArray(thinking) ? thinking : [thinking]
  const each = steps.length > 1 ? 700 : 900
  set({ messages: msgs, thinking: steps[0] })
  steps.slice(1).forEach((s, i) => window.setTimeout(() => set({ thinking: s }), each * (i + 1)))
  window.setTimeout(() => {
    set({ messages: [...state.messages, { id: nextId++, role: "iris", answer: a }], thinking: null })
    // asked for on Dashboards, a built dashboard opens beside the answer, so you see it straight away
    if (a.dashboard && ctx.kind === "page" && ctx.page === "dashboards") openWith(a.dashboard.view, a.dashboard.state)
  }, each * steps.length)
}
