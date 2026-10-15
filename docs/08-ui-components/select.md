# Select

> **Status: ready** · `import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@trf/ui2"` · source: `src/components/ui/select.tsx`

Accessible dropdown select (Radix). Keyboard nav, typeahead, and portal handled for you.

## Parts

`Select` (root) · `SelectTrigger` + `SelectValue` (the closed control) · `SelectContent` (the
popup) · `SelectItem` · optional `SelectGroup`, `SelectLabel`, `SelectSeparator`.

## Usage

```tsx
<Field label="Document type" htmlFor="doctype">
  <Select defaultValue="invoice" onValueChange={setType}>
    <SelectTrigger id="doctype"><SelectValue placeholder="Pick a type…" /></SelectTrigger>
    <SelectContent>
      <SelectItem value="invoice">Invoice</SelectItem>
      <SelectItem value="offer">Offer</SelectItem>
    </SelectContent>
  </Select>
</Field>
```

## In a table cell (`variant="cell"`)

For a select that is a cell of an editable table (a tax rate per invoice row, a boolean in a
grid), give the trigger `variant="cell"` inside `<TableCell editable>`. The trigger then draws
nothing of its own, no border, background, ring or radius, and fills the cell; the cell shows
hover, focus and the open state. Alignment is yours: `justify-end` for a figure.

```tsx
<TableCell editable>
  <Select value={rateId} onValueChange={setRateId}>
    <SelectTrigger variant="cell" aria-label="VAT rate" className="justify-end font-mono tabular-nums">
      <SelectValue />
    </SelectTrigger>
    <SelectContent align="end">…</SelectContent>
  </Select>
</TableCell>
```

See [Table, editable cells](table.md#editable-cells). Demo: "Line items" in the kitchen sink.

## Rules

- Controlled via `value` + `onValueChange`, or uncontrolled via `defaultValue`.
- Always give a `SelectValue placeholder` for the empty state.
- Wrap in [`Field`](../../src/components/ui/field.tsx) for label/error. Don't build a custom dropdown.

## Related

- [13 AI Coding Guidelines](../13-ai-coding-guidelines.md)

## SimpleSelect (flat options + empty value)

> `import { SimpleSelect } from "@trf/ui2"` · source: `src/components/simple-select.tsx`

Radix Select can't represent an empty-string value. For the common "native `<select>`" case —
a flat options array where `""` means "nothing selected" — use `SimpleSelect`: it bridges the
`"" <-> "__none__"` sentinel internally so app code never sees it.

```tsx
<Field label="Project type" htmlFor="ptype">
  <SimpleSelect
    id="ptype"
    value={projectType}            // "" = nothing selected
    onChange={setProjectType}      // receives "" when cleared
    options={[{ value: "fixed", label: "Fixed price" }, { value: "hourly", label: "Hourly" }]}
    placeholder="Pick a type…"
    noneLabel="— None —"           // optional explicit clear item
  />
</Field>
```

Use the composable `Select` parts when you need groups, separators, or custom item content.
Graduated from trffrontcrm's local `SimpleSelect` adapter.
