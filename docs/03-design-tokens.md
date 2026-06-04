# 03 — Design Tokens

> **Status: ready**

## Source of truth

All tokens live in **`src/styles/tokens.css`**. They are CSS custom properties on `:root`
(light) and `.dark` (dark overrides), mapped to Tailwind v4 utilities via the `@theme inline`
block. There is **no `tailwind.config.js`** — Tailwind v4 reads the tokens directly.

## The "change one number" principle

- **Radius:** change `--radius` once → every `rounded-sm/md/lg/xl/2xl` moves, because the scale
  is *derived* (`--radius-sm: calc(var(--radius) - 4px)`, etc.). Never hardcode a corner radius.
- **Font family:** change `--font-sans` / `--font-mono` once → all UI text follows. (Geist +
  Geist Mono; tables/numbers use mono.)
- **Text size:** change `--font-scale` once → **every** text size scales, because each size is
  `calc(<rem> * var(--font-scale))`. Default 1.
- **Color:** every color is a semantic token with a light and dark value. Change it in one place.

## Type scale & `--font-scale`

Sizes (`--text-xs … --text-3xl`) are **rem-based** and multiplied by `--font-scale`:

- **rem** ⇒ the browser font-size / zoom is respected (accessibility). **Never set an absolute
  px root font-size** — it would break that.
- **`--font-scale`** ⇒ one knob scales all text. An app-level **S / M / L** setting just sets it
  (e.g. `0.9 / 1 / 1.15`) and **composes on top** of the browser size (browser × scale).

Scale: `xs 12 · sm 14 (body) · base 16 · lg 18 · xl 20 · 2xl 24 · 3xl 30`. Use the
typography components (`H1/H2/H3/Text`) or `text-*` utilities — never off-scale (`text-[13px]`).
See [08-ui-components/typography.md](08-ui-components/typography.md).

## Color tokens (semantic — use these names)

| Group | Tokens |
|---|---|
| Surface | `background`, `card`, `popover`, `muted`, `secondary`, `accent` |
| Text-on-surface | `foreground`, `card-foreground`, `popover-foreground`, `muted-foreground`, `secondary-foreground`, `accent-foreground`, `primary-foreground` |
| Interactive | `primary`, `border`, `input`, `ring` |
| Status | `destructive`, `success`, `warning` (+ each `*-foreground`) |

Use them as Tailwind utilities: `bg-primary`, `text-muted-foreground`, `border-input`,
`bg-destructive`, `text-success-foreground`. Opacity is allowed (`bg-primary/90`).

### `--primary` is theme-dependent (brand + action)

`--primary` is the brand/action color — buttons, links, focus ring, checked controls, **and the
logo** (`Logo` defaults to `text-primary`). Unlike the other tokens it changes *character*, not
just lightness, between themes:

- **Light:** near-black **ink** (`oklch(0.22 0.018 240)` — the same value as the dark-mode
  background) with white foreground. A sleek dark-button-on-light look.
- **Dark:** **amber** (`oklch(0.76 0.188 70)`) with dark foreground.

Amber-as-primary fails on light backgrounds (low contrast, reads as a warning), so light uses
the ink; amber returns in dark where it pops. Brand orange source: `#FF9100`.

## Dark mode

A `.dark` class on a parent (the app toggles it on `<html>`) activates the dark token values.
Components do **not** need `dark:` overrides — the tokens adapt automatically. Only reach for
`dark:` when a token genuinely can't express the difference.

## Rules

1. **No raw hex / rgb / hsl in component code.** Always a token.
2. **No hardcoded radius / font-size off the scale.** Use `rounded-*` and the type scale.
3. **Every new color token needs both a `:root` and `.dark` value.**
4. New shared tokens go in `tokens.css` (one place), never component-scoped CSS variables.
5. Test both light and dark when touching anything visual (toggle in the demo).

## Related

- [02 / 04 typography](README-START-HERE.md) — type scale (TBD)
- [07 Component Architecture](07-component-architecture.md)
- [13 AI Coding Guidelines](13-ai-coding-guidelines.md)
