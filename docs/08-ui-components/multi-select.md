# MultiSelect

> **Status: ready** · `import { MultiSelect } from "@trf/ui2"` · source: `src/components/multi-select.tsx`

A filter select that takes several values. Built for table filter bars: a summarising trigger over
a checkbox list in a popover.

The list holds **only real values**. "All" is not an item in it: mixing a meta-option with real
ones forces every implementation to answer awkward questions (does ticking one untick All? does
ticking All visibly tick the rest?) and none of the answers are obvious. Instead the trigger
summarises what is selected, and select-all / clear live in the popover header as actions, which
is what they are.

## Usage

```tsx
import { MultiSelect, TableFilterBar } from "@trf/ui2";

<TableFilterBar onClear={query.clearFilters}>
  <MultiSelect
    options={[
      { value: "draft", label: "Draft" },
      { value: "sent", label: "Sent" },
      { value: "cancelled", label: "Cancelled", group: "terminal" },
    ]}
    value={query.filters.status ?? []}
    onChange={(next) => query.setFilter("status", next)}
    emptyLabel="Any status"
    allLabel="All statuses"
  />
</TableFilterBar>
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `options` | `MultiSelectOption[]` | `{ value, label, group?, keywords? }`. Options sharing a `group` render together with a separator between groups; use it to set apart values that are off by default (terminal statuses, say) from the everyday ones. `keywords` is the plain-text fallback for search when `label` is not a string. |
| `value` | `string[]` | Controlled selection. |
| `onChange` | `(next: string[]) => void` | Emitted in **options order**, not click order, so the trigger summary and any serialized URL stay stable. |
| `emptyLabel` | `ReactNode` | Trigger text when nothing is selected. Default `"None"`. |
| `allLabel` | `ReactNode` | Trigger text when everything is selected, e.g. `"All statuses"`. Default `"All"`. |
| `searchable` | `boolean` | Show a search box. Default: automatic above 8 options. |
| `searchPlaceholder` | `string` | Default `"Search…"`. |
| `selectAllLabel` / `clearLabel` | `string` | Popover header actions. Default `"Select all"` / `"Clear"`. |
| `id`, `disabled`, `className` | | `className` lands on the trigger button. |

The trigger reads: `emptyLabel` when nothing is picked, `allLabel` when everything is, the single
label when one is, and `<first label> +N` otherwise.

## Rules

- Use for **filters**, where "several values" means OR. For picking several entities as a form
  value, use a [`Combobox`](combobox.md)-based control instead.
- Do not add an "All" option to `options`. Use `allLabel` and the header actions.
- Empty `value` means "no filter applied" in most backends. Decide that mapping once per page,
  not per control.

## Related

- [Select & SimpleSelect](select.md) · [Combobox](combobox.md)
- [ServerDataTable & TableFilterBar](server-data-table.md)
