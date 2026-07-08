import * as React from "react";
import { cn } from "../../../lib/utils";
import { Badge, type BadgeVariant } from "../../ui/badge";

export interface BadgeListItem {
  /** Text shown inside the badge. */
  label: React.ReactNode;
  /** Per-item variant override. Falls back to the cell's `variant`. */
  variant?: BadgeVariant;
  /** Render this badge's label in the mono font (codes, dimensions, CPA). */
  mono?: boolean;
  /** Stable key; falls back to the index. */
  key?: string | number;
}

export interface BadgeListCellProps {
  /** Badges to render. Bare strings are treated as `{ label }`. */
  items: Array<BadgeListItem | string>;
  /** Default variant for items that do not set their own. Default "secondary". */
  variant?: BadgeVariant;
  /** Render every badge in the mono font (overridable per item). */
  mono?: boolean;
  /** Cap the visible badges, collapsing the rest into a "+N" outline badge. */
  max?: number;
  className?: string;
}

const toItem = (item: BadgeListItem | string): BadgeListItem =>
  typeof item === "string" ? { label: item } : item;

/**
 * One or more `Badge`s in a cell (bundle, format, tags, dimensions, CPA codes),
 * including mono badges. Wraps to multiple lines and can collapse overflow into a
 * "+N" badge. Falls back to an em-dash when the list is empty.
 */
export function BadgeListCell({
  items,
  variant = "secondary",
  mono = false,
  max,
  className,
}: BadgeListCellProps) {
  if (!items || items.length === 0) {
    return <span className="text-muted-foreground">—</span>;
  }

  const normalized = items.map(toItem);
  const capped = max != null && max >= 0 ? normalized.slice(0, max) : normalized;
  const overflow = normalized.length - capped.length;

  return (
    <div className={cn("flex flex-wrap items-center gap-1", className)}>
      {capped.map((item, i) => (
        <Badge
          key={item.key ?? i}
          variant={item.variant ?? variant}
          className={cn((item.mono ?? mono) && "font-mono")}
        >
          {item.label}
        </Badge>
      ))}
      {overflow > 0 && (
        <Badge variant="outline" className="font-mono tabular-nums">
          +{overflow}
        </Badge>
      )}
    </div>
  );
}
