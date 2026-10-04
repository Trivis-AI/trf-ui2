# PalettePicker

> **Status: ready** · `import { PalettePicker, PaletteSwatches } from "@trf/ui2"` · source: `src/components/palette-picker.tsx`

Choose a colour palette (Default, Trivis, Neutral, ...): a `RadioCard` per palette with its
name and four swatches. Used by the Appearance tab of Settings › User settings (frontlogin).
Presentational: the caller stores and applies the choice. In an app, that is app-shell's
`usePalette()`, which writes the shared cookie and the `theme-<value>` class on `<html>`, and
keeps the shell in step.

`PaletteSwatches` is the preview on its own (primary, secondary, accent, muted). Its wrapper
carries the palette's class, plus `.dark` while `<html>` is dark (`.theme-x.dark` needs both on
one element), so the dots show that palette's tokens wherever they sit.

## Usage

```tsx
import { PalettePicker } from "@trf/ui2";
import { PALETTE_OPTIONS, usePalette } from "@trf/app-shell";

const [palette, setPalette] = usePalette();
<PalettePicker options={PALETTE_OPTIONS} value={palette} onValueChange={setPalette} aria-label="Theme" />
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `options` | `{ value: string; label: string }[]` | `value` is the palette key; "trivis" is the base and has no class |
| `value` | `string` | The selected palette |
| `onValueChange` | `(value: string) => void` | Called on a pick |
| `className` | `string` | On the grid (1, 2 or 3 columns by width) |
| `aria-label` | `string` | Names the radio group |

`PaletteSwatches`: `palette` (key), `dark` (force a mode; default follows `<html>`), `className`.
