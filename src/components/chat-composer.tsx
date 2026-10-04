import * as React from "react";
import { cn } from "../lib/utils";

export interface ChatComposerProps
  extends React.HTMLAttributes<HTMLDivElement> {
  /** Dim + block interaction (e.g. when the user is out of credits). */
  disabled?: boolean;
}

/*
 * Chat input shell — the rounded, bordered surface that holds the message
 * composer (textarea + action buttons + optional attachment chips).
 * Presentational only: the app fills it with primitives (Textarea, Button …)
 * and owns the send / upload / dictation behaviour. The shell provides the
 * card surface, the active (focus-within) look, and the disabled state. Active
 * follows the fields: in Default no ring, a sharper border, darker inside in dark.
 */
export const ChatComposer = React.forwardRef<HTMLDivElement, ChatComposerProps>(
  ({ disabled = false, className, ...props }, ref) => (
    <div
      ref={ref}
      data-disabled={disabled || undefined}
      className={cn(
        "flex flex-col gap-1 rounded-xl border border-input bg-card p-2 shadow-sm transition-colors",
        "focus-within:ring-2 focus-within:ring-field-ring focus-within:ring-offset-1 focus-within:ring-offset-field-ring-offset",
        "focus-within:border-input-focus focus-within:bg-composer-focus",
        disabled && "pointer-events-none opacity-60",
        className
      )}
      {...props}
    />
  )
);
ChatComposer.displayName = "ChatComposer";
