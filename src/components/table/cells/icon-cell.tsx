import type { LucideIcon } from "lucide-react";
import { cn } from "../../../lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../ui/tooltip";

export interface IconCellProps {
  /** Lucide icon standing in for the value (payment method, direction, ...). */
  icon: LucideIcon;
  /**
   * Full text the icon represents. Always required: it is the accessible label,
   * the tooltip content when icon-only, and the visible text otherwise.
   */
  label: string;
  /**
   * Hide the text and show the icon only, to save column width. The label stays
   * reachable via a tooltip and `aria-label` (the icon-only guardrail in 4.6).
   */
  iconOnly?: boolean;
  className?: string;
}

/**
 * A Lucide icon standing in for a text value in a cell. With `iconOnly` the icon
 * carries a tooltip and `aria-label` with the full text, so no icon is ever
 * unlabeled. Otherwise the icon sits next to its visible label.
 */
export function IconCell({ icon: Icon, label, iconOnly, className }: IconCellProps) {
  if (iconOnly) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <span
              aria-label={label}
              tabIndex={0}
              className={cn(
                "inline-flex items-center rounded-sm text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring",
                className
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
            </span>
          </TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <Icon className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
}
