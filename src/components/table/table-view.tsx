import * as React from "react";
import {
  flexRender,
  type Header,
  type RowData,
  type Table as TanStackTable,
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
import { ChevronDown, ChevronsUpDown, ChevronUp, GripVertical } from "lucide-react";
import { cn } from "../../lib/utils";
import { Checkbox } from "../ui/checkbox";
import { Skeleton } from "../ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { TableProgress } from "./table-progress";

/**
 * Per-column inline cell-editor descriptor. A column opts a cell into inline
 * editing by setting `meta.editor` (or the legacy boolean `meta.editable`, which
 * is treated as a plain text editor). `EditableDataTable` reads this to render the
 * matching control; the client `DataTable`'s built-in editor honours `editable`.
 */
export type CellEditor =
  | { type: "text"; placeholder?: string }
  | { type: "number"; min?: number; max?: number; step?: number; placeholder?: string }
  | {
      type: "select";
      options: { value: string; label: React.ReactNode }[];
      placeholder?: string;
    }
  | { type: "switch" };

// Shared column meta: lets columns opt into inline editing and per-column
// alignment. Declared here (the shared render core) so both DataTable and
// ServerDataTable pick it up; do NOT re-declare it elsewhere or TS reports a
// duplicate identifier.
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface TableMeta<TData extends RowData> {
    updateData?: (rowIndex: number, columnId: string, value: unknown) => void;
  }
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData extends RowData, TValue> {
    editable?: boolean;
    align?: "left" | "right" | "center";
    /** Inline editor descriptor read by EditableDataTable. */
    editor?: CellEditor;
  }
}

export interface TableViewProps<TData> {
  /** A built TanStack table instance (client or manual models). */
  table: TanStackTable<TData>;
  /** Cold load, no rows yet: render skeleton rows instead of the body. */
  loading?: boolean;
  /** Background refetch with rows on screen: show the header progress line, keep rows. */
  fetching?: boolean;
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData) => string | undefined;
  /** Pin the header to the top of the scroll container. Default true. */
  stickyHeader?: boolean;
  /**
   * Row virtualization. Reserved seam: the prop is accepted so callers can opt in,
   * but windowing is not active yet (needs @tanstack/react-virtual). Rows render in
   * full for now. Default false.
   */
  virtualize?: boolean;
  emptyMessage?: React.ReactNode;
  /** Skeleton row count while `loading`. Default 8. */
  skeletonRows?: number;
  /** Render an expandable detail row under expanded rows (row.getIsExpanded()). */
  renderSubRow?: (row: TData) => React.ReactNode;
  /** Render a leading selection checkbox column. */
  enableRowSelection?: boolean;
  /** Show the header select-all checkbox. Default true (only when selection is on). */
  enableSelectAll?: boolean;
  /** When set, replaces the column-header row with this bulk toolbar (selection active). */
  bulkBar?: React.ReactNode;
  /** Drag headers to reorder columns (drives the table's columnOrder state). */
  enableColumnReorder?: boolean;
  className?: string;
}

// Keep the drag overlay on the horizontal axis (avoids a @dnd-kit/modifiers dependency).
const restrictToHorizontalAxis: Modifier = ({ transform }) => ({ ...transform, y: 0 });

function alignClass(align?: "left" | "right" | "center") {
  if (align === "right") return "text-right";
  if (align === "center") return "text-center";
  return undefined;
}

function SortIcon({ dir }: { dir: false | "asc" | "desc" }) {
  if (dir === "asc") return <ChevronUp className="size-3.5" />;
  if (dir === "desc") return <ChevronDown className="size-3.5" />;
  return <ChevronsUpDown className="size-3.5 opacity-50" />;
}

function HeaderLabel<TData>({ header }: { header: Header<TData, unknown> }) {
  const canSort = header.column.getCanSort();
  const align = header.column.columnDef.meta?.align;
  const label = flexRender(header.column.columnDef.header, header.getContext());
  if (!canSort) {
    return (
      <span className={cn("inline-flex items-center gap-1", align === "right" && "flex-row-reverse")}>
        {label}
      </span>
    );
  }
  return (
    <button
      type="button"
      onClick={header.column.getToggleSortingHandler()}
      className={cn(
        "inline-flex items-center gap-1 hover:text-foreground",
        align === "right" && "flex-row-reverse"
      )}
    >
      {label}
      <SortIcon dir={header.column.getIsSorted()} />
    </button>
  );
}

function DraggableHeader<TData>({ header }: { header: Header<TData, unknown> }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useSortable({
    id: header.column.id,
  });
  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.8 : 1,
    zIndex: isDragging ? 1 : 0,
  };
  const align = header.column.columnDef.meta?.align;
  return (
    <TableHead ref={setNodeRef} style={style} colSpan={header.colSpan} className={alignClass(align)}>
      <div className={cn("flex items-center gap-1", align === "right" && "justify-end")}>
        <span
          {...attributes}
          {...listeners}
          className="cursor-grab touch-none select-none text-muted-foreground/50 hover:text-muted-foreground active:cursor-grabbing [&_svg]:size-3.5"
          aria-label="Drag to reorder column"
        >
          <GripVertical />
        </span>
        {header.isPlaceholder ? null : <HeaderLabel header={header} />}
      </div>
    </TableHead>
  );
}

export function TableView<TData>({
  table,
  loading = false,
  fetching = false,
  onRowClick,
  rowClassName,
  stickyHeader = true,
  virtualize: _virtualize = false,
  emptyMessage = "No results.",
  skeletonRows = 8,
  renderSubRow,
  enableRowSelection = false,
  enableSelectAll = true,
  bulkBar,
  enableColumnReorder = false,
  className,
}: TableViewProps<TData>) {
  const wrapperRef = React.useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = React.useState(0);

  // Measure the header so the progress line can sit exactly under it (it overlays,
  // absolutely positioned, so it never shifts the rows).
  React.useLayoutEffect(() => {
    const thead = wrapperRef.current?.querySelector("thead");
    if (!thead) return;
    const measure = () => setHeaderHeight(thead.getBoundingClientRect().height);
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(thead);
    return () => ro.disconnect();
  }, []);

  const headerGroups = table.getHeaderGroups();
  const rows = table.getRowModel().rows;
  const leafColumns = table.getVisibleLeafColumns();
  const colCount = leafColumns.length + (enableRowSelection ? 1 : 0);
  const columnOrder = table.getState().columnOrder;

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const order = columnOrder.length
      ? columnOrder
      : leafColumns.map((c) => c.id);
    const oldIndex = order.indexOf(active.id as string);
    const newIndex = order.indexOf(over.id as string);
    if (oldIndex < 0 || newIndex < 0) return;
    table.setColumnOrder(arrayMove(order, oldIndex, newIndex));
  }

  const headStickyClass = stickyHeader
    ? "sticky top-0 z-10 bg-background"
    : undefined;

  const selectionHead = enableRowSelection ? (
    <TableHead className={cn("w-10", headStickyClass)}>
      {enableSelectAll ? (
        <Checkbox
          checked={
            table.getIsAllRowsSelected()
              ? true
              : table.getIsSomeRowsSelected()
                ? "indeterminate"
                : false
          }
          onCheckedChange={(v) => table.toggleAllRowsSelected(!!v)}
          aria-label="Select all rows"
        />
      ) : null}
    </TableHead>
  ) : null;

  const tableEl = (
    <Table className={className}>
      <TableHeader>
        {bulkBar ? (
          // Selection active: the column-header row becomes the bulk toolbar.
          <TableRow className="hover:bg-transparent">
            {selectionHead}
            <TableHead colSpan={leafColumns.length} className={headStickyClass}>
              <div className="flex items-center gap-2">{bulkBar}</div>
            </TableHead>
          </TableRow>
        ) : (
          headerGroups.map((hg) => (
            <TableRow key={hg.id}>
              {selectionHead}
              {enableColumnReorder ? (
                <SortableContext
                  items={columnOrder.length ? columnOrder : leafColumns.map((c) => c.id)}
                  strategy={horizontalListSortingStrategy}
                >
                  {hg.headers.map((header) => (
                    <DraggableHeader key={header.id} header={header} />
                  ))}
                </SortableContext>
              ) : (
                hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    colSpan={header.colSpan}
                    className={cn(
                      alignClass(header.column.columnDef.meta?.align),
                      headStickyClass
                    )}
                  >
                    {header.isPlaceholder ? null : <HeaderLabel header={header} />}
                  </TableHead>
                ))
              )}
            </TableRow>
          ))
        )}
      </TableHeader>
      <TableBody>
        {loading ? (
          Array.from({ length: skeletonRows }).map((_, r) => (
            <TableRow key={`skeleton-${r}`}>
              {enableRowSelection && (
                <TableCell className="w-10">
                  <Skeleton className="size-4" />
                </TableCell>
              )}
              {leafColumns.map((col) => (
                <TableCell key={col.id}>
                  <Skeleton className="h-4 w-full" />
                </TableCell>
              ))}
            </TableRow>
          ))
        ) : rows.length === 0 ? (
          <TableRow>
            <TableCell
              colSpan={colCount}
              className="h-24 text-center text-muted-foreground"
            >
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => {
            const clickable = !!onRowClick;
            const subRow = renderSubRow && row.getIsExpanded() ? renderSubRow(row.original) : null;
            return (
              <React.Fragment key={row.id}>
                <TableRow
                  data-state={row.getIsSelected() ? "selected" : undefined}
                  onClick={clickable ? () => onRowClick?.(row.original) : undefined}
                  className={cn(clickable && "cursor-pointer", rowClassName?.(row.original))}
                >
                  {enableRowSelection && (
                    <TableCell className="w-10" onClick={(e) => e.stopPropagation()}>
                      <Checkbox
                        checked={row.getIsSelected()}
                        disabled={!row.getCanSelect()}
                        onCheckedChange={(v) => row.toggleSelected(!!v)}
                        aria-label="Select row"
                      />
                    </TableCell>
                  )}
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={alignClass(cell.column.columnDef.meta?.align)}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                {subRow != null && (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={colCount} className="bg-muted/30 p-0">
                      {subRow}
                    </TableCell>
                  </TableRow>
                )}
              </React.Fragment>
            );
          })
        )}
      </TableBody>
    </Table>
  );

  return (
    <div
      ref={wrapperRef}
      className="relative overflow-hidden rounded-lg border border-border"
    >
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
      {fetching && !loading && (
        <TableProgress
          className="absolute inset-x-0 z-20"
          style={{ top: headerHeight }}
        />
      )}
    </div>
  );
}
