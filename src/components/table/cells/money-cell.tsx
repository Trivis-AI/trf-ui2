import * as React from "react";
import { cn } from "../../../lib/utils";

// Empty placeholder glyph for table cells. The long dash is the agreed data
// convention for a missing value (per the table plan), not prose copy.
const EMPTY = "—";

export interface MoneyCellProps {
  /**
   * The amount. Backend strings are passed through verbatim (apps do not format
   * client-side today), so pass the exact string you want shown, e.g. "1 234,50".
   */
  value: string | number | null | undefined;
  /**
   * Color by sign: negative -> destructive, positive -> success, zero -> neutral.
   * The value itself is never rewritten, only tinted.
   */
  signed?: boolean;
  /** Optional trailing unit (currency code / symbol) rendered muted after the amount. */
  currency?: React.ReactNode;
  className?: string;
}

function isEmpty(value: unknown): boolean {
  return value == null || (typeof value === "string" && value.trim() === "");
}

// Pragmatic sign detection that tolerates thousands separators and either decimal
// convention: a leading minus (before the first digit) means negative, any other
// nonzero digit means positive.
function amountSign(value: string | number): -1 | 0 | 1 {
  if (typeof value === "number") return value < 0 ? -1 : value > 0 ? 1 : 0;
  const s = value.trim();
  if (/-\s*\d/.test(s) || /^-/.test(s)) return -1;
  return /[1-9]/.test(s) ? 1 : 0;
}

/**
 * The one canonical amount cell: right-aligned, monospace, tabular figures so
 * columns of numbers line up. Use for every money / amount column instead of
 * per-page styling. The `signed` variant tints by sign for ledger-style deltas.
 */
export function MoneyCell({ value, signed, currency, className }: MoneyCellProps) {
  if (isEmpty(value)) {
    return (
      <span className={cn("block text-right font-mono tabular-nums text-muted-foreground", className)}>
        {EMPTY}
      </span>
    );
  }

  const sign = signed ? amountSign(value as string | number) : 0;
  return (
    <span
      className={cn(
        "block text-right font-mono tabular-nums",
        sign < 0 && "text-destructive",
        sign > 0 && "text-success",
        className
      )}
    >
      {value}
      {currency != null && <span className="ml-1 text-muted-foreground">{currency}</span>}
    </span>
  );
}
