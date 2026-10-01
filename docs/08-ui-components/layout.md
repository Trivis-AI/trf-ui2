# Layout & Page — Stack, Row, Grow, Page, PageHeader, RecordHeader

> **Status: ready** · `import { Stack, Row, Grow, Page, PageHeader, RecordHeader } from "@trf/ui2"`
> source: `src/components/{stack,row,page}.tsx`

The most-used layer in the apps. Compose screens from these instead of hand-writing flex divs.

## Page — the screen container

Width-capped, padded, anchored left (no centering since v7.16.0: pages start at the same left edge as the shell bar and the lists). Put a `PageHeader` and a `Stack` inside.

```tsx
<Page size="lg">
  <PageHeader
    title="Invoices"
    description="Sales documents for this organisation."
    actions={<Button>New invoice</Button>}
  />
  <Stack gap={6}>{/* page content */}</Stack>
</Page>
```
`size`: `sm | md | lg | xl | 2xl | full` (default `lg`).

## PageHeader — title row

`title` · `description` · `actions` (right-aligned). The title currently uses a default heading
style; it will adopt the `H1` component once the type scale is decided (open-questions Q1).

## RecordHeader — a record page's identity

On a page about one record (a contact, an item, a contract, a ledger entry), the
first thing in the content is the record's name at title size, its identity badges,
and the facts people check to know they opened the right one. It is content, so it
scrolls away; the shell crumb keeps way-finding and `ShellBarMeta` keeps live status.

```tsx
<RecordHeader
  title={contact.legal_name}
  badges={<Badge variant="secondary">Customer</Badge>}
  facts={[
    { label: t.translate('<trn-reg-code>', 'Reg code'), value: contact.registration_code, mono: true },
    { label: t.translate('<trn-vat>', 'VAT'), value: contact.vat_number, mono: true },
  ]}
  description={contact.notes}
/>
```

Facts with an empty value are skipped. Codes and numbers take `mono`. Status
(active, posted, archived) goes in `ShellBarMeta`, not in the header.

## Stack — vertical rhythm

```tsx
<Stack gap={4} align="start">{children}</Stack>
```
`gap` is a Tailwind spacing step (0,1,2,3,4,5,6,8,10,12; default 4). `align`: start/center/end/stretch.

## Row + Grow — horizontal layout

```tsx
<Row gap={3} justify="between" align="center">
  <Button variant="secondary">Back</Button>
  <Grow><Input placeholder="fills the space" /></Grow>
  <Button>Save</Button>
</Row>
```
`Row`: `gap`, `align` (start/center/end/stretch/baseline), `justify` (start/center/end/between),
`wrap`. **`Grow`** fills remaining horizontal space inside a Row.

## TablePage — the full-width table organism

For server-driven list pages, don't hand-roll the frame from `Page` + `PageHeader`.
`TablePage` composes the full-width layout (header, toolbar, filter bar, bulk actions,
table, pagination footer) with fixed regions and guardrails. Defaults to `size="full"`.
See [ServerDataTable, TablePage & cell renderers](./server-data-table.md).

## Rules

- Reach for these before writing raw `flex`/`grid` divs — keeps spacing on the scale.
- `gap` values are spacing-scale steps, not arbitrary px.
- All accept `className` and standard div props; `cn()` merges your classes safely.

## Related

- [13 AI Coding Guidelines](../13-ai-coding-guidelines.md) · [03 Design Tokens](../03-design-tokens.md)
- Typography (`H1/H2/Text`) is pending — see [open-questions.md](../open-questions.md) Q1.
