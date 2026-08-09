# 18 — Drift backlog across the consuming apps

> **Status: step 0 done, tranches open** · Numbers re-measured 2026-08-07. Regenerate before
> acting on them.

`scripts/check-consumer.mjs` reports two severities. Wiring errors are at **zero across the whole
suite**, and CI now keeps them there in all 16 repos. This doc is about the other half: 118 drift
findings in 13 repos.

It exists because the temptation with a fresh linter is a single cross-repo sweep, and most of
these findings should not be swept. Roughly three quarters carry a visual decision that belongs
to whoever owns that app's look.

## Regenerate the numbers first

```bash
cd ~/Coding
for d in front* trf-app-shell; do
  [ -f "$d/package.json" ] || continue
  printf '%-16s %s\n' "$d" "$(node trf-ui2/scripts/check-consumer.mjs "$d" 2>/dev/null | grep -E '^Summary:|^Clean')"
done
```

**Count from the `Summary:` line, not by counting the file paths.** The report truncates a rule's
file list at eight entries and appends `… and N more`. An earlier revision of the table below was
transcribed from the visible paths and so undercounted frontlogin and frontpayments by 8 between
them, which then read as the backlog having grown when it was re-measured. It had not.

## Where it stands, 2026-08-07

| repo | findings | |
|---|---|---|
| frontlogin | 31 | palette 15, glyphs 7, inline-style 4, confirm 3, buttons 2 |
| frontpayments | 17 | glyphs 10, cursor 4, inline-style 2, buttons 1 |
| frontledger | 17 | cursor 8, palette 5, glyphs 3, confirm 1 |
| frontai | 11 | palette 6, buttons 2, cursor 1, glyphs 1, inline-style 1 |
| frontcrm | 10 | buttons 5, cursor 3, glyphs 2 |
| frontaudit | 6 | palette 4, glyphs 2 |
| fronttables | 5 | palette 4, cursor 1 |
| frontcontracts | 5 | cursor 5 |
| trf-app-shell | 5 | buttons 5 |
| frontreports | 4 | confirm 3, buttons 1 |
| frontpurchase | 3 | cursor 2, glyphs 1 |
| frontinvoices | 3 | confirm 1, buttons 1, inline-style 1 |
| frontproducts | 1 | glyphs 1 |
| frontitems, frontsettings, frontsupport | 0 | clean |

By rule: palette 34, glyphs 27, cursor 24, buttons 17, confirm 8, inline-style 8. Total 118.

## Sequence

**0. Gate first. Done, 2026-08-07.** All 16 repos now run `check-ui2`. See
[Step 0, as built](#step-0-as-built) below for what shipped and the two things the §5 recipe does
not tell you.

**1. Tranche A: `cursor-pointer`, 24 findings in 7 repos.** Pure deletion. `tokens.css` already gives
every interactive element a pointer cursor, so removing the class changes nothing visually and
carries no decision. Safe as one cross-repo pass. Exception: draggable handles legitimately set
`cursor-grab`, so read the element before deleting.

**2. Tranche B: `window.confirm`, 8 findings in 4 repos.** Mechanical swap to `useConfirm`, but
every one of them guards something destructive, so each site needs a click test that the dialog
opens, cancel resolves, and no native dialog fires. Not blind work.

**3. Tranche C: palette, glyphs, styled buttons, inline styles, 86 findings.** These change
how the app looks, so they are not a sweep. They belong to whoever owns that app's surface and
should ride along with other work in the same files. When a repo reaches zero, move it to
`--strict` in CI so it cannot regress.

## Step 0, as built

Every repo gets `.github/workflows/check-ui2.yml` and a `check:ui2` npm script. Two tiers:

- **`--strict`** in the three repos already at zero (frontitems, frontsettings, frontsupport), so
  they cannot regress.
- **warning-only** in the other 13. A repo with 31 findings cannot adopt `--strict` without being
  permanently red, so the check gates wiring errors at zero and reports drift without failing.
  Each repo flips to `--strict` in the same commit that drains it.

**The §5 recipe is not enough on its own, for two reasons.**

First, **a standalone workflow file does not gate anything.** `needs:` only resolves within a
single workflow, and `docker.yml` fires only on `v*` tags, so a separate `check-ui2.yml` triggered
on push would never block an image. The working shape is the one bankhub already uses for
`test.yml`: a reusable workflow that declares `workflow_call` alongside its own `push` and
`pull_request` triggers, and is then called by each build workflow.

```yaml
# check-ui2.yml
on:
  workflow_call:          # ← the part §5 leaves out
  push:
    branches: [main, trivis]
  pull_request:
```

```yaml
# docker.yml and trivis-build.yaml
jobs:
  check-ui2:
    uses: ./.github/workflows/check-ui2.yml
  build:
    needs: check-ui2
```

Second, **two repos are not shaped like the others.** frontlogin names its production build
`docker-trivis.yml`, not `trivis-build.yaml`. trf-app-shell had no `.github/workflows` at all and
ships no image, so it gets the standalone form with no `workflow_call` and no `needs:` wiring; the
pull request is the only place to catch drift before it reaches every app importing it.

Worth knowing:

- The tag-pinned `curl` works unauthenticated because trf-ui2 is a public repo. If it ever goes
  private, every one of these workflows breaks at once and needs a token.
- `npm ci` is the slow step. A whole run is about 18 seconds.
- Verify a gate in both directions before trusting it. Inject one `cursor-pointer` into a clean
  checkout and confirm `--strict` exits 1 and bare exits 0. A gate that cannot fail looks
  identical to a gate that passes.
- `actionlint` catches a malformed workflow, which otherwise fails silently by simply not running.
  The pre-existing shellcheck notes in `release-notify.yml` and `trivis-notify.yml` are unrelated.
- Rewriting `package.json` through `JSON.stringify` reformats the whole file in frontitems and
  frontledger, which indent with four spaces rather than two. Detect the existing indent.

## Worked example

frontsupport went from 5 wiring errors and 39 drift warnings to clean in one pass (commit
`8997bff`). What that cost, for estimating the others:

- about an hour of edits across 14 files
- a stubbed API route file, so every screen renders with data
- nine before-and-after screenshots at 1:1, because badge tone and size changes are invisible in
  a diff
- a 13-check puppeteer smoke test, because the swaps move state plumbing from `e.target.value` to
  `onChange(v)` and `onCheckedChange`
- a sign-off round with the app's owner on four visual decisions the linter cannot make

The last two items are the ones people skip. A green linter says nothing about whether a Radix
select still updates your query string.

## Done means

Every repo reports clean, and every repo runs `--strict` in CI. Three of sixteen are there
(frontitems, frontsettings, frontsupport). The remaining thirteen each need their findings drained
and `--strict` added in the same commit.

## Related

[for-consuming-apps](for-consuming-apps.md) §5 (the checker and the CI recipe) ·
[13 AI Coding Guidelines](13-ai-coding-guidelines.md) ·
[19 App Scaffold](19-app-scaffold.md) (stops new apps joining this list)
