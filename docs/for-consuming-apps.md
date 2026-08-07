# Adopting @trf/ui2 in a TRF app

> **Status: ready** · For the 14 `trffront*` apps (and any new one).

## 1. Install

Always pin a **tag** — never `#main` (main moves). Use the latest release tag:

```bash
npm i github:Trivis-AI/trf-ui2#v0.6.6
# or, for local side-by-side dev:
npm i file:../trf-ui2
```

> **AI agents:** the caller's migration prompt will specify the exact tag to use. If no tag is
> specified, check the latest release at github.com/Trivis-AI/trf-ui2/releases before installing.

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
   For page layout, page width, back-nav or list pages, also read
   `node_modules/@trf/ui2/docs/17-app-layout-conventions.md` (suite-wide rules).
3. Use components from `@trf/ui2` — never recreate Button/Input/Dialog/Select/Checkbox/etc.
   Search the barrel first; if it exists, import it.
4. Colors/radius/fonts come from tokens only (see `03-design-tokens.md`). No hardcoded values,
   no raw Tailwind palette colours (`amber-500`), no off-scale sizes (`text-[11px]`).
5. Icons: Lucide only (`05-iconography.md`). Test light + dark mode.
6. Before committing UI work, run `npx trf-ui2-check`.
```

Point 2 names doc 17 deliberately: an agent told to read only doc 13 learns the styling rules
and none of the layout ones, which is how page-width and back-link drift gets written.

That's it — single source of truth lives in `@trf/ui2`; every app stays in sync via the package.

## 5. Verify the wiring (do not trust the build)

`tsc && vite build` passes on a broken setup, and the failures it hides are silent ones.
frontsupport shipped 11 green builds with two defects in the five lines above:

- **`@custom-variant dark` missing.** This is the one that rendered wrong. `tokens.css` switches
  theme values on a `.dark` class, so without that line Tailwind v4 compiles `dark:` to a
  `prefers-color-scheme` media query instead, and the two disagree. Confirmed three ways: the
  built bundle carried `@media (prefers-color-scheme:dark)` where it should have carried
  `:where(.dark,.dark *)`, and a browser A/B under emulated OS dark showed the app's warning
  banner in bright `amber-400` on a near-white ground instead of the intended `amber-700`.
- **`@source` pointing at `@trf/ui2/dist`,** which the package does not ship (it ships `src`).
  Tailwind ignores a glob that matches nothing, so the line did nothing at all. Severity stated
  honestly: under `@tailwindcss/vite` this is *latent*, because that plugin also scans Vite's
  module graph and picks up the classes of imported components anyway. An A/B of the real
  production build put the two stylesheets 1.2 KB apart, the broken one larger. It bites when CSS
  is built outside Vite, or when a class is referenced somewhere the graph does not reach.

**On measuring this, which is worth more than either finding.** Three defects were suspected;
one was real. The `dist` typo was first measured by compiling the stylesheet through bare
postcss, which reported 64% of the CSS missing. That figure was an artifact of the harness: no
Vite, therefore no module graph. A suspected third defect (fonts installed and never applied)
turned out not to exist at all, because Tailwind preflight applies the theme font to `<html>`
and `getComputedStyle` reported Geist either way. Both wrong conclusions came from measuring in
a simplified reproduction. A/B through `npm run build`, and read the rendered page.

Run the checker instead:

```bash
node node_modules/@trf/ui2/scripts/check-consumer.mjs      # or: npx trf-ui2-check
```

Two severities:

- **Wiring errors** (exit 1): tokens.css not imported, an `@source` path that does not resolve,
  the dark variant not wired to `.dark`, `#main` instead of a release tag, no `AGENTS.md`
  pointer. No app should ever be in this state, so this is safe to gate CI on from day one.
- **Drift warnings** (exit 0): the library's source not declared as a Tailwind source, raw
  palette colours, off-scale type or radius, `window.confirm`, raw `<select>` / checkbox /
  `<button className=`, non-Lucide icons, baked arrow glyphs, hand-added `cursor-pointer`,
  inline styles. Add `--strict` to fail on these too, once a repo is clean.

Wire it into the app's own scripts:

```json
"scripts": { "check:ui2": "trf-ui2-check" }
```

In CI, do **not** depend on the app's pinned version. The script imports nothing but Node
builtins, so fetch it from a tag and run it. That works on an app still pinned to an old ui2,
which is most of them.

Write it as a **reusable** workflow. `needs:` only resolves within a single workflow, and
`docker.yml` fires only on `v*` tags, so a standalone file triggered on push would report drift
without ever blocking an image. Declaring `workflow_call` alongside the normal triggers lets the
same file do both jobs:

```yaml
# .github/workflows/check-ui2.yml
name: check-ui2

on:
  workflow_call:          # ← lets the build workflows call it
  push:
    branches: [main, trivis]
  pull_request:

permissions:
  contents: read

jobs:
  check-ui2:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - name: Design system wiring check
        run: |
          set -euo pipefail
          curl -sSfL https://raw.githubusercontent.com/Trivis-AI/trf-ui2/v7.2.8/scripts/check-consumer.mjs -o /tmp/check.mjs
          node /tmp/check.mjs
```

Then call it from each build workflow, so neither a `:prod` nor a `:trivis` image can be built
from drifted code:

```yaml
# docker.yml and trivis-build.yaml
jobs:
  check-ui2:
    uses: ./.github/workflows/check-ui2.yml

  build:
    needs: check-ui2
```

`npm ci` is only needed so the `@source` paths resolve against a real `node_modules`; without it
the check still runs and says so. Add `--strict` once the repo reports clean, in the same commit
that drains it.

Every app in the suite is wired this way as of 2026-08-07. Two are not shaped like the rest:
frontlogin names its production build `docker-trivis.yml`, and trf-app-shell ships no image, so it
takes the standalone form with no `workflow_call` and no `needs:`. See
[18 Drift backlog](18-drift-backlog.md).

## Related

- [README-START-HERE](README-START-HERE.md) · [13 AI Coding Guidelines](13-ai-coding-guidelines.md)
