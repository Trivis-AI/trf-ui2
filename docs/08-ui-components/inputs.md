# Inputs: Input, Textarea, Field, SearchInput, CopyField

> **Status: ready** · `import { Input, Textarea, Field, SearchInput, CopyField } from "@trf/ui2"` ·
> source: `src/components/ui/{input,textarea,field,search-input}.tsx`, `src/components/copy-field.tsx`

## Input / Textarea

Token-styled native `<input>` / `<textarea>`. All native props pass through (`type`, `value`,
`onChange`, `placeholder`, `disabled`, …).

```tsx
<Input type="email" placeholder="you@trf.is" />
<Textarea placeholder="Free-text notes…" />
```

## Field — the form-row wrapper

Composes a `Label` + control + helper/error text. Wrap every form control in a `Field`.

```tsx
<Field label="Email" htmlFor="email" description="We never share it." required>
  <Input id="email" type="email" />
</Field>

<Field label="Amount" htmlFor="amount" error="Must be a positive number.">
  <Input id="amount" type="number" />
</Field>
```

Props: `label`, `htmlFor`, `description`, `error` (replaces description, turns destructive),
`required` (adds a marker). Works with `Input`, `Textarea`, `Select`, `Combobox`.

## SearchInput — search field with icon + clear

A leading magnifier icon over a standard `Input`, plus an optional trailing clear button. Purely
presentational: it forwards every `Input` prop (`value`, `onChange`, `placeholder`, …) and the ref
to the underlying `<input>`, so callers own the state.

```tsx
import { SearchInput } from "@trf/ui2";

<SearchInput
  value={q}
  onChange={(e) => setQ(e.target.value)}
  onClear={() => setQ("")}
  placeholder="Search contacts…"
/>
```

The clear button appears only when there is a value **and** `onClear` is provided. Omit `onClear`
for a plain, no-clear search field. The native WebKit cancel button is suppressed so the clear
affordance is the only one.

For a table's own quick filter use [`TableSearch`](server-data-table.md), which adds debouncing and
wires to `useTableQuery`. `SearchInput` is the primitive underneath it, for everything else.

## CopyField — read-only value + copy button

A read-only value paired with a copy-to-clipboard button — for secrets, invite links, IDs. Owns
its transient "copied" state (icon + label swap, auto-resets) and selects the text on focus.

```tsx
import { CopyField } from "@trf/ui2";

<CopyField value={apiKey} onCopy={() => toast.success("Copied")} />
<CopyField value="Invoice #1042" mono={false} />
```

Props: `value`, `mono` (default `true`), `size` (copy-button size, default `"sm"`), `copyLabel` /
`copiedLabel`, and `onCopy(value)` / `onCopyError(err)`. The DS stays **toast-free** — fire your
app's toast from `onCopy`. For a one-time secret in a dismissable banner, use
[`SecretReveal`](feedback.md).

## Rules

- Always pair the control's `id` with the `Field`'s `htmlFor` for accessibility.
- Use `Field` for the label/error scaffolding — don't hand-roll label markup.

## Related

- [Select](select.md) · [Combobox](combobox.md) · [form-controls](form-controls.md) ·
  [SecretReveal](feedback.md) · [MarkdownEditor](markdown.md) ·
  [TableSearch](server-data-table.md)
