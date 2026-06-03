# 03 — Design Tokens

> **Status: ready**

## Source of truth

All tokens live in **`src/styles/tokens.css`**. They are CSS custom properties on `:root`
(light) and `.dark` (dark overrides), mapped to Tailwind v4 utilities via the `@theme inline`
block. There is **no `tailwind.config.js`** — Tailwind v4 reads the tokens directly.

## The "change one number" principle

- **Radius:** change `--radius` once → every `rounded-sm/md/lg/xl/2xl` moves, because the scale
  is *derived* (`--radius-sm: calc(var(--radius) - 4px)`, etc.). Never hardcode a corner radius.
- **Font:** change `--font-sans` once → all UI text follows.
- **Color:** every color is a semantic token with a light and dark value. Change it in one place.

## Color tokens (semantic — use these names)

| Group | Tokens |
|---|---|
| Surface | `background`, `card`, `popover`, `muted`, `secondary`, `accent` |
| Text-on-surface | `foreground`, `card-foreground`, `popover-foreground`, `muted-foreground`, `secondary-foreground`, `accent-foreground`, `primary-foreground` |
| Interactive | `primary`, `border`, `input`, `ring` |
| Status | `destructive`, `success`, `warning` (+ each `*-foreground`) |

Use them as Tailwind utilities: `bg-primary`, `text-muted-foreground`, `border-input`,
`bg-destructive`, `text-success-foreground`. Opacity is allowed (`bg-primary/90`).

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
