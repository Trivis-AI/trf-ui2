# RowEditModal

> **Status: ready** · `import { RowEditModal } from "@trf/ui2"` · source: `src/components/row-edit-modal.tsx`

A generic, controlled modal that edits one record from a schema-ish field list, so a list page can
offer "edit row" without navigating away. Composes `Dialog` + `Field` + `Input` / `Textarea` /
`Select` / `Switch` / `DatePicker`.

The split: the consumer owns the data and the save call; the modal owns the form frame, per-field
validation and errors, the busy state, and Esc/Enter.

## Usage

```tsx
import { RowEditModal, type RowEditField } from "@trf/ui2";

const FIELDS: RowEditField[] = [
  { key: "name", label: "Name", required: true },
  { key: "rate", label: "Rate", type: "number", min: 0, step: 0.01 },
  { key: "kind", label: "Kind", type: "select", options: KINDS },
  { key: "validFrom", label: "Valid from", type: "date" },
  { key: "active", label: "Active", type: "switch" },
  {
    key: "code",
    label: "Code",
    validate: (v) => (String(v ?? "").length > 8 ? "Max 8 characters" : null),
  },
];

<RowEditModal
  open={!!editing}
  onOpenChange={(o) => !o && setEditing(null)}
  title="Edit tax rate"
  fields={FIELDS}
  value={editing}
  onSubmit={async (next) => { await save(next); }}
/>
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `open` / `onOpenChange` | `boolean` / `(open) => void` | Controlled. |
| `title` / `description` | `ReactNode` | Dialog header. |
| `fields` | `RowEditField[]` | The editable fields, in display order. |
| `value` | `TValue \| null` | The record being edited; `null` when nothing is selected. |
| `onSubmit` | `(next: TValue) => void \| Promise<void>` | May return a Promise: the modal shows a pending state and disables the form until it settles, then closes on success. **Throw or reject to keep the modal open and surface the error.** |
| `onCancel` | `() => void` | Cancel button or dismiss. |
| `submitLabel` / `cancelLabel` | `string` | Default `"Save"` / `"Cancel"`. |
| `error` | `ReactNode` | A consumer-supplied error (e.g. the last server error) shown above the footer. |

### `RowEditField`

`key` (key into the record, also the control id), `label`, `type`
(`"text" | "number" | "textarea" | "select" | "switch" | "date"`, default `"text"`), `options`
(for `select`), `placeholder`, `description` (helper text, hidden when the field has an error),
`required` (marker + blocks submit when empty), `disabled`, `min` / `max` / `step` (number), and
`validate(value, values)` returning an error message to block submit. `validate` runs after the
required check.

## Behaviour worth knowing

- The form seeds on the **rising edge of `open`**, so an unstable `value` reference cannot wipe
  the user's edits mid-session.
- Date fields read `Date | string | number` and emit a `Date`. The consumer formats or serialises
  on save.
- A dismiss (Esc / overlay) is ignored while a save is in flight.
- A `number` field emits `null` for an empty input, not `NaN` or `""`.
- Errors clear per field as soon as that field changes.

## Rules

- For a full record with layout, sections, or cross-field logic, build a real form page. This is
  for the flat "edit a row" case.
- Do not pre-validate in `onSubmit` for anything a `validate` callback can express: field-level
  errors land on the field, submit errors land in the footer alert.

## Related

- [Dialog](dialog.md) · [Inputs & Field](inputs.md) · [Table & DataTable](table.md) ·
  [ServerDataTable](server-data-table.md)
