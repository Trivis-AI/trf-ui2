# QuantityInput

> **Status: ready** · `import { QuantityInput } from "@trf/ui2"` · source: `src/components/quantity-input.tsx`

A numeric quantity input with its unit riding inside the field ("1 tk"). The unit
code is always readable, so the cell still says what it measures at rest; hovering
the field surfaces the picker's chevron, and clicking the code opens a unit
dropdown. Built for editable table cells (invoice rows, order lines) where a
separate unit column would cost width the description needs, but works in forms
too via `variant="default"`.

## Usage

```tsx
// Editable table cell (quiet chrome, the default)
<QuantityInput
  value={draft.quantity}
  onValueChange={(v) => updateDraft({ quantity: v })}
  units={units.map((u) => ({ id: u.id, label: u.code_localisation }))}
  unitId={draft.unit_id}
  onUnitChange={(id) => updateDraft({ unit_id: id })}
  aria-label="Quantity"
/>

// Read-only unit suffix: omit onUnitChange
<QuantityInput value={qty} onValueChange={setQty} units={UNITS} unitId="kg" />
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `value` | `string` | Quantity, as the string the caller stores (numeric input semantics). |
| `onValueChange` | `(value: string) => void` | Fires per keystroke, like a plain input. |
| `units` | `QuantityInputUnit[]` | `{ id, label }` — label is the short code shown in the field ("tk", "h", "kg"). |
| `unitId` | `string` | The selected unit. Unknown/absent id renders "—". |
| `onUnitChange` | `(unitId: string) => void` | Omit to render the unit as a plain read-only suffix. |
| `variant` | `"default" \| "quiet"` | `"quiet"` (default) is the editable-table cell style; `"default"` the form chrome. |
| `disabled` | `boolean` | Disables both the input and the picker. |
| `aria-label` | `string` | Accessible name for the quantity input. |
| `unitLabel` | `string` | Accessible name for the unit picker. Default `"Unit"`. |

## Notes

- The picker's chevron is hidden at rest and fades in on field hover, focus, or
  while the dropdown is open, keeping dense tables quiet. The unit code itself is
  always visible and always clickable.
- Right padding on the input reserves the unit's lane, so right-aligned digits
  never run under the code.
- The unit trigger is a bare Radix `Select` trigger styled as a chip, not the
  house `SelectTrigger`, which would bring form-field chrome (h-9, border,
  full width) into the cell.
