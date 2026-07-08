import * as React from "react";
import { cn } from "../../../lib/utils";
import { StatusBadge, type StatusTone } from "../../ui/status-badge";

export interface StatusCellProps {
  /** Pill tone. Map your domain status to a tone once per app, then reuse it. */
  tone?: StatusTone;
  /** Status label shown inside the pill (e.g. "Paid", "Overdue"). */
  label: React.ReactNode;
  /**
   * Optional inline sub-text under the pill, for the secondary detail the audit
   * found on several pages (hold-until date, last error, ...).
   */
  subText?: React.ReactNode;
  className?: string;
}

const isEmpty = (v: React.ReactNode) => v == null || v === "";

/**
 * A `StatusBadge` pill for the status column, with an optional inline sub-line.
 * Use this everywhere a table shows status, never ad-hoc colored text (4.6).
 * Falls back to an em-dash when there is no label.
 */
export function StatusCell({ tone, label, subText, className }: StatusCellProps) {
  if (isEmpty(label)) {
    return <span className="text-muted-foreground">—</span>;
  }
  return (
    <div className={cn("flex flex-col gap-0.5", className)}>
      <StatusBadge tone={tone} className="w-fit">
        {label}
      </StatusBadge>
      {!isEmpty(subText) && (
        <span className="text-xs text-muted-foreground">{subText}</span>
      )}
    </div>
  );
}
