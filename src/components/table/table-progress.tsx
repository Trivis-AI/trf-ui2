import * as React from "react";
import { cn } from "../../lib/utils";

export interface TableProgressProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "role"> {
  /**
   * Omit for an indeterminate sweep (default, used while a server refetch is in
   * flight with unknown duration). Pass 0-100 for a determinate bar.
   */
  value?: number;
}

/**
 * The thin (4px) loading line pinned under a table header. Gray track with a
 * primary-colored bar. Purely presentational: position it with a wrapper (see
 * TableView, which absolutely-positions it under the sticky header so it overlays
 * and never shifts rows).
 */
export function TableProgress({ value, className, ...props }: TableProgressProps) {
  const indeterminate = value == null;
  const clamped = indeterminate ? 0 : Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-busy={indeterminate || undefined}
      aria-valuemin={indeterminate ? undefined : 0}
      aria-valuemax={indeterminate ? undefined : 100}
      aria-valuenow={indeterminate ? undefined : clamped}
      className={cn("h-1 w-full overflow-hidden bg-muted", className)}
      {...props}
    >
      <div
        className={cn(
          "h-full bg-primary",
          indeterminate
            ? "w-1/3 animate-table-progress"
            : "transition-[width] duration-200 ease-out"
        )}
        style={indeterminate ? undefined : { width: `${clamped}%` }}
      />
    </div>
  );
}
