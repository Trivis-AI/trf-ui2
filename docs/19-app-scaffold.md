# 19 — App scaffold for a new TRF frontend

> **Status: draft** · Proposed 2026-08-07, not built. Ownership is the open question, see below.

## Why

A new frontend is currently hand-assembled by reading `for-consuming-apps.md`. That worked
fourteen times and failed on the fifteenth. frontsupport shipped 11 green builds with:

- no `AGENTS.md`, so nothing pointed a contributor or an agent at the design system, which is how
  every one of its 39 drift findings got written
- `@source` pointing at `@trf/ui2/dist`, a directory the package does not ship
- no `@custom-variant dark`, which is a real rendering bug: `dark:` compiled against the OS
  preference while the tokens waited on a `.dark` class

None of it errored. `tsc && vite build` passed, CI built an image, and the app looked fine to
whoever was not using a dark OS theme.

`scripts/check-consumer.mjs` now catches all three, but it catches them **after** somebody has
written them. A generator makes them unwritable. That is the difference between fixing an instance
and fixing a class, and it is the only item on the post-frontsupport list that does the latter.

## What it emits

Every file below is one that was wrong, missing, or hand-written in frontsupport:

| File | Why it is in the template |
|---|---|
| `src/index.css` | both imports, the ui2 `@source` glob, `@custom-variant dark`, the body block. The three defects above are all in these five lines. |
| `AGENTS.md` | the `for-consuming-apps.md` §4 pointer, with doc 17 named explicitly. An agent told to read only doc 13 learns the styling rules and none of the layout ones. |
| `vite.config.ts` | `strictPort`, the alias, and the dev proxy **in the conventional literal shape**. See the note below: frontsupport's non-standard shape is invisible to the registry generator. |
| `.env.local.example` | the `VITE_*_BASE_URL` values, since `.env.local` is gitignored and there is no template today |
| `package.json` | `check:ui2` wired, ui2 pinned to the current release tag, never a branch |
| `Dockerfile`, `nginx.conf` | copied from the reference app rather than reinvented |
| `SERVICES.json` entry | so devdash lists the app, and its doctor can repair the app's `.env.local`, from day one |

## Where it lives

A **template repo consumed with `degit`**, not a script inside trf-ui2. A Dockerfile, an nginx
config and CI workflows are not the design system's business, and putting them here would make
ui2 the owner of deployment shape.

## The registry gap it should also close

`documentation/SERVICES.json` holds `dev_proxy_targets: {}` and `env_local: {}` for frontsupport,
though `vite.config.ts` plainly defines a proxy. The generator misses it because frontsupport
assigns the proxy to a `const apiProxy` and spreads it into both `server` and `preview`, rather
than writing a literal `proxy: { ... }` under `server` like its siblings. Consequence: devdash
cannot repair that app's `.env.local`, because the registry has nothing to write.

The template should use the conventional shape so a generated app is legible to the generator.
Fixing `tools/gen-services.sh` to understand both shapes is the alternative, and the larger job.

## Acceptance test

Generate a throwaway app and prove, in order:

1. `npm install` succeeds with ui2 resolving to the pinned tag
2. `npx trf-ui2-check` reports **clean**, zero errors and zero warnings
3. `npm run build` passes
4. `make dash` in `documentation` lists the app with its port and can start it
5. the app renders its shell in both light and dark appearance

If step 2 is not clean on a freshly generated app, the template is wrong.

## Effort and ownership

Roughly half a day, extracting from **frontinvoices** as the reference implementation, plus one
dry run creating and then deleting a throwaway app.

**Open question, needs Tom:** the two workflow files (`docker.yml`, `trivis-build.yaml`) are his,
and a template that omits them leaves a generated app undeployable while a template that includes
them puts CI shape in someone else's repo. Either he owns the template, or it ships with a README
step that says "ask Tom to add the workflows".

## Related

[for-consuming-apps](for-consuming-apps.md) (the manual process this replaces) ·
[18 Drift Backlog](18-drift-backlog.md) (the cost of not having had this) ·
[13 AI Coding Guidelines](13-ai-coding-guidelines.md)
