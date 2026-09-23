# StatusBadge

> **Status: ready** · `import { StatusBadge } from "@trf/ui2"` · source: `src/components/ui/status-badge.tsx`

A soft status pill with a leading dot (e.g. "● Paid") — for state-machine statuses on documents.
Softer than `Badge` (tinted background, not solid).

## Usage

```tsx
<StatusBadge tone="success">Paid</StatusBadge>
<StatusBadge tone="warning">Overdue</StatusBadge>
<StatusBadge tone="error">Cancelled</StatusBadge>
```

`tone`: `neutral | info | success | warning | error`.

## Rules

- **Map your domain statuses → tone in ONE place per app** (e.g. `Draft→neutral`, `Confirmed→info`,
  `Paid→success`, `Overdue→warning`, `Cancelled→error`), then use `StatusBadge` everywhere.
- `StatusBadge` = document/record *status*; `Badge` = generic solid label/count.
- A colour the user picks (a task category, say) is a [`ColorBadge`](color-badge.md), not a tone.

## Related

- [Badge](../../src/components/ui/badge.tsx) · [03 Design Tokens](../03-design-tokens.md)
