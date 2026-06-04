import * as React from "react";
import { cn } from "../lib/utils";

const COLS = {
  1: "sm:grid-cols-1",
  2: "sm:grid-cols-2",
  3: "sm:grid-cols-3",
  4: "sm:grid-cols-4",
} as const;

export interface InfoGridProps extends React.HTMLAttributes<HTMLDListElement> {
  /** Columns at >= sm. Default 2. */
  columns?: keyof typeof COLS;
}

/** A responsive grid of label/value pairs for detail/summary views. */
export function InfoGrid({ columns = 2, className, ...props }: InfoGridProps) {
  return (
    <dl
      className={cn("grid grid-cols-1 gap-x-6 gap-y-4", COLS[columns], className)}
      {...props}
    />
  );
}

export interface InfoFieldProps extends React.HTMLAttributes<HTMLDivElement> {
  label: React.ReactNode;
  /** The value (text, Badge, etc.). */
  children: React.ReactNode;
}

export function InfoField({ label, children, className, ...props }: InfoFieldProps) {
  return (
    <div className={cn("flex flex-col gap-0.5", className)} {...props}>
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm">{children}</dd>
    </div>
  );
}
