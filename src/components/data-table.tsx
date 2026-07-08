import * as React from "react";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type CellContext,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type SortingState,
} from "@tanstack/react-table";
import { cn } from "../lib/utils";
import { Input } from "./ui/input";
import { TableView } from "./table/table-view";

// Column meta (`editable`, `align`) and table meta (`updateData`) are declared in
// ./table/table-view (the shared render core). Importing TableView brings the
// augmentation into scope here.

export interface DataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  /** Click headers to sort. Default true. */
  enableSorting?: boolean;
  /** Show a search box that filters across all columns. Default false. */
  enableGlobalFilter?: boolean;
  /** Drag headers to reorder columns. Default false. Requires every column to have an `id`. */
  enableColumnReorder?: boolean;
  /** Client-side pagination at this page size. Omit for no pagination. */
  pageSize?: number;
  /**
   * Enables inline editing for columns with `meta: { editable: true }`.
   * Called on commit (blur / Enter). You update your own data.
   */
  onCellEdit?: (rowIndex: number, columnId: string, value: unknown) => void;
  emptyMessage?: React.ReactNode;
  className?: string;
}

// Inline text editor used for columns flagged `meta.editable`.
function EditableCell<TData>({ getValue, row, column, table }: CellContext<TData, unknown>) {
  const initial = getValue();
  const [value, setValue] = React.useState(initial);
  React.useEffect(() => setValue(initial), [initial]);
  const align = column.columnDef.meta?.align;
  return (
    <input
      className={cn(
        "-mx-1 w-full rounded-sm bg-transparent px-1 py-0.5 outline-none",
        "hover:bg-muted/60 focus:bg-background focus:ring-2 focus:ring-ring",
        align === "right" && "text-right font-mono tabular-nums",
        align === "center" && "text-center"
      )}
      value={value as string}
      onChange={(e) => setValue(e.target.value)}
      onBlur={() => table.options.meta?.updateData?.(row.index, column.id, value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") e.currentTarget.blur();
        if (e.key === "Escape") {
          setValue(initial);
          e.currentTarget.blur();
        }
      }}
    />
  );
}

export function DataTable<TData>({
  columns,
  data,
  enableSorting = true,
  enableGlobalFilter = false,
  enableColumnReorder = false,
  pageSize,
  onCellEdit,
  emptyMessage = "No results.",
  className,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [columnOrder, setColumnOrder] = React.useState<ColumnOrderState>(() =>
    columns.map((c) => c.id as string).filter(Boolean)
  );

  // If editing is on, swap editable columns to the inline editor (preserving their other defs).
  const resolvedColumns = React.useMemo(() => {
    if (!onCellEdit) return columns;
    return columns.map((col) =>
      col.meta?.editable ? { ...col, cell: EditableCell } : col
    );
  }, [columns, onCellEdit]);

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      ...(enableColumnReorder ? { columnOrder } : {}),
    },
    enableSorting,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    onColumnOrderChange: setColumnOrder,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    ...(pageSize ? { getPaginationRowModel: getPaginationRowModel() } : {}),
    initialState: pageSize ? { pagination: { pageSize } } : {},
    meta: onCellEdit ? { updateData: onCellEdit } : undefined,
  });

  return (
    <div className="flex flex-col gap-3">
      {enableGlobalFilter && (
        <Input
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          placeholder="Search…"
          className="max-w-xs"
        />
      )}

      <TableView
        table={table}
        className={className}
        emptyMessage={emptyMessage}
        stickyHeader={false}
        enableColumnReorder={enableColumnReorder}
      />

      {pageSize && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount() || 1}
            {" · "}
            {table.getFilteredRowModel().rows.length} rows
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded-md border border-input px-2 py-1 disabled:opacity-50"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Previous
            </button>
            <button
              type="button"
              className="rounded-md border border-input px-2 py-1 disabled:opacity-50"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
