import * as React from "react";
import { cn } from "../lib/utils";

export interface MeterProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Fill fraction, 0..1. Clamped. */
  value: number;
  /** Optional left label. With `label` or `valueLabel` the meter renders as a full row. */
  label?: React.ReactNode;
  /** Optional right-hand value text. */
  valueLabel?: React.ReactNode;
}

/**
 * Standalone horizontal meter bar (the non-table sibling of MeterCell).
 * Bare `<Meter value={0.4} />` renders just the track; adding `label` /
 * `valueLabel` renders a labelled row: label, bar, mono value.
 */
export function Meter({ value, label, valueLabel, className, ...props }: MeterProps) {
  const frac = Math.min(1, Math.max(0, value));
  const bar = (
    <div
      role="meter"
      aria-valuemin={0}
      aria-valuemax={1}
      aria-valuenow={frac}
      className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", label == null && valueLabel == null && className)}
      {...(label == null && valueLabel == null ? props : {})}
    >
      <div className="h-full rounded-full bg-primary" style={{ width: `${frac * 100}%` }} />
    </div>
  );
  if (label == null && valueLabel == null) return bar;
  return (
    <div className={cn("flex w-full items-center gap-3", className)} {...props}>
      {label != null && (
        <span className="w-40 shrink-0 truncate text-xs text-muted-foreground">{label}</span>
      )}
      <div className="min-w-0 flex-1">{bar}</div>
      {valueLabel != null && (
        <span className="w-20 shrink-0 text-right text-xs tabular-nums">{valueLabel}</span>
      )}
    </div>
  );
}
