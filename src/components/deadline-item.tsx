import * as React from "react";
import { cn } from "../lib/utils";

export interface DeadlineItemProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Short month label for the date chip, e.g. "OKT". */
  month: React.ReactNode;
  /** Day of month for the date chip, e.g. "10". */
  day: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Optional action, usually a link-styled Button. */
  action?: React.ReactNode;
}

/**
 * A dated deadline / notification row: a calendar chip (month + day)
 * next to a title, muted description and an optional action.
 */
export function DeadlineItem({
  month,
  day,
  title,
  description,
  action,
  className,
  ...props
}: DeadlineItemProps) {
  return (
    <div className={cn("flex items-start gap-3", className)} {...props}>
      <span className="flex h-12 w-11 shrink-0 flex-col items-center justify-center rounded-md bg-primary text-primary-foreground">
        <span className="text-xs uppercase leading-none">{month}</span>
        <span className="text-lg font-semibold leading-tight">{day}</span>
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-semibold">{title}</span>
        {description != null && (
          <span className="text-xs text-muted-foreground">{description}</span>
        )}
        {action != null && <span className="mt-0.5">{action}</span>}
      </span>
    </div>
  );
}
