import * as React from "react";
import { cn } from "../lib/utils";
import { tr } from "../lib/i18n";

export interface TypingIndicatorProps
  extends React.HTMLAttributes<HTMLSpanElement> {
  /** Optional text rendered after the dots, e.g. "Thinking…". */
  label?: React.ReactNode;
}

/*
 * Three bouncing dots — the streaming / "agent is thinking" indicator.
 * Inherits color from the surrounding text (`bg-current`), so it adapts to
 * whatever bubble or surface it sits in. Animation is the built-in `animate-bounce`,
 * staggered by negative delays so the dots ripple.
 */
export function TypingIndicator({
  label,
  className,
  ...props
}: TypingIndicatorProps) {
  return (
    <span
      role="status"
      aria-label={typeof label === "string" ? label : tr("<trn-ui-loading>", "Loading")}
      className={cn(
        "inline-flex items-center gap-2 text-muted-foreground",
        className
      )}
      {...props}
    >
      <span className="inline-flex gap-1" aria-hidden="true">
        <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.3s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-current [animation-delay:-0.15s]" />
        <span className="size-1.5 animate-bounce rounded-full bg-current" />
      </span>
      {label != null && <span className="text-sm">{label}</span>}
    </span>
  );
}
