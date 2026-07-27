# Board

> **Status: ready** · `import { Board } from "@trf/ui2"` · source: `src/components/board.tsx`

A drag-and-drop board (kanban). Columns are the workflow axis and run horizontally: you move a
card along them, so every column stays visible even when empty, because an empty column is
information too. Swimlanes are an optional cross-cut (per assignee, per category) and run as rows.

The component holds no data of its own. Items carry the column and swimlane they belong to, the
caller renders the card body, and a drop reports where the card landed. Which lanes exist, and
whether an empty one is worth showing, is the caller's policy, not the board's.

Built on `@dnd-kit/core`.

## Usage

```tsx
import { Board, type BoardItem } from "@trf/ui2";

interface Deal extends BoardItem {
  title: string;
  amount: string;
}

<Board<Deal>
  columns={[
    { id: "lead", label: "Lead", badge: <Badge>{counts.lead}</Badge> },
    { id: "won", label: "Won", icon: <StatusDot tone="success" /> },
  ]}
  swimlanes={owners.map((o) => ({ id: o.id, label: o.name, meta: o.total }))}
  items={deals}
  renderCard={(deal) => <DealCard deal={deal} />}
  onMove={(deal, to) => moveDeal(deal.id, to)}
  emptyCell={<Text muted>Nothing here</Text>}
/>
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `columns` | `BoardColumn[]` | `{ id, label, badge?, icon? }`. `badge` is the trailing header slot (typically a count), `icon` the leading one (typically a status dot). |
| `items` | `TItem[]` | Each extends `BoardItem` = `{ id, columnId, swimlaneId? }`. Omit `swimlaneId` on a board with no lanes. |
| `swimlanes` | `BoardSwimlane[]` | `{ id, label, meta? }`. Omit for a single implicit lane. `meta` is a secondary line under the label, typically a total. |
| `renderCard` | `(item) => ReactNode` | The card body. The board owns the drag wrapper only. |
| `onMove` | `(item, to) => void` | A card was dropped somewhere new. **Not** called when it lands where it started. `to` is `{ columnId, swimlaneId? }`. |
| `columnWidth` | `number` | Default `300`. The board scrolls horizontally past the viewport rather than squeezing columns. |
| `swimlaneLabels` | `"above" \| "gutter"` | Default `"above"`: the label sits on its own row over the lane, costing a little height and giving every column the width a side gutter would have taken. `"gutter"` keeps it in a left column, holding the label in view while the lane scrolls. |
| `gutterWidth` | `number` | Default `140`. Only applies with `swimlaneLabels="gutter"`. |
| `emptyCell` | `ReactNode` | Shown in a lane cell with no cards. |
| `readOnly` | `boolean` | Disables dragging, e.g. no write permission. |
| `className` | `string` | On the scroll container. |

## Rules

- **Apply `onMove` optimistically and roll back if the write fails.** The board renders from
  `items`, so nothing moves until your state does.
- Keep `renderCard` cheap. It also renders the drag overlay, so it runs twice during a drag.
- A drag starts only after 4px of pointer movement, so a click on a control inside a card is
  still a click. Keyboard drag works via `KeyboardSensor`.
- Empty columns stay rendered on purpose. Filter the `columns` array if a column genuinely does
  not apply to the current view.

## Related

- [Cards](cards.md) · [Badge](badge.md) · [StatusBadge](status-badge.md)
- [03 Design Tokens](../03-design-tokens.md)
