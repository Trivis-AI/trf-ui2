# Dashboard primitives: StatTile, CountRow, DeadlineItem, Meter

> **Status: ready** · `import { StatTile, CountRow, DeadlineItem, Meter } from "@trf/ui2"` ·
> source: `src/components/{stat-tile,count-row,deadline-item,meter}.tsx`

Four small composed components for dashboard surfaces, graduated from the
frontlogin dashboard v3 design round (Figma: TRF Dashboard v3, 2026-09-28).

## StatTile

KPI tile: muted label, mono semibold figure, optional muted subtext. Composes Card.

```tsx
<StatTile label="Käive 2026" value="21 600 €" sub="kalendriaasta algusest" />
```

Put tiles in a `flex gap-4` row; each tile is `flex-1` by default.

## CountRow

Clickable "things to do" count: title + context left, large mono count right.
Renders a `<button>`; pass `onClick`. `tone="warning"` highlights the row.

```tsx
<CountRow
  title="Kinnitamata ostuarved"
  subtitle="2 ootab üle 3 päeva"
  count={3}
  tone="warning"
  onClick={goToPurchase}
/>
```

## DeadlineItem

Dated deadline row: calendar chip (month + day) beside title, muted
description and optional action node (usually a link-variant Button).

```tsx
<DeadlineItem month="OKT" day="10" title="TSD september"
  description="Oto on deklaratsiooni ette valmistanud."
  action={<Button variant="link" size="sm">Vaata ja esita</Button>} />
```

## Meter

Standalone horizontal meter (the non-table sibling of the table's MeterCell).
Bare form renders just the track; with `label`/`valueLabel` it renders a full
row: label, bar, mono value.

```tsx
<Meter value={0.38} label="Käibemaks" valueLabel="1 094 €" />
```

## Rules

- Figures are light-weight proportional (`font-light tabular-nums`), NOT mono:
  Jaak's call on the dashboard v3 review (2026-09-28). Geist Mono stays the rule
  for tabular data; large display numerals read better light.
- All colors are tokens; `tone="warning"` uses `--warning` at reduced opacity.
- These are composition pieces: page layout (rows, cards, grids) stays in the app.

## Related

- [03 Design Tokens](../03-design-tokens.md) · [chart.md](chart.md) (dashboards pair these with a compact Recharts line chart)
