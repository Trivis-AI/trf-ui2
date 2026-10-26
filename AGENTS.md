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

## Working in parallel (adopted 2026-10-20)
Feature work happens in a task worktree, not in this primary checkout: `claude -w t<task>-<slug>` or
`../documentation/tools/wt.sh new <repo> <name>`. Land from the worktree: `git fetch origin && git rebase
origin/main && <build> && git push origin HEAD:main`, tag from there, prod via `git push origin
origin/main:trivis`. Never force-push main or trivis. Rules and setup: `../documentation/PARALLEL-WORK.md`.
