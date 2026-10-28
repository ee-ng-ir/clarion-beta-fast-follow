import { useState } from "react"
import { Badge, Button, Input, NumberInput, Switch } from "@ir/ui"
import type { FlagType, FlagValue } from "@/data/catalog"
import { Mono } from "./ui"

/** A flag's value, read-only: On/Off as a badge with a dot, anything else in mono. */
export function FlagValueView({ value }: { value: FlagValue | undefined }) {
  if (value === undefined) return <span className="text-content-neutral-subtle">—</span>
  if (typeof value === "boolean") return <Badge dot color={value ? "success" : "neutral"}>{value ? "On" : "Off"}</Badge>
  return <Mono>{String(value)}</Mono>
}

/**
 * Edits one flag value. A boolean commits on toggle; a number or string is a
 * draft with Save, so a half-typed value never reaches every tenant.
 */
export function FlagEditor({ type, value, onCommit, label, disabled }: {
  type: FlagType
  value: FlagValue
  onCommit: (v: FlagValue) => void
  label: string
  disabled?: boolean
}) {
  const [draft, setDraft] = useState<string>(String(value))
  const [base, setBase] = useState(value)
  if (base !== value) { setBase(value); setDraft(String(value)) }

  if (type === "boolean") {
    return <Switch checked={value === true} onCheckedChange={(c) => onCommit(c)} aria-label={label} disabled={disabled} />
  }
  const dirty = draft !== String(value) && draft.trim() !== ""
  return (
    <form className="flex items-center gap-2" onSubmit={(e) => { e.preventDefault(); if (dirty) onCommit(type === "integer" ? Number(draft) : draft.trim()) }}>
      {type === "integer" ? (
        <NumberInput size="sm" value={draft === "" ? null : Number(draft)} onValueChange={(v) => setDraft(v == null ? "" : String(v))} aria-label={label} groupClassName="w-32" disabled={disabled} />
      ) : (
        <Input size="sm" value={draft} onChange={(e) => setDraft(e.target.value)} aria-label={label} className="w-32" disabled={disabled} />
      )}
      <Button type="submit" size="sm" variant={dirty ? "default" : "outline"} disabled={!dirty || disabled}>Save</Button>
    </form>
  )
}

export function FlagEditorInline({ type, value, onChange }: { type: FlagType; value: FlagValue; onChange: (v: FlagValue) => void }) {
  if (type === "boolean") return <div><Switch checked={value === true} onCheckedChange={onChange} aria-label="Value" /></div>
  if (type === "integer") return <NumberInput value={Number(value)} onValueChange={(v) => onChange(v ?? 0)} aria-label="Value" />
  return <Input value={String(value)} onChange={(e) => onChange(e.target.value)} aria-label="Value" />
}
