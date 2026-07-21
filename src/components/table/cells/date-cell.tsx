import { cn } from "../../../lib/utils";
import { formatDate, formatDateTime, useDateTimePrefs } from "../../../lib/datetime";

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
  /** `date` -> "25.06.2026" (locale-numeric); `datetime` adds ", 14:30" (24h). Default "date". */
  variant?: DateCellVariant;
  className?: string;
}

function format(value: string | number | Date | null | undefined, variant: DateCellVariant): string | null {
  const s = variant === "datetime" ? formatDateTime(value) : formatDate(value);
  return s || null;
}

/**
 * The one canonical date cell. Formats date, datetime, or a date range with the shared
 * locale-aware formatters (see `lib/datetime.ts` — locale set via `setDateTimeLocale`),
 * so no page hand-rolls date formatting. Falls back to the empty-value glyph for missing
 * or unparseable input.
 */
export function DateCell({ value, to, variant = "date", className }: DateCellProps) {
  // Subscribe so cells re-format when prefs (locale/format) arrive after mount (async token mint).
  useDateTimePrefs();
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
