import { useSyncExternalStore } from "react"
import type { IrisContext, Message } from "./types"
import { answer, type Intent } from "./answers"

interface State { open: boolean; context: IrisContext | null; messages: Message[]; thinking: string | null }

let state: State = { open: false, context: null, messages: [], thinking: null }
let nextId = 1
const subs = new Set<() => void>()
const set = (patch: Partial<State>) => { state = { ...state, ...patch }; subs.forEach((f) => f()) }

export const useIris = () => useSyncExternalStore((f) => { subs.add(f); return () => { subs.delete(f) } }, () => state)

const key = (c: IrisContext) => (c.kind === "group" ? `g:${c.groupId}` : c.kind === "alert" ? `a:${c.alertId}` : `p:${c.page}`)
const sameContext = (a: IrisContext | null, b: IrisContext) => !!a && key(a) === key(b)

/**
 * Point Iris at something. A change of context is marked in the thread with a
 * divider, so earlier facts are never mistaken for this context (finding C2, C4).
 */
export function setContext(context: IrisContext) {
  if (sameContext(state.context, context)) return
  set({ context, messages: [...state.messages, { id: nextId++, role: "context", context }] })
}

export function openIris(context: IrisContext, first?: Intent) {
  set({ open: true })
  const changed = !sameContext(state.context, context)
  setContext(context)
  if (first && changed) ask(first)
}

export const closeIris = () => set({ open: false })
export const clearThread = () => set({ messages: state.context ? [{ id: nextId++, role: "context", context: state.context }] : [] })

/** Ask a question. `q` is a suggested intent or free text. */
export function ask(q: Intent | { text: string }, shownAs?: string) {
  if (!state.context || state.thinking) return
  const text = "text" in q ? q.text : shownAs ?? q.label
  const msgs: Message[] = "text" in q || shownAs || !q.auto ? [...state.messages, { id: nextId++, role: "user", text }] : state.messages
  const { answer: a, thinking } = answer(state.context, q)
  set({ messages: msgs, thinking })
  // short, honest pause: the status line says what Iris is reading
  window.setTimeout(() => set({ messages: [...state.messages, { id: nextId++, role: "iris", answer: a }], thinking: null }), 900)
}
