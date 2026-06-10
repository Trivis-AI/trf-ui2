# Adopting @trf/ui2 in a TRF app

> **Status: ready** · For the 14 `trffront*` apps (and any new one).

## 1. Install

Always pin a **tag** — never `#main` (main moves). Use the latest release tag:

```bash
npm i github:triiberg/trf-ui2#v0.6.0
# or, for local side-by-side dev:
npm i file:../trf-ui2
```

> **AI agents:** the caller's migration prompt will specify the exact tag to use. If no tag is
> specified, check the latest release at github.com/triiberg/trf-ui2/releases before installing.

Peer deps the app already has: `react`, `react-dom`, `lucide-react`.

## 1b. Install the fonts (Geist + Geist Mono, self-hosted)

The tokens name **Geist** (UI) and **Geist Mono** (tables/numbers) but don't ship the files.
Self-host them — GDPR-clean, no external requests:

```bash
npm i @fontsource-variable/geist @fontsource-variable/geist-mono
```

Import once at your app entry (e.g. `main.tsx`), before your CSS:

```ts
import "@fontsource-variable/geist";
import "@fontsource-variable/geist-mono";
import "./index.css";
```

(If you prefer not to self-host, you can skip this — the tokens fall back to the system stack.)

## 2. Wire up tokens + Tailwind (once, in the app's main CSS)

```css
@import "tailwindcss";
@import "@trf/ui2/styles/tokens.css";

/* Let Tailwind see trf-ui2's classes so they get generated: */
@source "../node_modules/@trf/ui2/src/**/*.{ts,tsx}";

/* Dark mode via a .dark class on <html>: */
@custom-variant dark (&:where(.dark, .dark *));
```

## 3. Use it

```tsx
import { Button, Card, Dialog } from "@trf/ui2";
```

## 4. Point your AI coder at the system (the important bit)

Add this to the app's `AGENTS.md` (or `CLAUDE.md`) so any AI building UI here follows the
design system instead of improvising:

```md
## Design system — @trf/ui2

This app's UI is built with the TRF design system. Before writing any UI:

1. Read `node_modules/@trf/ui2/docs/STRUCTURE.json` — the manifest. Load only the doc you need.
2. Must-read first: `node_modules/@trf/ui2/docs/13-ai-coding-guidelines.md`.
3. Use components from `@trf/ui2` — never recreate Button/Input/Dialog/etc.
4. Colors/radius/fonts come from tokens only (see `03-design-tokens.md`). No hardcoded values.
5. Icons: Lucide only (`05-iconography.md`). Test light + dark mode.
```

That's it — single source of truth lives in `@trf/ui2`; every app stays in sync via the package.

## Related

- [README-START-HERE](README-START-HERE.md) · [13 AI Coding Guidelines](13-ai-coding-guidelines.md)
