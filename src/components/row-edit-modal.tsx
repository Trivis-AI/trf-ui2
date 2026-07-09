import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Field } from "./ui/field";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import { Spinner } from "./ui/spinner";
import { Alert, AlertDescription } from "./ui/alert";
import { DatePicker } from "./date-picker";

export type RowEditFieldType =
  | "text"
  | "number"
  | "textarea"
  | "select"
  | "switch"
  | "date";

export interface RowEditFieldOption {
  value: string;
  label: React.ReactNode;
}

export interface RowEditField {
  /** Key into the record. Also the control id. */
  key: string;
  label: React.ReactNode;
  /** Default "text". */
  type?: RowEditFieldType;
  /** Options for `type: "select"`. */
  options?: RowEditFieldOption[];
  placeholder?: string;
  /** Helper text under the control (hidden when the field has an error). */
  description?: React.ReactNode;
  /** Show a required marker and block submit when empty. */
  required?: boolean;
  disabled?: boolean;
  /** Number editor bounds. */
  min?: number;
  max?: number;
  step?: number;
  /**
   * Custom validation. Return an error message to block submit; a falsy return
   * means the field is valid. Runs after the required check.
   */
  validate?: (
    value: unknown,
    values: Record<string, unknown>
  ) => string | null | undefined | false;
}

export interface RowEditModalProps<TValue extends object = Record<string, unknown>> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** The editable fields, in display order. */
  fields: RowEditField[];
  /** The record being edited; `null` when nothing is selected. */
  value: TValue | null;
  /**
   * Persist the edited record. May return a Promise: the modal shows a pending
   * state and disables the form until it settles, then closes on success. Throw
   * (or reject) to keep the modal open and surface the error.
   */
  onSubmit: (next: TValue) => void | Promise<void>;
  /** Called when the user cancels (Cancel button or dismiss). */
  onCancel?: () => void;
  /** Default "Save". */
  submitLabel?: string;
  /** Default "Cancel". */
  cancelLabel?: string;
  /** A consumer-supplied error (e.g. the last server error) shown above the footer. */
  error?: React.ReactNode;
}

function isEmpty(v: unknown): boolean {
  return v == null || v === "";
}

function toDateValue(v: unknown): Date | undefined {
  if (v == null || v === "") return undefined;
  if (v instanceof Date) return Number.isNaN(v.getTime()) ? undefined : v;
  const d = new Date(v as string | number);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

/**
 * A generic, controlled modal that edits one record's fields from a schema-ish
 * field list, so a list page can offer "edit row" without navigating away.
 * Composes Dialog + Field + Input / Textarea / Select / Switch / DatePicker.
 * The consumer owns the data and the save call (`onSubmit`); the modal owns the
 * form frame, per-field validation/errors, the busy state, and Esc/Enter.
 *
 * Date fields read `Date | string | number` and emit a `Date`; the consumer
 * formats/serialises on save.
 */
export function RowEditModal<TValue extends object = Record<string, unknown>>({
  open,
  onOpenChange,
  title,
  description,
  fields,
  value,
  onSubmit,
  onCancel,
  submitLabel = "Save",
  cancelLabel = "Cancel",
  error,
}: RowEditModalProps<TValue>) {
  const [form, setForm] = React.useState<Record<string, unknown>>({});
  const [errors, setErrors] = React.useState<Record<string, string>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [submitError, setSubmitError] = React.useState<React.ReactNode>(null);

  // Seed the form on the rising edge of `open`, so an unstable `value` reference
  // can't wipe the user's edits mid-session.
  const wasOpen = React.useRef(false);
  React.useEffect(() => {
    if (open && !wasOpen.current) {
      setForm({ ...(value as Record<string, unknown> | null) });
      setErrors({});
      setSubmitError(null);
    }
    wasOpen.current = open;
  }, [open, value]);

  const setField = (key: string, v: unknown) => {
    setForm((prev) => ({ ...prev, [key]: v }));
    setErrors((prev) => {
      if (!prev[key]) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const validateAll = (): Record<string, string> => {
    const next: Record<string, string> = {};
    for (const field of fields) {
      const v = form[field.key];
      if (field.required && field.type !== "switch" && isEmpty(v)) {
        next[field.key] = "Required";
        continue;
      }
      const msg = field.validate?.(v, form);
      if (msg) next[field.key] = msg;
    }
    return next;
  };

  const handleOpenChange = (nextOpen: boolean) => {
    // Don't let a dismiss (Esc / overlay) interrupt an in-flight save.
    if (submitting) return;
    if (!nextOpen) onCancel?.();
    onOpenChange(nextOpen);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitError(null);
    const found = validateAll();
    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    setSubmitting(true);
    try {
      await onSubmit(form as TValue);
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : String(err));
    } finally {
      setSubmitting(false);
    }
  };

  const renderControl = (field: RowEditField) => {
    const id = `rowedit-${field.key}`;
    const type = field.type ?? "text";
    const v = form[field.key];
    const invalid = !!errors[field.key];
    const disabled = submitting || field.disabled;

    switch (type) {
      case "textarea":
        return (
          <Textarea
            id={id}
            value={v == null ? "" : String(v)}
            placeholder={field.placeholder}
            disabled={disabled}
            aria-invalid={invalid}
            onChange={(e) => setField(field.key, e.target.value)}
          />
        );
      case "select":
        return (
          <Select
            value={v == null ? "" : String(v)}
            onValueChange={(next) => setField(field.key, next)}
            disabled={disabled}
          >
            <SelectTrigger id={id} aria-invalid={invalid}>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );
      case "switch":
        return (
          <div className="flex h-9 items-center">
            <Switch
              id={id}
              checked={!!v}
              disabled={disabled}
              onCheckedChange={(checked) => setField(field.key, checked)}
            />
          </div>
        );
      case "date":
        return (
          <DatePicker
            id={id}
            value={toDateValue(v)}
            placeholder={field.placeholder}
            disabled={disabled}
            clearable={!field.required}
            onChange={(date) => setField(field.key, date)}
          />
        );
      case "number":
        return (
          <Input
            id={id}
            type="number"
            value={v == null ? "" : String(v)}
            placeholder={field.placeholder}
            min={field.min}
            max={field.max}
            step={field.step}
            disabled={disabled}
            aria-invalid={invalid}
            onChange={(e) =>
              setField(field.key, e.target.value === "" ? null : Number(e.target.value))
            }
          />
        );
      default:
        return (
          <Input
            id={id}
            type="text"
            value={v == null ? "" : String(v)}
            placeholder={field.placeholder}
            disabled={disabled}
            aria-invalid={invalid}
            onChange={(e) => setField(field.key, e.target.value)}
          />
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <form onSubmit={handleSubmit} className="grid gap-4">
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
            {description != null && <DialogDescription>{description}</DialogDescription>}
          </DialogHeader>

          <div className="grid max-h-[60vh] gap-4 overflow-y-auto">
            {fields.map((field) => (
              <Field
                key={field.key}
                label={field.label}
                htmlFor={`rowedit-${field.key}`}
                required={field.required}
                description={field.description}
                error={errors[field.key]}
              >
                {renderControl(field)}
              </Field>
            ))}
          </div>

          {(submitError || error) && (
            <Alert variant="destructive">
              <AlertDescription>{submitError || error}</AlertDescription>
            </Alert>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="secondary"
              disabled={submitting}
              onClick={() => handleOpenChange(false)}
            >
              {cancelLabel}
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting && <Spinner size="sm" className="text-current" />}
              {submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
