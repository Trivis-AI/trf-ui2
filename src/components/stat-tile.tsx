import * as React from "react";
import { cn } from "../lib/utils";
import { Card, CardContent } from "./ui/card";

export interface StatTileProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Short muted label above the figure, e.g. "Revenue YTD". */
  label: React.ReactNode;
  /** The figure itself. Rendered in mono, semibold. */
  value: React.ReactNode;
  /** Muted subtext under the figure, e.g. source or synced-at info. */
  sub?: React.ReactNode;
}

/**
 * Dashboard KPI tile: label + light-weight figure + muted subtext.
 * Graduated from the hand-rolled Card+Text tiles in frontlogin's AccountOverview.
 */
export function StatTile({ label, value, sub, className, ...props }: StatTileProps) {
  return (
    <Card className={cn("flex-1", className)} {...props}>
      <CardContent className="flex flex-col gap-1 p-5">
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="text-2xl font-light tabular-nums">{value}</span>
        {sub != null && <span className="text-xs text-muted-foreground">{sub}</span>}
      </CardContent>
    </Card>
  );
}
