# @trf/ui2

The TRF design system & component library. A clean-slate, **shadcn-style** system: curated
**Radix + Tailwind v4 + CVA** components, vendored as **owned source** (no runtime dependency on
shadcn), themed entirely by **CSS-variable tokens**. Shipped as raw `.tsx` — **no build step**.

Built to be **simple, fast, and AI-navigable**: small compartmentalized files and a docs layer
an AI coder loads on demand.

## Two layers

| Layer | Where | What |
|---|---|---|
| **Code** | `src/` | Tokens (`styles/tokens.css`), primitives (`components/ui/`), barrel (`index.ts`) |
| **Docs** | `docs/` | AI-first knowledge layer — start at [`docs/STRUCTURE.json`](docs/STRUCTURE.json) |

## Quick start (this repo)

```bash
npm install          # library deps (+ peers)
npm run typecheck    # tsc --noEmit
npm run demo:install # one-time: install the demo app
npm run dev          # kitchen-sink preview on http://localhost:5180
```

The **kitchen sink** (`demo/`) shows every component in all variants, a light/dark toggle, and a
live `--radius` slider demonstrating the "change one number" token model. It is a showcase, not
part of the published library.

## Using it in an app

See [`docs/for-consuming-apps.md`](docs/for-consuming-apps.md). Short version:

```bash
npm i github:triiberg/trf-ui2#main   # or file:../trf-ui2 for local dev
```
```css
@import "tailwindcss";
@import "@trf/ui2/styles/tokens.css";
@source "../node_modules/@trf/ui2/src/**/*.{ts,tsx}";
@custom-variant dark (&:where(.dark, .dark *));
```
```tsx
import { Button } from "@trf/ui2";
```

## The token model (the "look")

Everything visual flows from `src/styles/tokens.css`:
- **Radius** is derived from a single `--radius` (change it → all corners move).
- **Fonts** from `--font-sans` / `--font-mono`.
- **Colors** are semantic tokens with light (`:root`) and dark (`.dark`) values.

Swap that one file to re-skin the whole system (e.g. when the real Figma/brand theme lands).

## Stack

React 19 · TypeScript (strict) · Tailwind v4 · Radix UI · class-variance-authority ·
clsx + tailwind-merge (`cn()`) · Lucide icons.

## Status

**Phase 1** — foundation + core primitives (Button, Badge, Input, Textarea, Label, Field, Card,
Spinner, Separator, Dialog) + the AI docs layer. Forms, complex/interactive components, and the
app shell follow in later phases. See the project plan / `docs/STRUCTURE.json`.
