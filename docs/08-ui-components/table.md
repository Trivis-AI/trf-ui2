# Table & DataTable

> **Status: ready** · source: `src/components/ui/table.tsx` (primitives), `src/components/data-table.tsx` (DataTable)

Two tiers. Pick the lightest one that does the job.

## Tier 1 — `Table` primitives (dependency-free)

For **simple/static** tables: totals, detail rows, small lists with no interactivity.

```tsx
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@trf/ui2";

<Table>
  <TableHeader>
    <TableRow><TableHead>Item</TableHead><TableHead className="text-right">Amount</TableHead></TableRow>
  </TableHeader>
  <TableBody>
    <TableRow><TableCell>Net</TableCell><TableCell className="text-right">€1,000.00</TableCell></TableRow>
  </TableBody>
</Table>
```
Parts: `Table, TableHeader, TableBody, TableFooter, TableRow, TableHead, TableCell, TableCaption`.
Zero dependencies — these are plain token-styled HTML.

### Editable cells

For a table people type into (invoice rows, purchase rows), the cell is the field. An
`<Input variant="cell">` draws nothing of its own and fills the cell; `<TableCell editable>`
has no padding and shows every state in its place, each the way a field of the theme looks:
on hover the field background with the field's border drawn inside the cell, while the
input has focus the field-focus background with a 2px inset ring in `cell-ring` (the field
ring, or in Default the active border colour, since Default draws no ring), and `invalid`
adds an inset destructive ring. States live on the cell, so there is no box inside a box,
and the row reads as one surface with the figures beside it.

```tsx
<TableCell editable invalid={qty === 0}>
  <Input variant="cell" aria-label="Quantity" aria-invalid={qty === 0 || undefined}
    inputMode="decimal" className="text-right font-mono tabular-nums" value={qty} onChange={…} />
</TableCell>
```

A select or a date in such a row works the same way: `SelectTrigger` and `DatePicker` take
`variant="cell"`, draw nothing of their own, and the cell also shows the open state while
their popup is up.

```tsx
<TableCell editable>
  <Select value={rateId} onValueChange={setRateId}>
    <SelectTrigger variant="cell" aria-label="VAT rate" className="justify-end font-mono tabular-nums">
      <SelectValue />
    </SelectTrigger>
    <SelectContent align="end">…</SelectContent>
  </Select>
</TableCell>
<TableCell editable>
  <DatePicker variant="cell" value={due} onChange={setDue} clearable placeholder="—" />
</TableCell>
```

`editable` sets `group`, so an icon button inside the cell can fade in on hover with
`group-hover:opacity-100`. Read-only figure cells beside editable ones use `py-0` so the row
keeps the input's height. Demo: "Line items" in the kitchen sink; `EditableGrid` is built the
same way.

## Tier 2 — `DataTable` (TanStack-powered)

For **interactive** tables: sorting, filtering, column reorder, inline editing. Built on
[TanStack Table](https://tanstack.com/table) + dnd-kit, with owned token-styled markup.

```tsx
import { DataTable, type ColumnDef, Badge } from "@trf/ui2";

const columns: ColumnDef<Invoice>[] = [
  { id: "number",   accessorKey: "number",   header: "Number" },
  { id: "customer", accessorKey: "customer", header: "Customer", meta: { editable: true } },
  { id: "status",   accessorKey: "status",   header: "Status",
    cell: ({ getValue }) => <Badge>{getValue() as string}</Badge> },
  { id: "total",    accessorKey: "total",    header: "Total",
    meta: { editable: true, align: "right" } },
];

<DataTable
  columns={columns}
  data={rows}
  enableSorting          // headers sort (default true)
  enableGlobalFilter     // shows a search box across all columns
  enableColumnReorder    // drag the grip to reorder columns
  pageSize={50}          // optional client pagination
  onCellEdit={(rowIndex, columnId, value) => updateRow(rowIndex, columnId, value)}
/>
```

### Props

| Prop | Default | Notes |
|---|---|---|
| `columns` / `data` | — | `ColumnDef` re-exported from `@trf/ui2` — don't import TanStack directly. **Every column needs an `id`** (required for reorder). |
| `enableSorting` | `true` | Click headers to sort. |
| `enableGlobalFilter` | `false` | Renders a Search input filtering all columns. |
| `enableColumnReorder` | `false` | Drag handle per header (dnd-kit). |
| `pageSize` | — | Omit = no pagination. |
| `onCellEdit` | — | Enables inline editing for columns with `meta.editable`. You own the data; update it here. |

### Inline editing

Mark a column `meta: { editable: true }` and pass `onCellEdit`. The cell becomes a seamless
inline text input (commit on blur / Enter, cancel on Escape). **Editing replaces the cell's
display renderer** — so an editable column shows the raw value, not a formatted one. If you need
formatted-display + edit-on-click, render a custom cell instead of using `meta.editable`.

## Tier 3 — `ServerDataTable` (server-driven)

For **large, server-driven list pages** (thousands of rows) where the server owns
paging, sorting, and filtering: purchase invoices, payments, products, sales invoices.
Comes with the `TablePage` organism, the `useTableQuery` state hook, toolbar drop-ins,
and standard cell renderers (`StatusCell`, `MoneyCell`, `DateCell`, ...).

`DataTable` (Tier 2) stays for small in-memory sets; `ServerDataTable` is a sibling,
not a replacement. See **[ServerDataTable, TablePage & cell renderers](./server-data-table.md)**.

## Rules

- Use **Tier 1** unless you need sort/filter/reorder/edit. Don't pull DataTable for a 5-row table.
- Use **Tier 3** when the server owns paging/sorting/filtering, not Tier 2's client models.
- DataTable pulls TanStack + dnd-kit; apps that never import it don't bundle those (tree-shaken).
- Column visuals come from tokens — don't restyle rows/cells with raw colors.

## Related

- [13 AI Coding Guidelines](../13-ai-coding-guidelines.md) · [03 Design Tokens](../03-design-tokens.md)
