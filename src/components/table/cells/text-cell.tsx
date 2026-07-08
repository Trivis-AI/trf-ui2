import * as React from "react";
import { cn } from "../../../lib/utils";

// Empty placeholder glyph for table cells. The long dash is the agreed data
// convention for a missing value (per the table plan), not prose copy.
const EMPTY = "—";

export interface TextCellProps {
  /** Primary line. Truncated with an ellipsis; the full text shows on hover (title). */
  value: React.ReactNode;
  /**
   * Optional secondary line beneath the primary (bank name over IBAN, product
   * name over serial number). Muted and smaller, also truncated.
   */
  subLine?: React.ReactNode;
  /** Extra classes on the outer wrapper, e.g. a wider `max-w-*` for long labels. */
  className?: string;
}

function isEmpty(value: React.ReactNode): boolean {
  return value == null || (typeof value === "string" && value.trim() === "");
}

// A string title only makes sense for string content; skip it otherwise.
function titleOf(value: React.ReactNode): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/**
 * Plain-text cell with truncation and an optional secondary sub-line. Constrains
 * width so long values ellipsize instead of stretching the column, and exposes the
 * full text via the native title tooltip. Falls back to the empty-value glyph.
 */
export function TextCell({ value, subLine, className }: TextCellProps) {
  if (isEmpty(value) && isEmpty(subLine)) {
    return <span className={cn("text-muted-foreground", className)}>{EMPTY}</span>;
  }

  return (
    <div className={cn("min-w-0 max-w-xs", className)}>
      <div className="truncate" title={titleOf(value)}>
        {isEmpty(value) ? <span className="text-muted-foreground">{EMPTY}</span> : value}
      </div>
      {!isEmpty(subLine) && (
        <div className="truncate text-xs text-muted-foreground" title={titleOf(subLine)}>
          {subLine}
        </div>
      )}
    </div>
  );
}
