import * as React from "react";
import type { Table as TanStackTable } from "@tanstack/react-table";
import {
  ChevronLeft,
  ChevronRight,
  Columns3,
  ArrowUp,
  ArrowDown,
  X,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { SearchInput } from "../ui/search-input";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "../ui/dropdown-menu";

/* -------------------------------------------------------- TableSearch */

export interface TableSearchProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /**
   * Debounce onChange by this many ms. Leave unset when the state owner already
   * debounces (e.g. useTableQuery.setSearch), so debouncing does not double up.
   */
  debounceMs?: number;
  className?: string;
}

/**
 * The quick-filter search input. Always toolbar-left (via TablePage.search), also
 * exported for standalone use. Clears via the trailing button.
 */
export function TableSearch({
  value,
  onChange,
  placeholder = "Search...",
  debounceMs,
  className,
}: TableSearchProps) {
  const [local, setLocal] = React.useState(value);
  const timer = React.useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  // Keep local in sync when the source value changes externally (e.g. Clear).
  React.useEffect(() => setLocal(value), [value]);
  React.useEffect(() => () => clearTimeout(timer.current), []);

  const emit = (next: string) => {
    setLocal(next);
    if (!debounceMs) {
      onChange(next);
      return;
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => onChange(next), debounceMs);
  };

  return (
    <SearchInput
      value={local}
      onChange={(e) => emit(e.target.value)}
      onClear={() => emit("")}
      placeholder={placeholder}
      className={cn("w-full sm:w-64", className)}
    />
  );
}

/* ------------------------------------------------- TableColumnOptions */

export interface TableColumnOptionsProps<TData> {
  /** The ServerDataTable / DataTable's TanStack instance. */
  table: TanStackTable<TData>;
  /** Override display labels for columns whose header is not a plain string. */
  columnLabels?: Record<string, string>;
  /** Allow reordering columns (up/down). Default true. */
  enableReorder?: boolean;
  className?: string;
}

function columnLabel<TData>(
  table: TanStackTable<TData>,
  id: string,
  overrides?: Record<string, string>
): string {
  if (overrides?.[id]) return overrides[id];
  const header = table.getColumn(id)?.columnDef.header;
  return typeof header === "string" ? header : id;
}

/**
 * A menu to hide/show and reorder columns. Drives the table's columnVisibility /
 * columnOrder state. Always toolbar-right (via TablePage.columnOptions).
 */
export function TableColumnOptions<TData>({
  table,
  columnLabels,
  enableReorder = true,
  className,
}: TableColumnOptionsProps<TData>) {
  const columns = table.getAllLeafColumns().filter((c) => c.getCanHide());

  const move = (id: string, delta: number) => {
    const current = table.getState().columnOrder;
    const order = current.length ? [...current] : table.getAllLeafColumns().map((c) => c.id);
    const from = order.indexOf(id);
    const to = from + delta;
    if (from < 0 || to < 0 || to >= order.length) return;
    order.splice(to, 0, order.splice(from, 1)[0]);
    table.setColumnOrder(order);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="secondary" size="sm" className={className}>
          <Columns3 />
          Columns
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((column, i) => (
          <DropdownMenuCheckboxItem
            key={column.id}
            checked={column.getIsVisible()}
            onCheckedChange={(v) => column.toggleVisibility(!!v)}
            onSelect={(e) => e.preventDefault()}
            className="justify-between gap-2"
          >
            <span className="truncate">{columnLabel(table, column.id, columnLabels)}</span>
            {enableReorder && (
              <span className="flex items-center gap-0.5">
                <button
                  type="button"
                  aria-label="Move column up"
                  disabled={i === 0}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    move(column.id, -1);
                  }}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="size-3.5" />
                </button>
                <button
                  type="button"
                  aria-label="Move column down"
                  disabled={i === columns.length - 1}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    move(column.id, 1);
                  }}
                  className="rounded p-0.5 text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="size-3.5" />
                </button>
              </span>
            )}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/* ---------------------------------------------------- TablePagination */

export interface TablePaginationProps {
  pageIndex: number;
  pageCount: number;
  rowCount?: number;
  onPageChange: (index: number) => void;
  className?: string;
}

/** The table footer: "Page X of Y", "N total", and Prev/Next. */
export function TablePagination({
  pageIndex,
  pageCount,
  rowCount,
  onPageChange,
  className,
}: TablePaginationProps) {
  const totalPages = pageCount > 0 ? pageCount : 1;
  const canPrev = pageIndex > 0;
  const canNext = pageCount < 0 ? true : pageIndex < pageCount - 1;

  return (
    <div
      className={cn(
        "flex items-center justify-between gap-4 text-sm text-muted-foreground",
        className
      )}
    >
      <span>
        Page {pageIndex + 1} of {totalPages}
        {rowCount != null && (
          <>
            {" · "}
            {rowCount} total
          </>
        )}
      </span>
      <div className="flex gap-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(pageIndex - 1)}
          disabled={!canPrev}
        >
          <ChevronLeft />
          Previous
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onPageChange(pageIndex + 1)}
          disabled={!canNext}
        >
          Next
          <ChevronRight />
        </Button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------ TableFilterBar */

export interface TableFilterBarProps {
  children: React.ReactNode;
  /** Whether any filter is currently active (drives the auto Clear button). */
  active?: boolean;
  /** Called when the Clear button is pressed. Shown only when `active`. */
  onClear?: () => void;
  className?: string;
}

/**
 * Wraps filter controls with uniform spacing and shows a ghost "Clear" button
 * automatically whenever any filter is active.
 */
export function TableFilterBar({ children, active, onClear, className }: TableFilterBarProps) {
  return (
    <div className={cn("flex flex-wrap items-end gap-3", className)}>
      {children}
      {active && onClear && (
        <Button variant="ghost" size="sm" onClick={onClear}>
          <X />
          Clear
        </Button>
      )}
    </div>
  );
}
