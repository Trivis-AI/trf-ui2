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
clsx + tailwind-merge (`cn()`) · Lucide icons · Geist + Geist Mono (self-hosted via Fontsource).

## Status

- **Phase 1** ✅ — foundation + core primitives (Button, Badge, Input, Textarea, Label, Field,
  Card, Spinner, Separator, Dialog) + the AI docs layer.
- **Phase 2** ✅ — forms & feedback (Select, Checkbox, Switch, RadioGroup, Tooltip, Alert,
  EmptyState, LoadingState).
- **Tables** ✅ — `Table` primitives (dependency-free) + `DataTable` (TanStack + dnd-kit:
  sorting, global filter, column drag-reorder, inline editing). TanStack chosen over AG Grid to
  keep ownership + token-native styling; AG Grid was evaluated and reserved for any future
  Excel-grade grid only.
- **Next** — DropdownMenu, Tabs, Combobox, and the app shell (AppShell, SideMenu, Page/
  PageHeader, typography). See `docs/STRUCTURE.json`.
