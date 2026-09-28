import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/utils";

const countRowVariants = cva(
  "flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors",
  {
    variants: {
      tone: {
        default: "bg-muted hover:bg-accent",
        warning: "bg-warning/25 hover:bg-warning/35",
      },
    },
    defaultVariants: { tone: "default" },
  }
);

export interface CountRowProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "title">,
    VariantProps<typeof countRowVariants> {
  /** What the count is, e.g. "Unconfirmed purchase invoices". */
  title: React.ReactNode;
  /** Muted context line under the title, e.g. "2 waiting over 3 days". */
  subtitle?: React.ReactNode;
  /** The count itself. Rendered large, mono, semibold. */
  count: React.ReactNode;
}

/**
 * A clickable "things to do" count row for dashboards: title + context
 * on the left, a large count on the right. `tone="warning"` highlights
 * the row that needs attention first.
 */
export function CountRow({ title, subtitle, count, tone, className, ...props }: CountRowProps) {
  return (
    <button type="button" className={cn(countRowVariants({ tone }), className)} {...props}>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="text-sm font-medium">{title}</span>
        {subtitle != null && <span className="text-xs text-muted-foreground">{subtitle}</span>}
      </span>
      <span className="font-mono text-xl font-semibold tabular-nums">{count}</span>
    </button>
  );
}
