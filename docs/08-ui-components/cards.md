# Cards — Card, TableCard, RadioCard

> **Status: ready** · `import { Card, TableCard, RadioCard } from "@trf/ui2"` · source: `src/components/ui/{card,table-card,radio-card}.tsx`

## Card

General container with optional sub-parts.

```tsx
<Card>
  <CardHeader><CardTitle>Invoice #1042</CardTitle><CardDescription>…</CardDescription></CardHeader>
  <CardContent>…</CardContent>
  <CardFooter>…</CardFooter>
</Card>
```

## TableCard

A bordered card sized for a table: header (`title` + `actions`), a **plain** `Table`/`DataTable`
inside, and an optional `footer` (pagination/totals). The card supplies the border.

```tsx
<TableCard title="Recent invoices" actions={<Button size="sm">Export</Button>} footer={…}>
  <Table>…</Table>
</TableCard>
```

## RadioCard

A large, descriptive **selectable** option (e.g. picking a document type). Controlled — the
parent owns selection.

```tsx
<RadioCard selected={type === "invoice"} onClick={() => setType("invoice")}
  icon={<Receipt />} title="Invoice" description="A standard sales invoice." />
```

## Rules

- `Card` = generic; `TableCard` = wraps a table; `RadioCard` = a big radio option (group several).
- Don't double-border: put a **plain** table inside `TableCard` (no extra border on the table).

## Related

- [Table](table.md) · [form-controls](form-controls.md) (small radio/checkbox)
