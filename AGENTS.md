# AGENTS.md — @trf/ui2

You are working **inside the TRF design system**. Before writing or changing any UI:

1. Read [`docs/STRUCTURE.json`](docs/STRUCTURE.json) — the manifest. Load **only** the doc you
   need; the docs are small on purpose. Don't load everything.
2. Must-read first: [`docs/13-ai-coding-guidelines.md`](docs/13-ai-coding-guidelines.md).
3. Token source of truth: `src/styles/tokens.css`. Never hardcode colors/radius/fonts.
4. Add every new component to the barrel `src/index.ts` (this repo is consumed as a package).
5. Icons: **Lucide only**. Components work in light **and** dark.
6. Keep it KISS and fast — no extra build steps, no needless dependencies.

Preview your work: `npm run dev` (kitchen-sink demo). Typecheck: `npm run typecheck`.
