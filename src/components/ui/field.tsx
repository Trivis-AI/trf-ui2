import * as React from "react";
import { cn } from "../../lib/utils";
import { Label } from "./label";

export interface FieldProps {
  /** Field label text. */
  label?: React.ReactNode;
  /** id of the control this label points at (for accessibility). */
  htmlFor?: string;
  /** Helper text shown below the control when there is no error. */
  description?: React.ReactNode;
  /** Error message; replaces the description and turns the field destructive. */
  error?: React.ReactNode;
  /** Show a required marker next to the label. */
  required?: boolean;
  className?: string;
  /** The control (Input, Textarea, Select, ...). */
  children: React.ReactNode;
}

/**
 * Composes a Label + control + helper/error text. A clean-slate convenience —
 * not a primitive. Compose primitives; this just wires the common form row.
 */
export function Field({
  label,
  htmlFor,
  description,
  error,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label != null && (
        <Label htmlFor={htmlFor}>
          {label}
          {required && <span className="text-destructive"> *</span>}
        </Label>
      )}
      {children}
      {description != null && error == null && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      {error != null && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
