# InfoGrid & InfoField

> **Status: ready** · `import { InfoGrid, InfoField } from "@trf/ui2"` · source: `src/components/info-grid.tsx`

A responsive grid of **label / value** pairs for detail and summary views (e.g. an invoice's
header facts). Semantic `<dl>/<dt>/<dd>`.

## Usage

```tsx
<InfoGrid columns={2}>
  <InfoField label="Customer">Triiberg AS</InfoField>
  <InfoField label="Status"><Badge variant="success">Paid</Badge></InfoField>
  <InfoField label="Payable"><Text mono>€1,240.00</Text></InfoField>
</InfoGrid>
```

- `InfoGrid` — `columns` (1–4 at ≥ sm; default 2).
- `InfoField` — `label` (muted), value as children (text, `Badge`, mono figures, …).

## Rules

- Use for read-only key/value facts, not forms (that's `Field` + inputs).
- Numbers use `<Text mono>` for tabular alignment.

## Related

- [Field](../../src/components/ui/field.tsx) (form rows) · [Card](../../src/components/ui/card.tsx)
