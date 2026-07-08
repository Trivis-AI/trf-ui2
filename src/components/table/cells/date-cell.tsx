import { cn } from "../../../lib/utils";

// Empty placeholder glyph for table cells. The long dash is the agreed data
// convention for a missing value (per the table plan), not prose copy.
const EMPTY = "—";

// En dash separator for date ranges (start .. end). Not an em dash.
const RANGE_SEP = " – ";

export type DateCellVariant = "date" | "datetime";

export interface DateCellProps {
  /**
   * The date. Accepts a `Date`, an epoch number, or a parseable string (ISO).
   * When `to` is set the two form a range and `value` is the start.
   */
  value: string | number | Date | null | undefined;
  /** Range end. When present the cell renders "start – end". */
  to?: string | number | Date | null | undefined;
  /** `date` -> "08 Jul 2026"; `datetime` -> "08 Jul 2026, 14:30" (24h). Default "date". */
  variant?: DateCellVariant;
  className?: string;
}

// The single canonical table date format (matches DatePicker / DateTimePicker).
const dateFmt = new Intl.DateTimeFormat(undefined, {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const dateTimeFmt = new Intl.DateTimeFormat(undefined, {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function toDate(value: string | number | Date | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

function format(value: string | number | Date | null | undefined, variant: DateCellVariant): string | null {
  const d = toDate(value);
  if (!d) return null;
  return (variant === "datetime" ? dateTimeFmt : dateFmt).format(d);
}

/**
 * The one canonical date cell. Formats date, datetime, or a date range with a
 * single agreed format, so no page hand-rolls date formatting. Falls back to the
 * empty-value glyph for missing or unparseable input.
 */
export function DateCell({ value, to, variant = "date", className }: DateCellProps) {
  const start = format(value, variant);

  if (to !== undefined) {
    const end = format(to, variant);
    if (!start && !end) {
      return <span className={cn("text-muted-foreground", className)}>{EMPTY}</span>;
    }
    return (
      <span className={cn("whitespace-nowrap tabular-nums", className)}>
        {start ?? EMPTY}
        {RANGE_SEP}
        {end ?? EMPTY}
      </span>
    );
  }

  if (!start) {
    return <span className={cn("text-muted-foreground", className)}>{EMPTY}</span>;
  }
  return <span className={cn("whitespace-nowrap tabular-nums", className)}>{start}</span>;
}
