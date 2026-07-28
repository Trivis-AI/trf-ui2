# src/assets — shared brand marks

The `.svg` files here are the **design source of truth** for third-party brand marks that TRF
services need (sign-in buttons, payment/provider logos, integration lists). They are not imported
by any component at runtime.

What consumers actually import is `BrandMark` from `src/components/brand-mark.tsx`, which carries
the same paths inline. See [docs/08-ui-components/brand-mark.md](../../docs/08-ui-components/brand-mark.md).

## Why the paths are duplicated into a .tsx

@trf/ui2 ships **raw source** (consumers pin `github:Trivis-AI/trf-ui2#vX.Y.Z` and their own Vite
build compiles it). A `import apple from "./assets/apple.svg"` would therefore make every one of
the 14 consumer apps responsible for SVG asset handling and for a `declare module "*.svg"` type
shim. Inlining costs one paste per mark and needs zero consumer config, plus the mark can inherit
`currentColor` and tree-shake.

## Adding a new mark

1. Drop the SVG here, named after the brand: `stripe.svg`, `microsoft.svg`. Export it clean from
   Figma (no `<g>` wrappers, no `id`s, path data only).
2. Add an entry to `MARKS` in `src/components/brand-mark.tsx`:
   - `viewBox`, plus intrinsic `width`/`height` (they set the aspect ratio, so non-square marks
     are never squashed).
   - `monochrome: true` for a single flat shape — replace its `fill="#000"` with
     `fill="currentColor"` so it works in both themes. `monochrome: false` keeps the brand's own
     colors, for marks whose palette is part of the identity (Google's G).
   - Convert SVG attributes to JSX casing: `fill-rule` → `fillRule`, `clip-rule` → `clipRule`.
3. Add the name to the `BrandMarkName` union. `BRAND_MARKS` and the demo page pick it up
   automatically.
4. Optionally add a named wrapper (`StripeMark`) next to `AppleMark` / `GoogleMark`, and export it
   from `src/index.ts`.
5. Check it in the kitchen sink: `npm run dev` → Foundations → Brand marks (light and dark).

## Scope

- **The TRF mark itself is not here.** It lives in `src/components/logo.tsx` (`Logo`).
- **Raster assets (PNG/JPG illustrations) are out of scope for this path** — inlining them would
  bloat the source bundle. There is no shared static host for those yet; see
  [docs/open-questions.md](../../docs/open-questions.md).
