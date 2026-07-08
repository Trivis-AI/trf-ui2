import * as React from "react";
import { cn } from "../../../lib/utils";

export type MeterTone = "primary" | "success" | "warning" | "destructive";

export interface MeterCellProps {
  /** Current amount (e.g. matched rows). */
  value: number;
  /** Total the value is measured against (e.g. total rows). */
  max: number;
  /** Optional prefix before the count, e.g. "Matched". */
  label?: React.ReactNode;
  /** Fill tone. Default "primary". */
  tone?: MeterTone;
  /** Show the "value / max" count above the bar. Default true. */
  showCount?: boolean;
  className?: string;
}

const toneFill: Record<MeterTone, string> = {
  primary: "bg-primary",
  success: "bg-success",
  warning: "bg-warning",
  destructive: "bg-destructive",
};

/**
 * A determinate progress meter for a cell ("Matched 12 / 40"), as the statement
 * list uses. A muted track with a token-colored fill plus an optional count.
 * Falls back to an em-dash when the value or max is missing or invalid.
 */
export function MeterCell({
  value,
  max,
  label,
  tone = "primary",
  showCount = true,
  className,
}: MeterCellProps) {
  if (
    value == null ||
    max == null ||
    !Number.isFinite(value) ||
    !Number.isFinite(max) ||
    max <= 0
  ) {
    return <span className="text-muted-foreground">—</span>;
  }

  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div
      className={cn("flex min-w-24 flex-col gap-1", className)}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
    >
      {showCount && (
        <span className="text-xs text-muted-foreground">
          {label != null && label !== "" && <span className="mr-1">{label}</span>}
          <span className="font-mono tabular-nums text-foreground">{value}</span>
          <span className="mx-0.5">/</span>
          <span className="font-mono tabular-nums">{max}</span>
        </span>
      )}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full", toneFill[tone])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
