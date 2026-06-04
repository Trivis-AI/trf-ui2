import * as React from "react";
import { cn } from "../../lib/utils";

export interface TableCardProps extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  title?: React.ReactNode;
  /** Right-aligned header actions (buttons, filters). */
  actions?: React.ReactNode;
  /** Footer area (pagination, totals). */
  footer?: React.ReactNode;
}

/**
 * A bordered card sized for a table: optional header (title + actions), a borderless `Table`/
 * `DataTable` inside, and an optional footer. The card supplies the border — put a plain table in.
 */
export function TableCard({
  title,
  actions,
  footer,
  className,
  children,
  ...props
}: TableCardProps) {
  return (
    <div
      className={cn("overflow-hidden rounded-lg border border-border bg-card text-card-foreground", className)}
      {...props}
    >
      {(title != null || actions != null) && (
        <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          {title != null && <div className="text-sm font-semibold">{title}</div>}
          {actions != null && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
      {footer != null && <div className="border-t border-border px-4 py-3">{footer}</div>}
    </div>
  );
}
