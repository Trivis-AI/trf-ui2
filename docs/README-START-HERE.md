# @trf/ui2 — design system docs

> **For AI coders:** read [`STRUCTURE.json`](STRUCTURE.json) first, then load only the doc you
> need. These files are deliberately small and narrow so you don't load the whole system into
> context. Each doc references adjacent docs instead of duplicating them.

- **Token source of truth:** `src/styles/tokens.css`
- **Components:** `src/components/ui/` (exported from `src/index.ts` as `@trf/ui2`)
- **Live preview:** `npm run dev` (the kitchen-sink demo in `demo/`)

## Status legend

- **ready** — follow as-is
- **draft** — usable, may still change
- **scaffold** — structure only, no real rules yet

## Before writing any UI (must-read, in order)

1. [13 AI Coding Guidelines](13-ai-coding-guidelines.md) — the non-negotiable rules
2. [03 Design Tokens](03-design-tokens.md) — use tokens, never raw values; light + dark
3. [07 Component Architecture](07-component-architecture.md) — where things live, what to import

## Read on demand

| When you are... | Read |
|---|---|
| Using a component | `08-ui-components/<name>.md` |
| Using an icon | [05 Iconography](05-iconography.md) |
| Adopting trf-ui2 in an app | [for-consuming-apps.md](for-consuming-apps.md) |

## Two audiences

- **Building a new feature (dev + AI coder):** guardrails apply — check for an existing
  component before inventing one; use tokens; stay on the type/icon system. See doc 13 + 07.
- **Improving existing UX (designer + AI coder):** token discipline still applies, but you may
  evolve patterns. If a new pattern could be reused elsewhere, **flag it** so it can graduate
  into a shared component or pattern doc (see doc 07, "New component process").

## Writing rule for these docs

Keep each doc narrow and strict. Reference adjacent docs; never duplicate them. Small files win.
