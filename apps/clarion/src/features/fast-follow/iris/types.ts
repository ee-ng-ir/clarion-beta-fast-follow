import type { PageId } from "@/nav"

/** What Iris is looking at. Always attached and always shown: no toggle (Iris finding E4, E9). */
export type IrisContext =
  | { kind: "group"; groupId: string; label: string }
  | { kind: "page"; page: PageId; label: string }

/** "product" = about Clarion itself (where a setting lives), not about the customer's data */
export type Basis = "data" | "catalogue" | "product" | "none"

export type IrisLink = { kind: "group"; id: string } | { kind: "endpoint"; id: string } | { kind: "page"; page: PageId }

export interface Fact { label: string; value: string; link?: IrisLink }

export interface Answer {
  /** where the answer came from, shown on every answer (F2, F3, F7) */
  basis: Basis
  paragraphs: string[]
  facts?: Fact[]
  steps?: string[]
  /** a copyable block, e.g. a service desk note */
  note?: string
  links?: { label: string; link: IrisLink }[]
  sources: string[]
  asOf: Date
}

export type Message =
  | { id: number; role: "context"; context: IrisContext }
  | { id: number; role: "user"; text: string }
  | { id: number; role: "iris"; answer: Answer }
