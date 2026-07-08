import { Check, X } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Badge } from "../../ui/badge";

// Empty placeholder glyph for table cells. The long dash is the agreed data
// convention for a missing value (per the table plan), not prose copy.
const EMPTY = "—";

export type BooleanCellVariant = "badge" | "icon";

export interface BooleanCellProps {
  value: boolean | null | undefined;
  /** `badge` -> a Yes/No pill (default); `icon` -> a check / cross glyph. */
  variant?: BooleanCellVariant;
  /** Label for the true state. Default "Yes". Also the icon's aria-label / tooltip. */
  trueLabel?: string;
  /** Label for the false state. Default "No". Also the icon's aria-label / tooltip. */
  falseLabel?: string;
  className?: string;
}

/**
 * Boolean cell as a Yes/No badge or a check / cross icon (Matched, Posted, Has
 * profile). The icon variant is icon-only, so it carries an aria-label and title
 * with the full text per the table guardrails. Null/undefined falls back to the
 * empty-value glyph.
 */
export function BooleanCell({
  value,
  variant = "badge",
  trueLabel = "Yes",
  falseLabel = "No",
  className,
}: BooleanCellProps) {
  if (value == null) {
    return <span className={cn("text-muted-foreground", className)}>{EMPTY}</span>;
  }

  const label = value ? trueLabel : falseLabel;

  if (variant === "icon") {
    const Icon = value ? Check : X;
    return (
      <span
        className={cn(
          "inline-flex items-center",
          value ? "text-success" : "text-muted-foreground",
          className
        )}
        role="img"
        aria-label={label}
        title={label}
      >
        <Icon className="size-4" aria-hidden="true" />
      </span>
    );
  }

  return (
    <Badge variant={value ? "success" : "outline"} className={className}>
      {label}
    </Badge>
  );
}
