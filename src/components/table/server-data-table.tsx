import * as React from "react";
import {
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
  type CellContext,
  type ColumnDef,
  type OnChangeFn,
  type SortingState,
  type Updater,
  type VisibilityState,
} from "@tanstack/react-table";
import { TableView } from "./table-view";
import { InlineEditCell } from "./inline-edit-cell";

// Resolve a TanStack updater (value or (prev) => next) against the current value.
function resolveUpdater<T>(updater: Updater<T>, current: T): T {
  return typeof updater === "function" ? (updater as (old: T) => T)(current) : updater;
}

export interface ServerDataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  /** The current page of rows (already fetched from the server). */
  data: TData[];

  // Pagination (controlled, server-side).
  pageIndex: number;
  pageSize: number;
  /** Total pages from the server; -1 if unknown. */
  pageCount: number;
  /** Total rows, for the "N total" footer. */
  rowCount?: number;
  onPaginationChange: (next: { pageIndex: number; pageSize: number }) => void;

  // Sorting (controlled, server-side). Per column via ColumnDef.enableSorting.
  sorting?: SortingState;
  onSortingChange?: (next: SortingState) => void;

  // Column options (client-side view state). Uncontrolled by default; pass both
  // props to control/persist.
  columnVisibility?: Record<string, boolean>;
  onColumnVisibilityChange?: (next: Record<string, boolean>) => void;
  columnOrder?: string[];
  onColumnOrderChange?: (next: string[]) => void;

  // Row selection (optional).
  enableRowSelection?: boolean;
  /** Header select-all checkbox. Default true. Turn off per table. */
  enableSelectAll?: boolean;
  selectedRowIds?: Record<string, boolean>;
  onSelectedRowIdsChange?: (next: Record<string, boolean>) => void;
  getRowId?: (row: TData) => string;
  /** Bulk toolbar shown in place of the column-header row while rows are selected. */
  bulkActions?: React.ReactNode;

  // Inline editing (optional). Columns opt in with `meta.editor`; without this
  // handler those columns render normally, so adding an editor descriptor is
  // inert until the page is ready to persist the change.
  //
  // Fires on commit: immediately for select and switch, on blur/Enter for text
  // and number. The page owns persistence — optimistically update the row, then
  // roll back and surface the failure if the write is rejected.
  onCellEdit?: (rowId: string, columnId: string, value: unknown) => void;
  /** Render inline editors as plain display cells (e.g. no write permission). */
  readOnly?: boolean;

  // Expandable detail sub-row. Toggle a row via row.toggleExpanded() from a cell.
  renderSubRow?: (row: TData) => React.ReactNode;

  // Loading model.
  /** Cold load, no rows yet: skeleton rows. */
  loading?: boolean;
  /** Refetch with rows on screen: header progress line, rows stay. */
  fetching?: boolean;

  // Interaction / presentation.
  onRowClick?: (row: TData) => void;
  /** With `renderSubRow`, clicking anywhere on a row toggles its detail. */
  expandOnRowClick?: boolean;
  rowClassName?: (row: TData) => string | undefined;
  /** Default true. */
  stickyHeader?: boolean;
  /** Default false (auto-on above a threshold once virtualization lands). */
  virtualize?: boolean;
  emptyMessage?: React.ReactNode;
  /** Skeleton row count on cold load. Default = pageSize. */
  skeletonRows?: number;
  /** v1 supports "pagination"; "infinite" is a later add. */
  mode?: "pagination" | "infinite";
  className?: string;
}

/**
 * A fully controlled, server-driven table. Holds no data state of its own:
 * pagination, sorting, and filtering are driven by props (filters live in the
 * page's filter slot, not here). Builds a manual TanStack instance and renders
 * through the shared TableView so it looks identical to the client DataTable.
 */
export function ServerDataTable<TData>({
  columns,
  data,
  pageIndex,
  pageSize,
  pageCount,
  rowCount,
  onPaginationChange,
  sorting,
  onSortingChange,
  columnVisibility,
  onColumnVisibilityChange,
  columnOrder,
  onColumnOrderChange,
  enableRowSelection = false,
  enableSelectAll = true,
  selectedRowIds,
  onSelectedRowIdsChange,
  getRowId,
  bulkActions,
  onCellEdit,
  readOnly = false,
  renderSubRow,
  loading = false,
  fetching = false,
  onRowClick,
  expandOnRowClick = false,
  rowClassName,
  stickyHeader = true,
  virtualize = false,
  emptyMessage,
  skeletonRows,
  mode = "pagination",
  className,
}: ServerDataTableProps<TData>) {
  void mode; // "infinite" is reserved; only "pagination" is implemented in v1.

  // Column visibility / order are uncontrolled unless the caller passes both a
  // value and a change handler.
  const [internalVisibility, setInternalVisibility] = React.useState<VisibilityState>({});
  const [internalOrder, setInternalOrder] = React.useState<string[]>([]);
  const [internalSelection, setInternalSelection] = React.useState<Record<string, boolean>>({});

  const visibility = columnVisibility ?? internalVisibility;
  const order = columnOrder ?? internalOrder;
  const selection = selectedRowIds ?? internalSelection;
  const selectedCount = Object.values(selection).filter(Boolean).length;

  const handleVisibilityChange: OnChangeFn<VisibilityState> = (updater) => {
    const next = resolveUpdater(updater, visibility);
    if (onColumnVisibilityChange) onColumnVisibilityChange(next);
    else setInternalVisibility(next);
  };

  const handleOrderChange: OnChangeFn<string[]> = (updater) => {
    const next = resolveUpdater(updater, order);
    if (onColumnOrderChange) onColumnOrderChange(next);
    else setInternalOrder(next);
  };

  const handleSortingChange: OnChangeFn<SortingState> = (updater) => {
    if (!onSortingChange) return;
    onSortingChange(resolveUpdater(updater, sorting ?? []));
  };

  const handleSelectionChange: OnChangeFn<Record<string, boolean>> = (updater) => {
    const next = resolveUpdater(updater, selection);
    if (onSelectedRowIdsChange) onSelectedRowIdsChange(next);
    else setInternalSelection(next);
  };

  const handlePaginationChange: OnChangeFn<{ pageIndex: number; pageSize: number }> = (
    updater
  ) => {
    onPaginationChange(resolveUpdater(updater, { pageIndex, pageSize }));
  };

  // Swap editable columns to the quiet inline editor, keeping their original
  // `cell` as the read display so an editable column looks identical to a
  // non-editable one until you reach for it. Inert without `onCellEdit`.
  const resolvedColumns = React.useMemo(() => {
    if (!onCellEdit) return columns;
    return columns.map((col) => {
      if (!col.meta?.editor && !col.meta?.editable) return col;
      const display = col.cell;
      return {
        ...col,
        cell: (ctx: CellContext<TData, unknown>) => (
          <InlineEditCell ctx={ctx} display={display} />
        ),
      } as ColumnDef<TData, any>;
    });
  }, [columns, onCellEdit]);

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    state: {
      pagination: { pageIndex, pageSize },
      sorting: sorting ?? [],
      columnVisibility: visibility,
      columnOrder: order,
      rowSelection: selection,
    },
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
    pageCount: pageCount < 0 ? -1 : pageCount,
    rowCount,
    enableSorting: !!onSortingChange,
    enableRowSelection,
    getRowId,
    onPaginationChange: handlePaginationChange,
    onSortingChange: handleSortingChange,
    onColumnVisibilityChange: handleVisibilityChange,
    onColumnOrderChange: handleOrderChange,
    onRowSelectionChange: handleSelectionChange,
    getCoreRowModel: getCoreRowModel(),
    ...(renderSubRow
      ? { getExpandedRowModel: getExpandedRowModel(), getRowCanExpand: () => true }
      : {}),
    meta: {
      inlineEditReadOnly: readOnly,
      // row.index indexes the current page's `data`, which is what the server
      // just returned, so data[rowIndex] is the edited row. Resolve it to the
      // caller's id; without getRowId, TanStack ids rows by index and so do we.
      updateData: onCellEdit
        ? (rowIndex, columnId, value) => {
            const original = data[rowIndex];
            if (!original) return;
            onCellEdit(getRowId ? getRowId(original) : String(rowIndex), columnId, value);
          }
        : undefined,
    },
  });

  return (
    <TableView
      table={table}
      loading={loading}
      fetching={fetching}
      onRowClick={onRowClick}
      expandOnRowClick={expandOnRowClick}
      rowClassName={rowClassName}
      stickyHeader={stickyHeader}
      virtualize={virtualize}
      emptyMessage={emptyMessage}
      skeletonRows={skeletonRows ?? pageSize}
      renderSubRow={renderSubRow}
      enableRowSelection={enableRowSelection}
      enableSelectAll={enableSelectAll}
      bulkBar={selectedCount > 0 ? bulkActions : undefined}
      enableColumnReorder={false}
      className={className}
    />
  );
}
