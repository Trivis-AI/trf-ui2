import * as React from "react";
import {
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  type CellContext,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { cn } from "../../lib/utils";
import { Input } from "../ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { Switch } from "../ui/switch";
import { TableView, type CellEditor } from "./table-view";

// `CellEditor`, the column `editable`/`editor` meta, and the table `updateData`
// meta are all declared in ./table-view (the shared render core). Importing
// TableView brings that augmentation into scope here.

export interface EditableDataTableProps<TData> {
  columns: ColumnDef<TData, any>[];
  data: TData[];
  /** Stable id per row; also the id passed back to `onCellEdit`. */
  getRowId: (row: TData) => string;
  /**
   * A cell was committed (blur / Enter for text & number, immediate for select &
   * switch). You update your own data. Columns opt in via `meta.editor` (or the
   * legacy `meta.editable`, a plain text editor).
   */
  onCellEdit: (rowId: string, columnId: string, value: unknown) => void;
  /** Click headers to sort. Default false (inline-edit lists are usually unsorted). */
  enableSorting?: boolean;
  onRowClick?: (row: TData) => void;
  rowClassName?: (row: TData) => string | undefined;
  /** Cold load, no rows yet: skeleton rows. */
  loading?: boolean;
  /** Refetch with rows on screen: header progress line, rows stay. */
  fetching?: boolean;
  /** Pin the header. Default false (short config lists rarely scroll). */
  stickyHeader?: boolean;
  emptyMessage?: React.ReactNode;
  skeletonRows?: number;
  className?: string;
}

// Commit a text/number edit on blur or Enter; revert on Escape. Kept as its own
// component so each editable cell owns its draft state.
function TextEditor({
  initial,
  editor,
  align,
  onCommit,
}: {
  initial: unknown;
  editor: Extract<CellEditor, { type: "text" | "number" }>;
  align?: "left" | "right" | "center";
  onCommit: (value: unknown) => void;
}) {
  const initialStr = initial == null ? "" : String(initial);
  const [value, setValue] = React.useState(initialStr);
  // Re-seed when the committed value changes underneath us (e.g. after a save).
  React.useEffect(() => setValue(initialStr), [initialStr]);
  // Escape sets this so the ensuing blur skips the commit.
  const reverting = React.useRef(false);

  const commit = () => {
    if (reverting.current) {
      reverting.current = false;
      return;
    }
    if (value === initialStr) return;
    if (editor.type === "number") {
      onCommit(value === "" ? null : Number(value));
    } else {
      onCommit(value);
    }
  };

  return (
    <Input
      type={editor.type === "number" ? "number" : "text"}
      value={value}
      placeholder={editor.placeholder}
      min={editor.type === "number" ? editor.min : undefined}
      max={editor.type === "number" ? editor.max : undefined}
      step={editor.type === "number" ? editor.step : undefined}
      className={cn(
        "h-8",
        align === "right" && "text-right tabular-nums",
        align === "center" && "text-center"
      )}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => {
        if (e.key === "Enter") {
          e.preventDefault();
          e.currentTarget.blur();
        } else if (e.key === "Escape") {
          e.preventDefault();
          reverting.current = true;
          setValue(initialStr);
          e.currentTarget.blur();
        }
      }}
    />
  );
}

// The cell swapped in for editable columns; picks the control from meta.editor.
function EditableCell<TData>({ getValue, row, column, table }: CellContext<TData, unknown>) {
  const meta = column.columnDef.meta;
  const editor: CellEditor = meta?.editor ?? { type: "text" };
  const align = meta?.align;
  const initial = getValue();

  const commit = React.useCallback(
    (value: unknown) => table.options.meta?.updateData?.(row.index, column.id, value),
    [table, row.index, column.id]
  );

  let control: React.ReactNode;
  if (editor.type === "select") {
    control = (
      <Select
        value={initial == null ? "" : String(initial)}
        onValueChange={(v) => commit(v)}
      >
        <SelectTrigger className="h-8">
          <SelectValue placeholder={editor.placeholder} />
        </SelectTrigger>
        <SelectContent>
          {editor.options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  } else if (editor.type === "switch") {
    control = (
      <Switch checked={!!initial} onCheckedChange={(c) => commit(c)} />
    );
  } else {
    control = (
      <TextEditor initial={initial} editor={editor} align={align} onCommit={commit} />
    );
  }

  // Stop clicks (and the select/switch key handling) inside the editor from
  // reaching the row's click-to-navigate handler.
  return (
    <div
      onClick={(e) => e.stopPropagation()}
      className={cn(
        "flex",
        align === "right" && "justify-end",
        align === "center" && "justify-center"
      )}
    >
      {control}
    </div>
  );
}

/**
 * An inline-edit table: a thin layer over the shared TableView, so it inherits
 * the exact styling of DataTable / ServerDataTable. Columns flagged with
 * `meta.editor` (or `meta.editable`) render an inline editor — text, number,
 * select, or switch — committing through the reserved `updateData` seam, which
 * this component resolves to `onCellEdit(rowId, columnId, value)`. Non-editable
 * columns render normally. The consumer owns the data and the persistence.
 */
export function EditableDataTable<TData>({
  columns,
  data,
  getRowId,
  onCellEdit,
  enableSorting = false,
  onRowClick,
  rowClassName,
  loading = false,
  fetching = false,
  stickyHeader = false,
  emptyMessage,
  skeletonRows,
  className,
}: EditableDataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);

  // Swap editable columns to the inline editor, preserving their other defs.
  const resolvedColumns = React.useMemo(
    () =>
      columns.map((col) =>
        col.meta?.editable || col.meta?.editor
          ? { ...col, cell: EditableCell as ColumnDef<TData, any>["cell"] }
          : col
      ),
    [columns]
  );

  const table = useReactTable({
    data,
    columns: resolvedColumns,
    getRowId,
    state: { sorting },
    enableSorting,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    ...(enableSorting ? { getSortedRowModel: getSortedRowModel() } : {}),
    meta: {
      // row.index is the stable original-data index (unchanged by sorting), so
      // data[rowIndex] is the row being edited; map it to its id for the caller.
      updateData: (rowIndex, columnId, value) => {
        const original = data[rowIndex];
        if (!original) return;
        onCellEdit(getRowId(original), columnId, value);
      },
    },
  });

  return (
    <TableView
      table={table}
      loading={loading}
      fetching={fetching}
      onRowClick={onRowClick}
      rowClassName={rowClassName}
      stickyHeader={stickyHeader}
      emptyMessage={emptyMessage}
      skeletonRows={skeletonRows}
      className={className}
    />
  );
}
