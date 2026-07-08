import * as React from "react";

/**
 * Reserved hover-card seam for standard table cells (plan 4.7).
 *
 * Any cell renderer can accept a `hoverCard` node and wrap its content with
 * `CellHoverCard` so that extra detail (for example a Total Gross cell revealing
 * the net / tax / rounding breakdown, or a Payable cell revealing the
 * calculation) can surface on hover, without ever changing the ColumnDef
 * contract.
 *
 * The rich hover-card popover primitive is not built yet, so this currently
 * renders the cell content as-is. When the primitive lands it is wired here once
 * and every cell that already forwards `hoverCard` lights up, with no changes to
 * any column definition. This is the seam, reserved now, filled later.
 */
export interface HoverCardSeamProps {
  /** Extra detail to reveal on hover. Omit for a plain cell. Seam reserved, see file header. */
  hoverCard?: React.ReactNode;
}

export function CellHoverCard({
  hoverCard,
  children,
}: HoverCardSeamProps & { children: React.ReactNode }) {
  if (!hoverCard) return <>{children}</>;
  // Seam reserved: no hover-card popover primitive exists yet, so the detail is
  // held here and not yet rendered. Wiring lands with the primitive.
  return <>{children}</>;
}
