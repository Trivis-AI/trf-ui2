import * as React from "react";
import { ExternalLink } from "lucide-react";
import { cn } from "../../../lib/utils";
import { CellHoverCard, type HoverCardSeamProps } from "./hover-card-seam";

/**
 * LinkCell — a referential or external link inside a cell (a linked customer name,
 * a document URL, a mailto/tel). This is NOT for row-open navigation: opening the
 * item is whole-row click via ServerDataTable's onRowClick (guardrail 4.6), never
 * an "Open" link. The click stops propagation so it coexists with row-click nav.
 * Renders an em-dash fallback when there is nothing to link.
 */
export interface LinkCellProps extends HoverCardSeamProps {
  /** Destination. When absent (and no children) the empty fallback renders. */
  href?: string | null;
  /** Link text. Falls back to `href` when omitted. */
  children?: React.ReactNode;
  /** Open in a new tab and show a trailing external-link icon. */
  external?: boolean;
  onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void;
  /** Shown when there is no href and no children. Default em-dash. */
  empty?: React.ReactNode;
  className?: string;
}

export function LinkCell({
  href,
  children,
  external = false,
  onClick,
  empty = "—",
  className,
  hoverCard,
}: LinkCellProps) {
  const label = children ?? href;

  if (!href || label == null || label === "") {
    return <span className="text-muted-foreground">{empty}</span>;
  }

  return (
    <CellHoverCard hoverCard={hoverCard}>
      <a
        href={href}
        onClick={(e) => {
          // Coexist with whole-row click navigation.
          e.stopPropagation();
          onClick?.(e);
        }}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        className={cn(
          "inline-flex items-center gap-1 text-primary underline-offset-4 hover:underline",
          className
        )}
      >
        <span className="truncate">{label}</span>
        {external && <ExternalLink aria-hidden className="size-3.5 shrink-0" />}
      </a>
    </CellHoverCard>
  );
}
