import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../../../lib/utils";

/**
 * Hover-card seam for standard table cells (plan 4.7).
 *
 * Any cell renderer can accept a `hoverCard` node and wrap its content with
 * `CellHoverCard` so that extra detail (for example a Total Gross cell revealing
 * the net / tax / rounding breakdown, or a Payable cell revealing the
 * calculation) can surface on hover, without ever changing the ColumnDef
 * contract.
 *
 * Implementation: composed from the house Radix `Popover` primitive, driven by
 * hover/focus intent rather than click. `@radix-ui/react-hover-card` is not a
 * dependency, so we open the popover on mouseenter/focus and close it on
 * mouseleave/blur (with a small delay so the pointer can travel from the trigger
 * onto the card), plus Escape to dismiss. When `hoverCard` is absent this renders
 * the children exactly as before — a plain, inert cell.
 */
export interface HoverCardSeamProps {
  /** Extra detail to reveal on hover. Omit for a plain cell. Seam reserved, see file header. */
  hoverCard?: React.ReactNode;
}

// Small delay (ms) so moving the pointer from the trigger onto the card does not
// close it in the gap between the two elements.
const OPEN_DELAY = 120;
const CLOSE_DELAY = 120;

// Per-instance controller shape used by the module-level single-open guard.
interface CardController {
  clear: () => void;
  open: () => void;
  close: () => void;
}

// Only one hover card may be open at a time. Each cell renders its own Popover with
// its own open-state and timers, and Popover instances do not coordinate — so when
// the pointer travels between cells the previous card's close timer races the next
// card's open, and on some browsers/event timings both stay open (a stacked "dual"
// card). This module-level reference to the currently-open card lets a card that is
// opening force-close any other synchronously, which is the real dismissal guarantee.
let activeCard: CardController | null = null;

export function CellHoverCard({
  hoverCard,
  children,
}: HoverCardSeamProps & { children: React.ReactNode }) {
  // Absent hoverCard: behave exactly as a plain cell, no popover machinery.
  if (!hoverCard) return <>{children}</>;
  return <HoverCardImpl hoverCard={hoverCard}>{children}</HoverCardImpl>;
}

function HoverCardImpl({
  hoverCard,
  children,
}: {
  hoverCard: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const timer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Stable per-instance controller (created once) so `activeCard` can identify and
  // force-close exactly this card. Methods read stable refs / setState only.
  const controller = React.useRef<CardController | null>(null);
  if (controller.current === null) {
    const self: CardController = {
      clear: () => {
        if (timer.current) {
          clearTimeout(timer.current);
          timer.current = null;
        }
      },
      open: () => {
        self.clear();
        // Close whichever other card is open before we take its place.
        if (activeCard && activeCard !== self) activeCard.close();
        activeCard = self;
        setOpen(true);
      },
      close: () => {
        self.clear();
        if (activeCard === self) activeCard = null;
        setOpen(false);
      },
    };
    controller.current = self;
  }
  const card = controller.current;

  const schedule = (fn: () => void, delay: number) => {
    card.clear();
    timer.current = setTimeout(fn, delay);
  };
  const openSoon = () => schedule(card.open, OPEN_DELAY);
  const closeSoon = () => schedule(card.close, CLOSE_DELAY);

  // On unmount, drop the timer and release the global slot if we hold it.
  React.useEffect(() => () => card.close(), [card]);

  // Route Radix-driven changes (Escape, outside interaction) through the guard too,
  // so the global slot stays in sync.
  const onOpenChange = (next: boolean) => (next ? card.open() : card.close());

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {/*
        asChild merges the trigger (ref, aria-*, and these hover/focus handlers)
        onto the cell's own single root element, so there is no extra DOM node and
        cell layout is untouched. Each cell keeps its own visual affordance.
        tabIndex makes the detail reachable by keyboard.
      */}
      <PopoverPrimitive.Trigger
        asChild
        tabIndex={0}
        onMouseEnter={openSoon}
        onMouseLeave={closeSoon}
        onFocus={openSoon}
        onBlur={closeSoon}
      >
        {children}
      </PopoverPrimitive.Trigger>
      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          align="center"
          sideOffset={6}
          // Do not steal focus on open (this is a hover reveal, not a click
          // dialog); keep the trigger focused so blur can still close it.
          onOpenAutoFocus={(e) => e.preventDefault()}
          onMouseEnter={card.clear}
          onMouseLeave={closeSoon}
          className={cn(
            "z-50 w-auto min-w-56 max-w-xs rounded-md border border-border bg-popover p-3",
            "text-sm text-popover-foreground shadow-md outline-none"
          )}
        >
          {hoverCard}
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}

export interface AmountBreakdownRow {
  label: React.ReactNode;
  value: React.ReactNode;
  /** Emphasize this row (the final / total line): stronger weight, a top divider. */
  emphasis?: boolean;
}

export interface AmountBreakdownProps {
  rows: AmountBreakdownRow[];
  className?: string;
}

/**
 * Presentational body for a money cell's hover card: a tight two-column
 * label / value grid. Values are right-aligned and tabular so digits line up;
 * an `emphasis` row (e.g. Payable / Total) is separated by a divider and shown
 * in the foreground weight. Pair with `CellHoverCard` via a cell's `hoverCard`.
 */
export function AmountBreakdown({ rows, className }: AmountBreakdownProps) {
  return (
    <div className={cn("grid grid-cols-[auto_1fr] gap-x-6 gap-y-1", className)}>
      {rows.map((row, i) => (
        <div key={i} className="contents">
          <span
            className={cn(
              "text-muted-foreground",
              row.emphasis && "mt-1 border-t border-border pt-2 font-medium text-foreground"
            )}
          >
            {row.label}
          </span>
          <span
            className={cn(
              "text-right font-mono tabular-nums text-foreground",
              row.emphasis && "mt-1 border-t border-border pt-2 font-medium"
            )}
          >
            {row.value}
          </span>
        </div>
      ))}
    </div>
  );
}
