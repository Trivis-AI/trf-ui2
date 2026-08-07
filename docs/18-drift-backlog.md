# 18 — Drift backlog across the consuming apps

> **Status: draft** · Numbers measured 2026-08-07. Regenerate before acting on them.

`scripts/check-consumer.mjs` reports two severities. Wiring errors are at **zero across the whole
suite** and should stay there. This doc is about the other half: 110 drift findings in 13 repos.

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

## Where it stood on 2026-08-07

| repo | findings |
|---|---|
| frontlogin | palette 8, glyphs 7, inline-style 4, confirm 3, buttons 2 |
| frontpayments | glyphs 8, cursor 5, inline-style 2, buttons 1 |
| frontledger | cursor 8, palette 5, glyphs 3, confirm 1 |
| frontai | palette 6, buttons 2, cursor 1, glyphs 1, inline-style 1 |
| frontcrm | buttons 5, cursor 3, glyphs 2 |
| frontaudit | palette 4, glyphs 2 |
| fronttables | palette 4, cursor 1 |
| frontcontracts | cursor 5 |
| frontreports | confirm 3, buttons 1 |
| frontpurchase | cursor 2, glyphs 1 |
| frontinvoices | confirm 1, buttons 1, inline-style 1 |
| frontproducts | glyphs 1 |
| trf-app-shell | buttons 5 |
| frontitems, frontsettings, frontsupport | clean |

## Sequence

**0. Gate first.** Wire the CI check into each app before draining anything, using the
tag-pinned recipe in `for-consuming-apps.md` §5. Otherwise the backlog refills behind you. This
step is worth more than any of the tranches below.

**1. Tranche A: `cursor-pointer`, about 25 findings.** Pure deletion. `tokens.css` already gives
every interactive element a pointer cursor, so removing the class changes nothing visually and
carries no decision. Safe as one cross-repo pass. Exception: draggable handles legitimately set
`cursor-grab`, so read the element before deleting.

**2. Tranche B: `window.confirm`, 7 findings in 4 repos.** Mechanical swap to `useConfirm`, but
every one of them guards something destructive, so each site needs a click test that the dialog
opens, cancel resolves, and no native dialog fires. Not blind work.

**3. Tranche C: palette, glyphs, styled buttons, inline styles, about 78 findings.** These change
how the app looks, so they are not a sweep. They belong to whoever owns that app's surface and
should ride along with other work in the same files. When a repo reaches zero, move it to
`--strict` in CI so it cannot regress.

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

Every repo reports clean, and every repo runs `--strict` in CI. frontsupport is already there and
is the natural first `--strict` adopter.

## Related

[for-consuming-apps](for-consuming-apps.md) §5 (the checker and the CI recipe) ·
[13 AI Coding Guidelines](13-ai-coding-guidelines.md) ·
[19 App Scaffold](19-app-scaffold.md) (stops new apps joining this list)
