# BrandMark

> **Status: ready** · `import { BrandMark, AppleMark, GoogleMark } from "@trf/ui2"` · source:
> `src/components/brand-mark.tsx`

Third-party company marks (Apple, Google, …) as inline SVG components, shared across all TRF
services so nobody re-exports a logo per app. Use them for sign-in buttons, provider/integration
lists, and payment-method rows.

This is the **one sanctioned exception** to the Lucide-only rule in
[05 Iconography](../05-iconography.md): Lucide does not and will not carry company logos. It is not
a general escape hatch, and it is not for in-house marks — the TRF mark is [`Logo`](../../src/components/logo.tsx).

## Usage

```tsx
// Sign-in buttons — Google on a light chip, Apple inverted against the page.
<Button variant="secondary"><GoogleMark /> Continue with Google</Button>
<Button variant="inverse"><AppleMark /> Continue with Apple</Button>

// Data-driven: render by name, e.g. from the identity providers a tenant has enabled.
{providers.map((p) => <BrandMark key={p} name={p} size={20} />)}

// Standalone, so it needs its own accessible name.
<BrandMark name="apple" size={32} label="Apple" />
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `name` | `BrandMarkName` | `"apple" \| "google"`. Unknown names render nothing. |
| `size` | `number` | Size of the square box the mark fits into, px. Default `16`. Aspect ratio is preserved, so a portrait mark is narrower than `size`. |
| `label` | `string` | Accessible name. **Omit** when visible text already names the brand — the mark then renders `aria-hidden`. |
| `className` | `string` | |

Also exported: `AppleMark` / `GoogleMark` (same props minus `name`) and `BRAND_MARKS`
(`{ name, label, monochrome }[]`) for iterating the registry.

## Rules

- **Monochrome vs multicolor is per mark, not a prop.** Apple is one flat shape: it uses
  `currentColor`, so it inherits the surrounding text token exactly like a Lucide icon and usually
  needs no styling at all (`text-primary-foreground` etc. only when you want to override it).
  Google's G keeps its four brand colors and ignores text color, because recoloring it breaks
  Google's brand guidelines. `BRAND_MARKS[].monochrome` tells you which you have.
- **Don't tint a multicolor mark.** If a design needs a Google mark on a dark fill, put it on a
  light chip, don't recolor it.
- **The Apple sign-in button uses `variant="inverse"`** ([Button](button.md)): dark fill with a
  light mark in light mode, white fill with a dark mark in dark mode. The mark needs no `className`
  there — `inverse` sets `text-background` and the mark follows `currentColor`.
- Inside `Button` / menu items the mark is constrained to 16px by the existing `[&_svg]:size-4`,
  exactly like a Lucide icon, so pass no `size` there. A non-square mark letterboxes inside that
  square box (SVG's default `preserveAspectRatio`) rather than distorting.
- **Never `import "…/assets/apple.svg"` in a consumer app.** ui2 ships raw source; a file import
  makes every app handle SVG assets and `*.svg` types. Use the component.

## Adding a mark

Drop the SVG in `src/assets/`, add an entry to `MARKS` in `src/components/brand-mark.tsx`, extend
the `BrandMarkName` union. Full checklist with the JSX-casing and `currentColor` conversions:
[`src/assets/README.md`](../../src/assets/README.md). The kitchen sink (Foundations → Brand marks)
renders the registry, so a new mark shows up there with no demo edits.

## Related

- [05 Iconography](../05-iconography.md) — Lucide is the only icon library; this is the exception
- [Button](button.md) · [03 Design Tokens](../03-design-tokens.md)
