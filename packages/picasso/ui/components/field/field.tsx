// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.
import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { CircleHelp } from "lucide-react";
import { cn } from "../../lib/utils";
import { Tooltip, TooltipContent, TooltipTrigger } from "../tooltip/tooltip";

/**
 * Field
 *
 * The wrapper that makes a form control legible: label, control, and either a
 * hint or an error. STRUCTURE from Figma, MEASUREMENTS from shadcn.
 *
 * The point of this component is the wiring, not the layout. Input's guidance
 * says every field needs a visible label and that an invalid field needs a
 * message — both are easy to agree with and easy to forget. Field generates
 * the ids and hangs `htmlFor`, `aria-describedby` and `aria-invalid` off them,
 * so the association happens by using the component rather than by remembering
 * to. Advice that depends on memory is advice; advice built into a component
 * is a guarantee.
 *
 * Figma replaces the hint with the error when the field is invalid rather than
 * showing both, which is why FieldDescription renders only when valid. A
 * screen reader announcing a format hint and a failure together is noisier
 * than announcing the failure.
 */

type FieldSize = "sm" | "md";

interface FieldContextValue {
  id: string;
  descriptionId: string;
  errorId: string;
  invalid: boolean;
  disabled: boolean;
  size: FieldSize;
}

const FieldContext = React.createContext<FieldContextValue | null>(null);

function useField(component: string) {
  const ctx = React.useContext(FieldContext);
  if (!ctx) throw new Error(`<${component}> must be used inside a <Field>.`);
  return ctx;
}

const fieldVariants = cva("flex flex-col", {
  variants: { size: { sm: "gap-1", md: "gap-1.5" } },
  defaultVariants: { size: "md" },
});

export interface FieldProps
  extends React.ComponentProps<"div">, VariantProps<typeof fieldVariants> {
  /** Sets aria-invalid on the control and swaps the hint for the error. */
  invalid?: boolean;
  /** Disables the control and dims the label and hint. */
  disabled?: boolean;
}

export function Field({
  className,
  size = "md",
  invalid = false,
  disabled = false,
  ...props
}: FieldProps) {
  const id = React.useId();
  const value = React.useMemo<FieldContextValue>(
    () => ({
      id,
      descriptionId: `${id}-description`,
      errorId: `${id}-error`,
      invalid,
      disabled,
      size: size ?? "md",
    }),
    [id, invalid, disabled, size],
  );

  return (
    <FieldContext.Provider value={value}>
      <div
        data-slot="field"
        data-invalid={invalid || undefined}
        data-disabled={disabled || undefined}
        className={cn(fieldVariants({ size }), className)}
        {...props}
      />
    </FieldContext.Provider>
  );
}

const labelVariants = cva(
  "flex items-center gap-0.5 text-content-neutral-emphasis",
  {
    variants: { size: { sm: "text-label-sm", md: "text-label-md" } },
    defaultVariants: { size: "md" },
  },
);

export interface FieldLabelProps extends React.ComponentProps<"label"> {
  /** Renders the asterisk and sets required on the control. */
  required?: boolean;
  /**
   * Figma's `Help icon`: a (?) after the label that explains the field in a
   * tooltip. For background — anything needed to answer belongs in the hint.
   */
  help?: React.ReactNode;
}

export function FieldLabel({
  className,
  children,
  required,
  help,
  ...props
}: FieldLabelProps) {
  const { id, size, disabled } = useField("FieldLabel");
  const label = (
    <label
      htmlFor={id}
      data-slot="field-label"
      className={cn(
        labelVariants({ size }),
        disabled && "text-content-disabled",
        className,
      )}
      {...props}
    >
      {children}
      {required ? (
        // aria-hidden because `required` on the control is what assistive tech
        // reads. The asterisk is the visual half of the same fact.
        <span aria-hidden="true" className="text-content-primary-emphasis">
          *
        </span>
      ) : null}
    </label>
  );
  if (!help) return label;
  // The help button sits beside the label, not inside it — a button inside a
  // <label> would forward its click to the control.
  return (
    <div data-slot="field-label-row" className="flex items-center gap-0.5">
      {label}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            aria-label={`About ${typeof children === "string" ? children : "this field"}`}
            data-slot="field-help"
            className="inline-flex size-4 items-center justify-center rounded-full text-content-neutral-subtle outline-none hover:text-content-neutral-emphasis focus-visible:ring-2 focus-visible:ring-line-focused relative after:absolute after:-inset-2 pointer-coarse:after:-inset-3.5"
          >
            <CircleHelp aria-hidden className="size-4" />
          </button>
        </TooltipTrigger>
        <TooltipContent>{help}</TooltipContent>
      </Tooltip>
    </div>
  );
}

export interface FieldControlProps {
  children: React.ReactElement;
  /** Marks the control required, to pair with FieldLabel's asterisk. */
  required?: boolean;
}

/**
 * Passes the generated id and aria wiring to whatever control it wraps, via
 * Slot — so Input, Select, Textarea and a Radix trigger all work without Field
 * knowing anything about them.
 */
export function FieldControl({ children, required }: FieldControlProps) {
  const { id, descriptionId, errorId, invalid, disabled } =
    useField("FieldControl");
  // Slot's props are typed as HTMLAttributes, which has no `disabled` — but it
  // forwards whatever it is handed to its child, and the child here is a form
  // control. The cast is on the prop bag, not on the child.
  const forwarded = {
    id,
    "aria-describedby": invalid ? errorId : descriptionId,
    "aria-invalid": invalid || undefined,
    "aria-required": required || undefined,
    disabled: disabled || undefined,
    "data-slot": "field-control",
  } as React.ComponentPropsWithoutRef<typeof Slot>;

  return <Slot {...forwarded}>{children}</Slot>;
}

const optionVariants = cva(
  // items-start so a label that wraps keeps its control on the first line.
  "cursor-pointer items-start",
  {
    variants: { size: { sm: "text-label-sm", md: "text-label-md" } },
    defaultVariants: { size: "md" },
  },
);

export interface FieldOptionProps
  extends
    Omit<React.ComponentProps<"label">, "children">,
    VariantProps<typeof optionVariants> {
  /** The control the row belongs to — a Checkbox, a Radio, a Switch. */
  control: React.ReactElement;
  /** The label. */
  children: React.ReactNode;
  /** A second line under the label. Outside the <label>, so it describes the
   *  control rather than becoming part of its name. */
  description?: React.ReactNode;
  disabled?: boolean;
}

/**
 * FieldOption — a control and its label as one row, and one target.
 *
 * ⭐ The row is the target. A Checkbox is 16px square and a Radio 16px round,
 * which is under the 24px floor on its own (WCAG 2.2 AA, 2.5.8) and nowhere
 * near a thumb. Wrapping both the control and its text in a single `<label>`
 * makes the whole row clickable without changing what the control looks like,
 * so the hit area grows and the design does not.
 *
 * Height is `min-h-6` (24) everywhere and `min-h-11` (44) where the pointer is
 * coarse — a phone or a touch monitor — so desktop density is untouched and a
 * thumb still gets 44. See docs/foundations/responsive.md.
 *
 * ⚠️ A row is one target, so it holds one control and its words. A second
 * button inside it — a help tooltip, a remove — would have its click forwarded
 * to the control by the `<label>`; put it beside the row, as FieldLabel does
 * with `help`.
 */
export function FieldOption({
  className,
  control,
  children,
  description,
  disabled,
  size,
  ...props
}: FieldOptionProps) {
  const id = React.useId();
  const descriptionId = `${id}-description`;
  return (
    /* A grid so the description lines up under the label's text whatever the
       control is — a 16 checkbox, a 20 radio, a 44 switch. The label spans
       both columns and borrows them with subgrid, so the row is still one
       target rather than two cells that happen to sit together. */
    <div
      data-slot="field-option"
      data-disabled={disabled || undefined}
      className="grid grid-cols-option gap-x-2.5"
    >
      <label
        htmlFor={id}
        data-slot="field-option-label"
        className={cn(
          optionVariants({ size }),
          "col-span-2 grid grid-cols-subgrid min-h-6 pointer-coarse:min-h-11",
          disabled && "cursor-not-allowed text-content-disabled",
          className,
        )}
        {...props}
      >
        {/* the control centres on the first line, not on the whole row */}
        <span className="flex min-h-6 shrink-0 items-center pointer-coarse:min-h-11">
          {/* Same cast as FieldControl, for the same reason: Slot's props are
              typed as HTMLAttributes, which has no `disabled`, but the child
              here is a form control. */}
          <Slot
            {...({
              id,
              "aria-describedby": description ? descriptionId : undefined,
              disabled: disabled || undefined,
              "data-slot": "field-option-control",
            } as React.ComponentPropsWithoutRef<typeof Slot>)}
          >
            {control}
          </Slot>
        </span>
        <span className="flex min-h-6 items-center pointer-coarse:min-h-11">
          {children}
        </span>
      </label>
      {description ? (
        <p
          id={descriptionId}
          data-slot="field-option-description"
          className={cn(
            "col-start-2 text-content-neutral-muted",
            size === "sm" ? "text-body-xs" : "text-body-sm",
            disabled && "text-content-disabled",
          )}
        >
          {description}
        </p>
      ) : null}
    </div>
  );
}

const messageVariants = cva("", {
  variants: { size: { sm: "text-body-xs", md: "text-body-sm" } },
  defaultVariants: { size: "md" },
});

export function FieldDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  const { descriptionId, size, invalid, disabled } =
    useField("FieldDescription");
  // Figma swaps the hint for the error rather than stacking them.
  if (invalid) return null;
  return (
    <p
      id={descriptionId}
      data-slot="field-description"
      className={cn(
        messageVariants({ size }),
        disabled ? "text-content-disabled" : "text-content-neutral-subtle",
        className,
      )}
      {...props}
    />
  );
}

export function FieldError({ className, ...props }: React.ComponentProps<"p">) {
  const { errorId, size, invalid } = useField("FieldError");
  if (!invalid) return null;
  return (
    <p
      id={errorId}
      // role="alert" so the failure is announced when it appears, rather than
      // only when focus happens to reach the control.
      role="alert"
      data-slot="field-error"
      className={cn(
        messageVariants({ size }),
        "text-content-danger-emphasis",
        className,
      )}
      {...props}
    />
  );
}

export { fieldVariants };
