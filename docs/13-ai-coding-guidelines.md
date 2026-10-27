# 13 — AI Coding Guidelines

> **Status: ready**

Non-negotiable rules for any AI (Tom's or Jaak's) writing UI **in** trf-ui2 or **against** it
from a consuming app. Keep it simple, fast, and on-system (KISS).

## Source-of-truth hierarchy

1. These docs (especially `03-design-tokens`, `07-component-architecture`)
2. `src/styles/tokens.css` — the tokens
3. `src/components/ui/` — the primitives (and `src/index.ts` barrel)
4. `demo/` — reference usage (kitchen sink)
5. Figma specs (when provided)

## Required workflow before writing UI

1. **Search the barrel** (`src/index.ts` / `@trf/ui2` exports). Component exists? Import it.
2. **No match?** Check whether it's a composition of existing primitives.
3. **Still nothing?** Follow doc 07 "New component process" — don't improvise a one-off.

## Non-negotiable rules

### Styling
- **Use `cn()`** from `@trf/ui2` for all class merging. Never raw template literals for Tailwind.
- **Semantic tokens only** for color (`bg-primary`, `text-muted-foreground`). Never hex/rgb/hsl.
- **On-scale only:** use `rounded-*` (derived from `--radius`) and the type scale. No
  `text-[13px]`, no arbitrary radii.
- **CVA** for any component with multiple variants. Variants are typed props.
- **No `!important`, no inline styles** for anything tokens or Tailwind can express.
- **Never add `cursor-pointer` to a component.** A global base rule in `tokens.css` already gives
  every interactive element (`button`, `a[href]`, `[role="button"]`, checkbox/switch/radio/select,
  etc.) a pointer cursor. Draggable handles are the only exception — they set `cursor-grab`
  (and `active:cursor-grabbing`) explicitly.

### Components
- **Never recreate** Button, Input, Dialog, etc. Import from `@trf/ui2`.
- **Don't make wrapper components** that just add a className to a primitive.
- **Add new primitives to the barrel** (`src/index.ts`) — trf-ui2 is consumed as a package.

### Icons
- **Lucide only** (see doc 05). Default `size-4`. Icon-only buttons need `aria-label`.

### Dark mode
- Every visual element must work in light **and** dark. Prefer token-driven colors that adapt;
  reach for `dark:` only when a token can't express it.

### UI text
- **Every user-facing string in a component goes through `tr()`** from `src/lib/i18n.ts`:
  visible text, placeholders, tooltips, aria-labels, empty states, status labels.
  `tr("<trn-ui-clear-search>", "Clear search")` takes a `<trn-ui-...>` kebab-case key and the
  English fallback. Reuse an existing key from `services/translations.json` when both its
  English and its meaning match. Brand names, code identifiers and data values stay as they are.
- **Call it while rendering, never at module scope.** A module constant is evaluated before the
  app plugs its translations in, so turn label constants into functions or getters.
- **Explicit props win.** Translate the default, not the prop: `placeholder = tr(...)` in the
  destructuring, `{ ...defaults, ...labels }` for a label object.
- **Values go in through placeholders:** `tr("<trn-ui-n-total>", "{n} total").replace("{n}", String(n))`.
  One key per whole sentence; never glue a sentence together from pieces.
- A new key also needs its translations in `services/translations.json` (see
  `documentation/I18N.md`).
- **Apps call `setTranslate` once in `main.tsx`**, before the first render:
  `setTranslate((key, fallback) => t.translate(key, fallback))`. Without it the components show
  their English fallbacks.

## Forbidden

- Inventing new colors, shadows, or type styles outside the tokens.
- Hardcoded color/size values; `!important`; inline styles for token-able things.
- Importing icons from anything but Lucide.
- Duplicating a primitive in app/feature code.

## Allowed / encouraged

- Compose existing primitives into new arrangements.
- Extend a component via documented CVA variants or new props (then update its doc).
- **Designer flow:** evolve patterns while improving UX — and flag reusable ones to graduate.

## Reject AI output if it

- Duplicates an existing primitive, uses hardcoded colors, uses off-scale type/radius, breaks
  dark mode, imports non-Lucide icons, or adds abstraction for a one-time use.

## Related

- [03 Design Tokens](03-design-tokens.md) · [05 Iconography](05-iconography.md) · [07 Component Architecture](07-component-architecture.md)
