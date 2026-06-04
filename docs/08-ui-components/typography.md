# Typography — H1, H2, H3, Text

> **Status: ready** · `import { H1, H2, H3, Text } from "@trf/ui2"` · source: `src/components/typography.tsx`

A **tight, weight-driven** scale (benchmarked against Claude/Anthropic Sans and dense product
UIs): small size steps, hierarchy carried by **weight + color**, not big size jumps.

## The scale

| Component | Size | Weight | Use |
|---|---|---|---|
| `H1` | 24px (`text-2xl`) | semibold | Page title |
| `H2` | 20px (`text-xl`) | semibold | Section heading |
| `H3` | 16px (`text-base`) | semibold | Subsection (hierarchy by *weight*, not size) |
| `Text` (default) | 14px (`text-sm`) | normal | Body — the workhorse |
| `Text size="xs"` | 12px | normal | Captions, meta, helper text |

Headings use **`font-semibold` (600) — never `font-bold`/700.**

## Text

```tsx
<Text>Body copy (14px).</Text>
<Text size="xs" tone="muted">Caption / meta.</Text>
<Text weight="medium">Emphasis via weight, not size.</Text>
<Text mono>€1,240.00</Text>        {/* monospace + tabular-nums for figures */}
<Text as="span">Inline.</Text>
```
Props: `size` (xs/sm/base/lg) · `tone` (default/muted/destructive) · `weight`
(normal/medium/semibold) · `mono` (figures) · `as` (p/span/div/label).

## ⭐ Scaling — one knob, accessible

All sizes are `rem × var(--font-scale)`:

- **Browser font-size / zoom is respected** (rem-based) — never hardcode a px root font-size.
- **One knob, `--font-scale`** (default 1), scales *all* text proportionally — like `--radius`
  for corners.
- An app **S / M / L** size setting just sets `--font-scale` (e.g. `0.9 / 1 / 1.15`). It
  **composes on top** of the browser setting (browser × app scale), never replaces it.

```ts
document.documentElement.style.setProperty("--font-scale", "1.15"); // "L"
```

## Rules

- Use these components / the `text-*` scale — **never off-scale sizes** (`text-[13px]`).
- Hierarchy = weight + color first, size second. Reserve 20+/24 for real headings.
- Numbers in tables/figures use `mono` (`font-mono` + `tabular-nums`). DataTable does this
  automatically for right-aligned columns.

## Related

- [03 Design Tokens](../03-design-tokens.md) · [13 AI Coding Guidelines](../13-ai-coding-guidelines.md)
- [layout.md](layout.md) — `PageHeader` renders its title as `H1`.
