# ColorBadge, ColorSwatchPicker

> **Status: ready** · `import { ColorBadge, ColorSwatchPicker, SWATCH_COLORS } from "@trf/ui2"` · source: `src/components/ui/color-badge.tsx`, `src/components/color-swatch-picker.tsx`

A soft pill with a leading dot, like `StatusBadge`, but in a colour an org picked rather than one
that means a state. Built for task categories; fits any user-labelled list.

## Usage

```tsx
<ColorBadge color={category.color}>{category.name}</ColorBadge>

<ColorSwatchPicker value={color} onChange={setColor} />
```

`color`: `gray | red | orange | yellow | lime | green | teal | cyan | blue | purple | pink`
(`SWATCH_COLORS`). Unknown or empty renders gray, so an API field can be passed straight through.
`asSwatchColor(value)` narrows an untrusted string; `swatchFill[color]` is the solid fill class
for a bare dot.

## Rules

- **Store the name, never a value.** The colours are the `--swatch-*` tokens in `tokens.css`,
  defined for light and dark.
- A status or other state with a meaning (paid, overdue, error) is a `StatusBadge` tone. Use
  `ColorBadge` only when the colour is the user's choice.
- `ColorSwatchPicker` takes `labels` for translated colour names (hover and screen reader).

## Related

- [StatusBadge](status-badge.md) · [Avatar](avatar.md) (its own, separate palette) · [03 Design Tokens](../03-design-tokens.md)
