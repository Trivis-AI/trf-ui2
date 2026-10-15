import * as React from "react";
import { cn } from "../../lib/utils";

/**
 * Low-level, dependency-free table primitives. Use these for simple/static tables.
 * For sorting/filtering/column-reorder/inline-edit, use DataTable (TanStack).
 */

function Table({
  className,
  containerClassName,
  ...props
}: React.HTMLAttributes<HTMLTableElement> & {
  /** Extra classes for the overflow wrapper (e.g. `xl:overflow-x-visible` so sticky headers work). */
  containerClassName?: string;
}) {
  return (
    <div className={cn("relative w-full overflow-x-auto", containerClassName)}>
      <table className={cn("w-full caption-bottom text-sm", className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn("[&_tr]:border-b [&_tr]:border-border", className)} {...props} />;
}

function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

function TableFooter({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tfoot
      className={cn("border-t border-border bg-muted/50 font-medium", className)}
      {...props}
    />
  );
}

// forwardRef so rows can be drag-reorder targets (dnd-kit needs the node), the
// same reason TableHead forwards its ref for column reordering.
const TableRow = React.forwardRef<HTMLTableRowElement, React.HTMLAttributes<HTMLTableRowElement>>(
  ({ className, ...props }, ref) => (
    <tr
      ref={ref}
      className={cn(
        "border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted",
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = "TableRow";

// The header tint is a background *image* (a flat gradient) rather than a colour:
// it is translucent, and sticky header cells set an opaque bg-background
// underneath it, so rows scrolling under a stuck header never show through.
// --table-head is half the meta pill's --sunken strength.
// Column rules (the grid's vertical lines) are inset shadows on the cells, not
// borders: the table collapses borders, and collapsed borders belong to the table,
// so they would stay behind when a header cell sticks. The last column has none;
// the table's own border closes the grid. A body cell right before a pinned column
// (data-pinned) has none either: pinned body cells draw their own left border.
const TableHead = React.forwardRef<
  HTMLTableCellElement,
  React.ThHTMLAttributes<HTMLTableCellElement>
>(({ className, ...props }, ref) => (
  <th
    ref={ref}
    className={cn(
      "h-10 px-3 text-left align-middle text-sm font-normal text-muted-foreground whitespace-nowrap [background-image:linear-gradient(var(--table-head),var(--table-head))] shadow-[inset_-1px_0_0_var(--border)] last:shadow-none [&:has([role=checkbox])]:pr-0",
      className
    )}
    {...props}
  />
));
TableHead.displayName = "TableHead";

export interface TableCellProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /**
   * The cell is the field. An editable cell has no padding, so an
   * `<Input variant="cell">` fills it, and it carries the states the input
   * does not draw: the field background on hover, the field-focus background
   * and an inset ring while something inside it has focus or is open (a
   * `SelectTrigger` or `DatePicker` with `variant="cell"`). Nothing sits
   * inside anything; the row reads as one surface with the figures beside it.
   */
  editable?: boolean;
  /** A validation error on this cell: an inset destructive ring. */
  invalid?: boolean;
}

// The inset ring and the column rule are both box-shadow layers (Tailwind v4
// composes ring and shadow), so the ring draws over the rule at the right edge
// instead of replacing it.
function TableCell({ className, editable, invalid, ...props }: TableCellProps) {
  return (
    <td
      className={cn(
        "px-3 py-2 align-middle shadow-[inset_-1px_0_0_var(--border)] last:shadow-none [&:has(+[data-pinned])]:shadow-none [&:has([role=checkbox])]:pr-0",
        editable &&
          "group p-0 transition-colors hover:bg-field has-[:focus-visible]:bg-field-focus has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-inset has-[:focus-visible]:ring-field-ring has-[[data-state=open]]:bg-field-focus has-[[data-state=open]]:ring-2 has-[[data-state=open]]:ring-inset has-[[data-state=open]]:ring-field-ring",
        invalid && "ring-2 ring-inset ring-destructive",
        className
      )}
      {...props}
    />
  );
}

function TableCaption({ className, ...props }: React.HTMLAttributes<HTMLTableCaptionElement>) {
  return <caption className={cn("mt-4 text-sm text-muted-foreground", className)} {...props} />;
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
};
