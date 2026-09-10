# EntityCombobox

> **Status: ready** · `import { EntityCombobox } from "@trf/ui2"` · source:
> `src/components/entity-combobox.tsx` (built on `Input` + `Badge`)

**Type-in-place entity search field**: a regular form input whose text doubles as the search
query, with a floating suggestion list and an optional secondary "fallback" group (e.g. import
candidates from the EE business registry when the primary CRM search comes up empty).

Graduated from three near-identical app components: `CustomerCombobox` (trfinvoices),
`SupplierCombobox` (trffrontpurchase), `ContactAutocomplete` (trffrontcrm).

## When to use which

| | `Combobox` | `AsyncCombobox` | `EntityCombobox` |
| --- | --- | --- | --- |
| Trigger | button | button | the input itself |
| Options | static array | async search | async search |
| Typed text | filter only | filter only | **is the field value** |
| Use when | small known list | large/remote list | name fields (customer, supplier, contact) |

## Usage

The component is **dumb**: it renders, you fetch. You own `query`, `items`, and what a pick means.
`onQueryChange` fires every keystroke (update state, mark dirty, clear stale results);
`onSearch` fires debounced — fetch there.

```tsx
import { EntityCombobox, type EntityComboboxItem } from "@trf/ui2";

function CustomerField() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<EntityComboboxItem[]>([]);
  const [registry, setRegistry] = useState<EntityComboboxItem[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [importing, setImporting] = useState(false);

  return (
    <EntityCombobox
      id="customer"
      query={query}
      onQueryChange={(q) => {
        setQuery(q);
        if (!q.trim()) { setItems([]); setRegistry([]); }
      }}
      onSearch={async (q) => {
        const contacts = await crm.autocomplete(q);
        setItems(contacts.map(c => ({
          key: c.id, title: c.legal_name, code: c.registration_code, description: c.email,
        })));
        if (contacts.length === 0 && q.length >= 2) {
          setRegistryLoading(true);
          try {
            const orgs = await registry.search(q);
            setRegistry(orgs.map(o => ({
              key: o.reg_code, title: o.name, code: o.reg_code, description: o.address,
            })));
          } finally { setRegistryLoading(false); }
        } else setRegistry([]);
      }}
      items={items}
      onPick={(item) => { setQuery(item.title); setItems([]); applyCustomer(item.key); }}
      fallbackItems={registry}
      fallbackLabel="Business Registry"
      fallbackLoading={registryLoading}
      fallbackLoadingText="Searching business registry…"
      fallbackBusy={importing}
      onFallbackPick={async (org) => {
        setImporting(true);
        try { const c = await crm.importContact(org.key); setQuery(c.legal_name); setRegistry([]); }
        finally { setImporting(false); }
      }}
    />
  );
}
```

## Props

| Prop | Type | Default | Notes |
| --- | --- | --- | --- |
| `query` | `string` | — | Controlled input text |
| `onQueryChange` | `(q) => void` | — | Every keystroke |
| `onSearch` | `(q) => void` | — | Debounced; not called for empty queries |
| `debounceMs` | `number` | `300` | |
| `items` | `EntityComboboxItem[]` | — | Primary suggestions |
| `onPick` | `(item) => void` | — | Dropdown closes itself |
| `pickLabel` | `string` | `"Select"` | Badge on primary rows |
| `fallbackItems` | `EntityComboboxItem[]` | `[]` | Secondary group |
| `fallbackLabel` | `string` | — | Group header |
| `fallbackLoading` / `fallbackLoadingText` | | | Loading row for the secondary search |
| `onFallbackPick` | `(item) => void` | — | e.g. import-from-registry |
| `fallbackPickLabel` | `string` | `"Import"` | Badge on secondary rows |
| `fallbackBusy` | `boolean` | `false` | Dims + disables secondary rows |
| `id` / `placeholder` / `disabled` / `required` / `className` | | | Standard |

`EntityComboboxItem`: `{ key, title, code?, description? }` — title is the main line, code renders
muted inline, description as a muted sub-line.

## Behavior

- Dropdown opens on typing, closes on pick / `Escape` / click outside.
- Keyboard: `↓`/`↑`/`Home`/`End` move the highlight, `Enter` takes the highlighted row
  (primary or fallback), `Escape` closes.
- `Tab` **accepts** — the highlighted row, or the first primary suggestion when nothing is
  highlighted — and then lets focus move on. Fallback rows are never taken this way: they
  create a record somewhere else, which leaving a field must not do silently. Without this
  a user who typed a name and tabbed on left the field holding free text that looked picked
  but carried no id.
- Translation: pass translated strings via `pickLabel`, `fallbackPickLabel`, `fallbackLabel`,
  `fallbackLoadingText`, `placeholder` — the component ships no copy of its own.

## Related

- [AsyncCombobox](async-combobox.md) · [Combobox](combobox.md) · [Inputs](inputs.md)
