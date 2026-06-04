import * as React from "react";
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type CellContext,
  type ColumnDef,
  type ColumnFiltersState,
  type ColumnOrderState,
  type Header,
  type RowData,
  type SortingState,
} from "@tanstack/react-table";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type Modifier,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ChevronDown,
  ChevronsUpDown,
  ChevronUp,
  GripVertical,
} from "lucide-react";
import { cn } from "../lib/utils";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

// Extend TanStack types so columns can opt into editing/alignment and the table
// can expose an edit callback. See onCellEdit + meta.editable below.
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    editable?: boolean;
    align?: "left" | "right" | "center";
  }
}

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

function SortIcon({ dir }: { dir: false | "asc" | "desc" }) {
  if (dir === "asc") return <ChevronUp className="size-3.5" />;
  if (dir === "desc") return <ChevronDown className="size-3.5" />;
  return <ChevronsUpDown className="size-3.5 opacity-50" />;
}

function HeaderContent<TData>({
  header,
  sortable,
}: {
  header: Header<TData, unknown>;
  sortable: boolean;
}) {
  const canSort = sortable && header.column.getCanSort();
  return (
    <button
      type="button"
      disabled={!canSort}
      onClick={canSort ? header.column.getToggleSortingHandler() : undefined}
      className={cn(
        "inline-flex items-center gap-1",
        canSort && "cursor-pointer hover:text-foreground"
      )}
    >
      {flexRender(header.column.columnDef.header, header.getContext())}
      {canSort && <SortIcon dir={header.column.getIsSorted()} />}
    </button>
  );
}

function DraggableHeader<TData>({
  header,
  sortable,
}: {
  header: Header<TData, unknown>;
  sortable: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: header.column.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
  };
  return (
    <TableHead ref={setNodeRef} style={style} colSpan={header.colSpan}>
      <div className="flex items-center gap-1">
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none select-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing [&_svg]:size-3.5"
          aria-label="Drag to reorder column"
        >
          <GripVertical />
        </span>
        <HeaderContent header={header} sortable={sortable} />
      </div>
    </TableHead>
  );
}

// Keep the drag overlay on the horizontal axis (avoids a @dnd-kit/modifiers dependency).
const restrictToHorizontalAxis: Modifier = ({ transform }) => ({ ...transform, y: 0 });

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setColumnOrder((order) => {
        const oldIndex = order.indexOf(active.id as string);
        const newIndex = order.indexOf(over.id as string);
        return arrayMove(order, oldIndex, newIndex);
      });
    }
  }

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;

  const tableEl = (
    <Table className={className}>
      <TableHeader>
        {headerGroups.map((hg) => (
          <TableRow key={hg.id}>
            {enableColumnReorder ? (
              <SortableContext items={columnOrder} strategy={horizontalListSortingStrategy}>
                {hg.headers.map((header) => (
                  <DraggableHeader key={header.id} header={header} sortable={enableSorting} />
                ))}
              </SortableContext>
            ) : (
              hg.headers.map((header) => (
                <TableHead key={header.id} colSpan={header.colSpan}>
                  {header.isPlaceholder ? null : (
                    <HeaderContent header={header} sortable={enableSorting} />
                  )}
                </TableHead>
              ))
            )}
          </TableRow>
        ))}
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={table.getAllLeafColumns().length}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
              {row.getVisibleCells().map((cell) => (
                <TableCell
                  key={cell.id}
                  className={cn(
                    cell.column.columnDef.meta?.align === "right" &&
                      "text-right font-mono tabular-nums",
                    cell.column.columnDef.meta?.align === "center" && "text-center"
                  )}
                >
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );

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

      <div className="rounded-lg border border-border">
        {enableColumnReorder ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            modifiers={[restrictToHorizontalAxis]}
            onDragEnd={handleDragEnd}
          >
            {tableEl}
          </DndContext>
        ) : (
          tableEl
        )}
      </div>

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
