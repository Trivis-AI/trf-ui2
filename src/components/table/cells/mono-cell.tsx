import { cn } from "../../../lib/utils";

// Empty placeholder glyph for table cells. The long dash is the agreed data
// convention for a missing value (per the table plan), not prose copy.
const EMPTY = "—";

export interface MonoCellProps {
  /** The code / identifier to show verbatim (SKU, IBAN, invoice number, ...). */
  value: string | number | null | undefined;
  className?: string;
}

function isEmpty(value: unknown): boolean {
  return value == null || (typeof value === "string" && value.trim() === "");
}

/**
 * Monospace cell for codes and identifiers (SKU, IBAN, invoice number, account).
 * Uses tabular figures so numeric codes align, and does not wrap. Falls back to
 * the empty-value glyph when there is nothing to show.
 */
export function MonoCell({ value, className }: MonoCellProps) {
  if (isEmpty(value)) {
    return <span className={cn("font-mono text-muted-foreground", className)}>{EMPTY}</span>;
  }
  const title = typeof value === "string" ? value : String(value);
  return (
    <span className={cn("font-mono tabular-nums whitespace-nowrap", className)} title={title}>
      {value}
    </span>
  );
}
