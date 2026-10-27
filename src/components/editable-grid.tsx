import * as React from "react";
import { Check, ChevronLeft, ChevronRight, Plus, Trash2, X } from "lucide-react";
import { cn } from "../lib/utils";
import { tr } from "../lib/i18n";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { DatePicker } from "./date-picker";

export type EditableGridDataType = "string" | "number" | "date" | "boolean";

export interface EditableGridColumn {
  id: string;
  name: string;
  dataType: EditableGridDataType;
}

export interface EditableGridRow {
  id: string;
  /**
   * Cell values keyed by column id, all as strings:
   * dates ISO `YYYY-MM-DD`, booleans `"true"` / `"false"`, missing cells omitted or `""`.
   */
  values: Record<string, string>;
}

export interface EditableGridProps {
  columns: EditableGridColumn[];
  rows: EditableGridRow[];
  /** Single-cell edit committed (Enter/blur, or a date/boolean change). Persist + update `rows`. */
  onCellChange: (rowId: string, columnId: string, value: string) => void;
  /** Inline new-row submitted. May be async — the add button shows a busy state while pending. */
  onRowAdd?: (values: Record<string, string>) => void | Promise<void>;
  onRowDelete?: (rowId: string) => void;
  /** Add-column form submitted. Omit to hide the add-column control. */
  onColumnAdd?: (name: string, dataType: EditableGridDataType) => void;
  /** Column-header ✕ pressed. Confirm in the consumer (e.g. `useConfirm`) before removing. */
  onColumnDelete?: (column: EditableGridColumn) => void;

  /** 1-based current page. Pagination strip renders only when `totalPages > 1`. */
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;

  /** Override UI strings (i18n). */
  labels?: Partial<{
    addRow: string;
    addingRow: string;
    addColumn: string;
    columnName: string;
    add: string;
    prev: string;
    next: string;
    page: (page: number, totalPages: number) => string;
  }>;
  className?: string;
}

const DATA_TYPES: EditableGridDataType[] = ["string", "number", "date", "boolean"];
// Radix Select can't hold an empty string value — sentinel for the blank boolean choice.
const NONE = "__none__";
// Figures are right-aligned tabular numerals, as in every table of the suite.
const figure = "text-right font-mono tabular-nums";

const isoToDate = (iso?: string): Date | undefined => {
  if (!iso) return undefined;
  const d = new Date(`${iso}T00:00:00`);
  return Number.isNaN(d.getTime()) ? undefined : d;
};

const dateToIso = (d?: Date): string => {
  if (!d) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

type Draft = { rowId: string; colId: string; value: string };

/**
 * Spreadsheet-style editable grid: per-type inline cell editing (text/number/date/boolean),
 * an inline new-row, row delete, dynamic add/remove columns, and a server-side pagination strip.
 * Presentational — the consumer owns persistence and passes updated `columns`/`rows` back in.
 * Graduated from trffronttables' TableDetailPage.
 *
 * Every cell is a field: `Input`, `SelectTrigger` and `DatePicker` in their `"cell"` variant
 * inside `<TableCell editable>`, so the cell itself shows hover, focus and open. A text or
 * number cell keeps a draft while it has focus and commits on blur or Enter; Escape restores
 * the saved value. Dates and booleans commit on change.
 *
 * For read-mostly data with sorting/filtering, use `DataTable` instead.
 */
export function EditableGrid({
  columns,
  rows,
  onCellChange,
  onRowAdd,
  onRowDelete,
  onColumnAdd,
  onColumnDelete,
  page = 1,
  totalPages = 1,
  onPageChange,
  labels,
  className,
}: EditableGridProps) {
  const L = {
    addRow: tr("<trn-add-row>", "Add row"),
    addingRow: tr("<trn-adding>", "Adding…"),
    addColumn: tr("<trn-ui-column>", "Column"),
    columnName: tr("<trn-column-name>", "Column name"),
    add: tr("<trn-add>", "Add"),
    prev: tr("<trn-ui-prev>", "Prev"),
    next: tr("<trn-next>", "Next"),
    page: (p: number, t: number) =>
      tr("<trn-ui-page-slash-total>", "Page {page} / {total}")
        .replace("{page}", String(p))
        .replace("{total}", String(t)),
    ...labels,
  };

  // The draft lives in state for rendering and in a ref for the commit, so
  // Escape can drop it before the blur it causes reaches the commit.
  const [draft, setDraft] = React.useState<Draft | null>(null);
  const draftRef = React.useRef<Draft | null>(null);
  const [addingCol, setAddingCol] = React.useState(false);
  const [newColName, setNewColName] = React.useState("");
  const [newColType, setNewColType] = React.useState<EditableGridDataType>("string");
  const [newRowValues, setNewRowValues] = React.useState<Record<string, string>>({});
  const [savingNewRow, setSavingNewRow] = React.useState(false);
  const newColRef = React.useRef<HTMLInputElement>(null);

  const setDraftBoth = (d: Draft | null) => {
    draftRef.current = d;
    setDraft(d);
  };

  const commitDraft = () => {
    const d = draftRef.current;
    if (!d) return;
    setDraftBoth(null);
    const current = rows.find((r) => r.id === d.rowId)?.values[d.colId] ?? "";
    if (d.value !== current) onCellChange(d.rowId, d.colId, d.value);
  };

  const handleCellKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      e.currentTarget.blur(); // blur commits
    }
    if (e.key === "Escape") {
      setDraftBoth(null);
      e.currentTarget.blur();
    }
  };

  const addColumn = () => {
    if (!newColName.trim()) return;
    onColumnAdd?.(newColName.trim(), newColType);
    setNewColName("");
    setAddingCol(false);
  };

  const anyNewValue = columns.some((col) => (newRowValues[col.id] ?? "") !== "");

  const saveNewRow = async () => {
    if (!onRowAdd || !anyNewValue || savingNewRow) return;
    setSavingNewRow(true);
    try {
      await onRowAdd(newRowValues);
      setNewRowValues({});
    } finally {
      setSavingNewRow(false);
    }
  };

  const setNewValue = (colId: string, value: string) =>
    setNewRowValues((prev) => ({ ...prev, [colId]: value }));

  const booleanSelect = (value: string, onChange: (v: string) => void, placeholder: string, label: string) => (
    <Select value={value || NONE} onValueChange={(v) => onChange(v === NONE ? "" : v)}>
      <SelectTrigger variant="cell" aria-label={label}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={NONE}>—</SelectItem>
        <SelectItem value="true">
          <span className="flex items-center gap-1.5">
            <Check className="size-4 text-success" /> true
          </span>
        </SelectItem>
        <SelectItem value="false">
          <span className="flex items-center gap-1.5">
            <X className="size-4 text-muted-foreground" /> false
          </span>
        </SelectItem>
      </SelectContent>
    </Select>
  );

  return (
    <div className={className}>
      <div className="rounded-md border border-border">
        <Table className="[&_th]:px-2" style={{ minWidth: `${Math.max(480, columns.length * 160)}px` }}>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.id} className={cn(col.dataType === "number" && "text-right")}>
                  <div className={cn("flex items-center gap-1.5", col.dataType === "number" && "justify-end")}>
                    <span>{col.name}</span>
                    <span className="text-xs opacity-60">({col.dataType})</span>
                    {onColumnDelete && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={tr("<trn-ui-remove-column-name>", "Remove column {name}").replace("{name}", col.name)}
                        className="text-muted-foreground hover:text-destructive [&_svg]:size-3"
                        onClick={() => onColumnDelete(col)}
                      >
                        <X />
                      </Button>
                    )}
                  </div>
                </TableHead>
              ))}
              <TableHead className="w-px">
                {onColumnAdd &&
                  (addingCol ? (
                    <div className="flex min-w-[280px] items-center gap-1.5">
                      <Input
                        ref={newColRef}
                        value={newColName}
                        onChange={(e) => setNewColName(e.target.value)}
                        placeholder={L.columnName}
                        className="h-8 flex-1"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") addColumn();
                          if (e.key === "Escape") setAddingCol(false);
                        }}
                      />
                      <Select
                        value={newColType}
                        onValueChange={(v) => setNewColType(v as EditableGridDataType)}
                      >
                        <SelectTrigger className="h-8 w-auto">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {DATA_TYPES.map((dt) => (
                            <SelectItem key={dt} value={dt}>
                              {dt}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button type="button" size="sm" onClick={addColumn} disabled={!newColName.trim()}>
                        {L.add}
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        aria-label={tr("<trn-ui-cancel-adding-column>", "Cancel adding column")}
                        className="size-8"
                        onClick={() => setAddingCol(false)}
                      >
                        <X />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => {
                        setAddingCol(true);
                        setTimeout(() => newColRef.current?.focus(), 0);
                      }}
                    >
                      <Plus /> {L.addColumn}
                    </Button>
                  ))}
              </TableHead>
              {onRowDelete && <TableHead className="w-8" />}
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((row) => (
              <TableRow key={row.id}>
                {columns.map((col) => {
                  const value = row.values[col.id] ?? "";
                  const isDraft = draft?.rowId === row.id && draft?.colId === col.id;
                  return (
                    <TableCell key={col.id} editable>
                      {col.dataType === "date" ? (
                        <DatePicker
                          variant="cell"
                          value={isoToDate(value)}
                          onChange={(d) => onCellChange(row.id, col.id, dateToIso(d))}
                          clearable
                          captionLayout="dropdown"
                          placeholder="—"
                        />
                      ) : col.dataType === "boolean" ? (
                        booleanSelect(value, (v) => { if (v !== value) onCellChange(row.id, col.id, v); }, "—", col.name)
                      ) : (
                        <Input
                          variant="cell"
                          aria-label={col.name}
                          type={col.dataType === "number" ? "number" : "text"}
                          inputMode={col.dataType === "number" ? "decimal" : undefined}
                          className={cn(col.dataType === "number" && figure)}
                          value={isDraft ? draft.value : value}
                          onFocus={() => setDraftBoth({ rowId: row.id, colId: col.id, value })}
                          onChange={(e) => setDraftBoth({ rowId: row.id, colId: col.id, value: e.target.value })}
                          onBlur={commitDraft}
                          onKeyDown={handleCellKeyDown}
                        />
                      )}
                    </TableCell>
                  );
                })}
                <TableCell />
                {onRowDelete && (
                  <TableCell className="px-1 py-0">
                    <div className="flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        aria-label={tr("<trn-ui-delete-row>", "Delete row")}
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => onRowDelete(row.id)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}

            {onRowAdd && (
              <TableRow>
                {columns.map((col) => (
                  <TableCell key={col.id} editable>
                    {col.dataType === "date" ? (
                      <DatePicker
                        variant="cell"
                        value={isoToDate(newRowValues[col.id])}
                        onChange={(d) => setNewValue(col.id, dateToIso(d))}
                        clearable
                        captionLayout="dropdown"
                        placeholder={col.name}
                      />
                    ) : col.dataType === "boolean" ? (
                      booleanSelect(newRowValues[col.id] ?? "", (v) => setNewValue(col.id, v), col.name, col.name)
                    ) : (
                      <Input
                        variant="cell"
                        aria-label={col.name}
                        type={col.dataType === "number" ? "number" : "text"}
                        inputMode={col.dataType === "number" ? "decimal" : undefined}
                        className={cn(col.dataType === "number" && figure)}
                        value={newRowValues[col.id] ?? ""}
                        onChange={(e) => setNewValue(col.id, e.target.value)}
                        placeholder={col.name}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") void saveNewRow();
                        }}
                      />
                    )}
                  </TableCell>
                ))}
                <TableCell className="px-2 py-1">
                  <Button
                    type="button"
                    size="sm"
                    className="whitespace-nowrap"
                    disabled={savingNewRow || !anyNewValue}
                    onClick={() => void saveNewRow()}
                  >
                    <Plus /> {savingNewRow ? L.addingRow : L.addRow}
                  </Button>
                </TableCell>
                {onRowDelete && <TableCell className="w-8" />}
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {totalPages > 1 && onPageChange && (
        <div className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft /> {L.prev}
          </Button>
          <span>{L.page(page, totalPages)}</span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
          >
            {L.next} <ChevronRight />
          </Button>
        </div>
      )}
    </div>
  );
}
