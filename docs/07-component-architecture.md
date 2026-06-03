# 07 — Component Architecture

> **Status: ready**

## Layer model

```
┌──────────────────────────────────────────────────────────┐
│  Tokens            src/styles/tokens.css                  │  ← @trf/ui2
│  CSS variables, @theme inline, light + dark               │
├──────────────────────────────────────────────────────────┤
│  Primitives        src/components/ui/*.tsx                 │  ← @trf/ui2
│  Radix + Tailwind + CVA. Exported from src/index.ts.      │
├──────────────────────────────────────────────────────────┤
│  Shared components src/components/*.tsx (composed)         │  ← @trf/ui2
│  Compose primitives (e.g. Field). Used by 2+ apps.        │
├──────────────────────────────────────────────────────────┤
│  Feature + pages   (lives in each consuming app)          │  ← trffront* apps
│  Compose @trf/ui2. Never reimplement a primitive here.    │
└──────────────────────────────────────────────────────────┘
```

The kitchen-sink **demo** (`demo/`) is the living showcase. It is not a library — never import
from it.

## What goes where

- **Primitive** (Button, Input, Dialog…): `src/components/ui/`, exported from `src/index.ts`.
  One canonical implementation each. Built on Radix (for behaviour/a11y) + Tailwind + CVA.
- **Shared composed** (Field, future PageHeader…): `src/components/`, also exported. Composes
  primitives; no new visual language.
- **Feature/page code:** stays in the consuming app. Composes `@trf/ui2`. If it reinvents a
  primitive, that's a bug.

## Conventions

- **Variants via CVA** for any component with more than one variant. Variants are typed props,
  not className overrides. (`buttonVariants({ variant, size })`.)
- **`cn()`** from `@trf/ui2` for all class merging — never raw template-literal Tailwind.
- **Barrel export required.** Unlike some shadcn setups, trf-ui2 **must** keep `src/index.ts`
  because it's consumed as a `github:` package. Add every new component to it.
- **Stay close to HTML.** Props mirror native attributes; let consumers compose, don't hide
  behaviour behind opaque wrappers.

## New component process (guardrails, not handcuffs)

1. **Check first.** Does a primitive or shared component already cover it? Search `src/index.ts`.
2. **Compose before creating.** Most needs are an arrangement of existing primitives.
3. **Real need → add it properly.** New primitive → `src/components/ui/` + export + a doc in
   `08-ui-components/`. New shared component → `src/components/` + export.
   **Always add a `<Section>` for it in the kitchen sink (`demo/src/App.tsx`)** showing every
   variant/state — the sink is the living showcase and its table of contents is auto-generated,
   so a new section appears in the nav automatically. A component with no sink section is incomplete.
4. **Designer flow:** if you introduce a new *pattern* while improving UX and it could be reused
   elsewhere, **flag it** so it can graduate into a shared component / pattern doc rather than
   living as a one-off.

## Related

- [03 Design Tokens](03-design-tokens.md)
- [13 AI Coding Guidelines](13-ai-coding-guidelines.md)
- [08 UI Components](08-ui-components/)
