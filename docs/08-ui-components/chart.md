# Chart

> **Status: ready** · `import { ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig } from "@trf/ui2"` · source: `src/components/ui/chart.tsx`

A thin wrapper around [Recharts](https://recharts.org) (a direct dependency, `^3.9.1`) that
re-themes series colors from `--chart-1`…`--chart-5` (see `03-design-tokens.md`) instead of
hardcoded hex, so a chart follows light/dark and any `.theme-*` class for free. Adapted from the
shadcn chart registry onto this token system — same API shape, so shadcn examples mostly
transfer directly.

Recharts itself doesn't read CSS variables for `fill`/`stroke`. `ChartContainer` injects
`--color-{key}` custom properties (resolved from `config`) into a scoped `<style>` tag; series
then reference `var(--color-{key})` instead of a literal color.

## Usage

```tsx
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@trf/ui2";
import { AreaChart, Area, CartesianGrid, XAxis } from "recharts";

const config = {
  revenue: { label: "Revenue", color: "var(--chart-1)" },
} satisfies ChartConfig;

<ChartContainer config={config} className="h-64 w-full">
  <AreaChart data={data}>
    <CartesianGrid vertical={false} strokeDasharray="3 3" />
    <XAxis dataKey="month" tickLine={false} axisLine={false} />
    <ChartTooltip content={<ChartTooltipContent />} />
    <Area dataKey="revenue" type="monotone" stroke="var(--color-revenue)" fill="var(--color-revenue)" />
  </AreaChart>
</ChartContainer>
```

Consumers import Recharts primitives (`AreaChart`, `Area`, `CartesianGrid`, `XAxis`, `YAxis`,
...) directly — `@trf/ui2` doesn't re-export them, only the styling/context layer
(`ChartContainer`, `ChartTooltip*`, `ChartLegend*`). Add `recharts` as a direct dependency in
the consuming app (same version pin as this package's `package.json`).

## Rules

- Series colors come from `ChartConfig` (`--chart-1`…`--chart-5`), never a literal hex/oklch —
  that's what keeps a chart re-themeable.
- `ChartTooltipContent`/`ChartLegendContent` read labels back out of `ChartConfig` by data key —
  keep `config` and each series' `dataKey` in sync.
- Compose gradients (`<linearGradient>` + `fill="url(#id)"`) directly in the chart element for
  the shadcn-style filled-area look — see the kitchen sink's Chart section for a worked example.

## Related

- [03 Design Tokens](../03-design-tokens.md) (`--chart-1`…`--chart-5`) · [13 AI Coding Guidelines](../13-ai-coding-guidelines.md)
