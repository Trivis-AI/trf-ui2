# EditableGrid

> **Status: ready** · `import { EditableGrid } from "@trf/ui2"` · source:
> `src/components/editable-grid.tsx` (built on `Table` with `TableCell editable`, and `Input`,
> `SelectTrigger`, `DatePicker` in their `"cell"` variant, plus `Button`)

**Spreadsheet-style editable grid**: per-type inline cell editing (text / number / date /
boolean), an inline new-row, row delete, dynamic add/remove columns, and a server-side pagination
strip. Presentational — the consumer owns persistence and passes updated `columns` / `rows` back.

Graduated from trffronttables' `TableDetailPage`.

## When to use which

| | `Table` | `DataTable` | `EditableGrid` |
| --- | --- | --- | --- |
| Data | static | read-mostly | read-write |
| Features | none | sort/filter/reorder | inline edit, add row/column |
| Schema | fixed | fixed columns | user-editable columns |

## Usage

```tsx
import { EditableGrid, type EditableGridColumn, type EditableGridRow } from "@trf/ui2";

function TableDetail() {
  const [columns, setColumns] = useState<EditableGridColumn[]>([]);
  const [rows, setRows] = useState<EditableGridRow[]>([]);
  const [page, setPage] = useState(1);
  const { confirm, dialog } = useConfirm();

  return (
    <>
      <EditableGrid
        columns={columns}
        rows={rows}
        onCellChange={async (rowId, colId, value) => {
          setRows(rs => rs.map(r => r.id === rowId
            ? { ...r, values: { ...r.values, [colId]: value } } : r));   // optimistic
          await api.updateCell(rowId, colId, value).catch(() => reload());
        }}
        onRowAdd={async (values) => {
          const rec = await api.createRecord(values);                     // async — button shows busy
          setRows(rs => [...rs, rec]);
        }}
        onRowDelete={async (rowId) => { await api.deleteRecord(rowId); reload(); }}
        onColumnAdd={async (name, dataType) => {
          const col = await api.addColumn(name, dataType);
          setColumns(cs => [...cs, col]);
        }}
        onColumnDelete={async (col) => {
          if (!(await confirm({ description: `Remove column "${col.name}"?`, variant: "destructive" }))) return;
          await api.deleteColumn(col.id);
          setColumns(cs => cs.filter(c => c.id !== col.id));
        }}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />
      {dialog}
    </>
  );
}
```

## Data contract

- `EditableGridColumn`: `{ id, name, dataType }` — `dataType` ∈ `string | number | date | boolean`
- `EditableGridRow`: `{ id, values }` — `values` keyed by column id, **all strings**: dates ISO
  `YYYY-MM-DD`, booleans `"true"` / `"false"`, empty cells `""` or omitted

## Behavior

- Every cell is a field ([Table, editable cells](table.md#editable-cells)): the cell shows
  hover, focus, open and invalid; the control inside draws nothing. Tab moves between cells.
- Text/number cells: an always-mounted `Input variant="cell"`. It keeps a draft while focused;
  Enter or leaving the cell commits, Escape restores the saved value. `onCellChange` fires only
  when the value actually changed. Number cells are right-aligned tabular figures.
- Date cells: `DatePicker variant="cell"`, clearable; a change commits immediately
- Boolean cells: `SelectTrigger variant="cell"` with `—` / ✓ true / ✗ false; a change commits
  immediately. The new row uses the same select.
- Optional features appear only when the callback is provided (`onRowAdd`, `onRowDelete`,
  `onColumnAdd`, `onColumnDelete`)
- **Column delete is not confirmed by the grid** — confirm in the consumer (`useConfirm`)
- All UI strings overridable via `labels` for i18n

## Related

- [Table / DataTable](table.md) · [DatePicker](date-picker.md) · [ConfirmDialog](confirm-dialog.md)
