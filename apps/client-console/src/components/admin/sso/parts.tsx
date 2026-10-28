import { Fragment, useState, type ReactNode } from "react"
import { Check, Copy } from "lucide-react"
import {
  Alert, AlertDescription, AlertTitle,
  Button,
  Card, CardContent,
  Field, FieldControl, FieldDescription, FieldLabel,
  InputGroup, InputGroupAddon, InputGroupInput,
  Stepper, StepperContent, StepperIndicator, StepperItem, StepperSeparator, StepperTitle,
} from "@ir/ui"
import { cnPicasso as cn } from "@/lib/utils"

/** Renders **bold** spans inside a plain string from the SSO data file. */
export function Rich({ text }: { text: string }) {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  return (
    <>
      {parts.map((p, i) =>
        i % 2 === 1
          ? <strong key={i} className="font-medium text-content-neutral-emphasis">{p}</strong>
          : <Fragment key={i}>{p}</Fragment>
      )}
    </>
  )
}

/** A value the admin pastes into their provider: read-only field + Copy. */
export function CopyField({ label, hint, aka, value }: { label: string; hint?: string; aka?: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1500)
    } catch {
      /* Clipboard refused (older browsers): the field selects on focus instead. */
    }
  }
  return (
    <Field>
      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
        <FieldLabel>{label}</FieldLabel>
        {hint && <span className="text-body-xs text-content-neutral-subtle">{hint}</span>}
      </div>
      <InputGroup>
        <FieldControl>
          <InputGroupInput readOnly value={value} onFocus={(e) => e.currentTarget.select()} className="font-mono text-code-sm" />
        </FieldControl>
        <InputGroupAddon align="end">
          <Button variant="ghost" size="xs" onClick={copy} aria-label={copied ? `${label} copied` : `Copy ${label}`}>
            {copied ? <Check aria-hidden /> : <Copy aria-hidden />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </InputGroupAddon>
      </InputGroup>
      {aka && <FieldDescription>Also called: {aka}</FieldDescription>}
    </Field>
  )
}

type Tone = "info" | "warning" | "destructive" | "success"

/** Inline message — Picasso's Alert, with the body as rich text. */
export function Callout({ tone, title, children, action, className }: { tone: Tone; title: string; children?: ReactNode; action?: ReactNode; className?: string }) {
  return (
    <Alert variant={tone} action={action} className={className}>
      <AlertTitle>{title}</AlertTitle>
      {children && <AlertDescription>{children}</AlertDescription>}
    </Alert>
  )
}

/** Setup progress. Titles show from lg up; below that, "Step n of N". */
export function SetupStepper({ steps, current }: { steps: readonly string[]; current: number }) {
  const at = Math.min(current, steps.length - 1)
  return (
    <>
      <p className="text-body-sm text-content-neutral-muted sm:hidden">
        Step {at + 1} of {steps.length} · <span className="text-content-neutral-emphasis">{steps[at]}</span>
      </p>
      <Stepper value={current} size="sm" aria-label="Setup steps" className="hidden sm:flex">
        {steps.map((label, i) => (
          <StepperItem key={label} index={i} className="gap-2">
            <StepperIndicator />
            <StepperContent className="hidden shrink-0 lg:flex">
              <StepperTitle className="text-label-sm">{label}</StepperTitle>
            </StepperContent>
            <StepperSeparator className="mx-1 min-w-2" />
          </StepperItem>
        ))}
      </Stepper>
    </>
  )
}

/** Side-panel help. */
export function TipCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Card size="sm" className="shadow-none">
      <CardContent className="gap-1">
        <span className="text-label-md text-content-neutral-emphasis">{title}</span>
        <div className="text-body-sm text-content-neutral-muted">{children}</div>
      </CardContent>
    </Card>
  )
}

/** Label / value list for "what we read back" and connection details. */
export function DetailList({ rows, mono = true }: { rows: [string, ReactNode][]; mono?: boolean }) {
  return (
    <dl className="grid grid-cols-1 sm:grid-cols-option sm:gap-x-6">
      {rows.map(([k, v], i) => (
        <Fragment key={k}>
          <dt className={cn("pt-2.5 text-body-sm text-content-neutral-muted sm:py-2.5", i > 0 && "border-t border-line-neutral-muted")}>{k}</dt>
          <dd className={cn("m-0 pb-2.5 text-content-neutral-emphasis wrap-anywhere sm:py-2.5", i > 0 && "sm:border-t sm:border-line-neutral-muted", mono ? "font-mono text-code-sm" : "text-body-sm")}>{v}</dd>
        </Fragment>
      ))}
    </dl>
  )
}

export function SectionTitle({ children, sub }: { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <h2 className="text-heading-md text-content-neutral-emphasis">{children}</h2>
      {sub && <p className="max-w-content-reading text-body-md text-content-neutral-muted">{sub}</p>}
    </div>
  )
}
