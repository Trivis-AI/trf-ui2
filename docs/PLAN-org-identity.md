# PLAN: company colour + tag on the org avatar

> Task 178. Status: **steps 1 to 4 done on trf.is**. backlogin v7.5.0, ui2 v7.8.2, app-shell
> v0.38.0, frontinvoices v7.8.1 and frontlogin v7.0.41. Marking works from the company list, and
> the duplicate Telia Eesti AS pair on staging is marked and readable. Remaining: the 13-front
> sweep (step 5), then prod, and the new `<trn-...>` keys still fall back to English until they
> are added to the translation service.

## The problem

17 companies were migrated from Merit, and one of them was copied again, so the historical data
and the live sales/purchases sit in two different tenants **with the same company name**. The org
switcher shows pairs of identical rows and nothing in either says which is which.

Colour alone does not solve it: it says "these two rows differ", not which is the archive. That
would mean memorising a hue per company across 17 pairs. So the colour (fast visual scan) and a
short text tag (`ARHIIV`, `MERIT`, `2024`) ship together, and the tag is the part that answers
the question.

## The safety property: why this reaches only the intended tenants

The whole design hangs on one thing: **both fields default to empty, and empty means "behave
exactly as before".**

| Layer | With the field unset | Therefore |
|---|---|---|
| DB | `color`/`tag` are `NOT NULL DEFAULT ''` on every existing row | no backfill, no data migration |
| `Avatar` | `asAvatarColor("")` → `undefined` → `hueFor(slug)` | pixel-identical to today |
| `OrgSwitcher` | `tag` falsy → the `Badge` is **not rendered** | no empty box, no layout shift |
| Search | value becomes `name slug ` (trailing space) | matches exactly what it matched before |
| Old consumers | two unknown JSON keys on a DTO they already ignore | nothing to break |

`AVATAR_COLORS` was built so that its hue order reproduces the previous `HUES` array element for
element (`red 4, orange 25, amber 45, lime 95, green 150, teal 175, cyan 200, blue 220, indigo
260, purple 290, pink 330`). The hash therefore returns the same colour for every existing org.
Reordering that array or adding a twelfth colour would repaint the whole fleet, so it is commented
as load-bearing in both the source and the doc.

Consequence for the rollout: **steps 1–3 below are user-visible no-ops.** The first pixel changes
anywhere only when a human marks an org on the frontlogin page in step 4, one company at a time,
and only for that company. There is no moment where "everyone gets colours".

The second reading of "other clients", the other consumer apps, is covered by the pin model:
consumers pin `github:Trivis-AI/trf-ui2#vX.Y.Z`, so cutting v7.7.0 changes nothing anywhere until
each repo bumps deliberately. A front still on the old pin next to one on the new pin is a
degradation (no marks), never a break.

## Already built (local, unreleased) in trf-ui2

- `Avatar` gains `color`. Precedence: `color` → `hueFor(colorKey)` → unchanged. **Unknown values
  are ignored, not rendered**: `asAvatarColor` narrows an untrusted API string to one of the
  eleven or to `undefined`, so a bad row degrades to the hash instead of emitting
  `hsl(undefined …)` on a production screen.
- `AVATAR_COLORS`, `AvatarColor`, `AvatarColorInput`, `asAvatarColor` exported from the barrel, so
  consumers never redefine the list.
- `AvatarColorPicker`: eleven swatches plus a leading *automatic* swatch (a `Shuffle` glyph, so
  it is not mistaken for the hue it happens to be showing) that clears the choice. Each swatch is
  the real `Avatar` in that colour.
- `OrgSwitcherOrg` gains `color` + `tag`; the search value becomes `${name} ${slug} ${tag}`, so
  typing `arhiiv` filters to the migrated set.
- `OrgTag` is the pill, filled in the org's own hue rather than stroked (an outline pill is too
  quiet to catch the eye on a scan of 17 rows, and matching the circle makes the pair read as one
  mark). Exported so the shell brand block and the post-login list render the same pill.
- `OrgSwitcher` gains `orgHref`: supply it and every row gets an open-in-a-new-tab link, so the
  archive can be opened beside the live company instead of switching away from it. It is a real
  anchor, and it stops its click reaching the row so the link never also switches the current tab.
- `Badge` gains `size="sm"` (default unchanged), because the tag has to ride a 20px row without pushing
  the company name out.
- Demo section **Org colour + tag** in the kitchen sink: the duplicate-name problem with a
  marks on/off switch, the switcher, the sidebar brand, the post-login card grid, a live picker,
  and a tag-length ruler at 4/6/8/12 characters.
- Docs updated: `08-ui-components/avatar.md`, `org-switcher.md`, `badge.md`, `STRUCTURE.json`.

## Rollout

### 1. backlogin, alone, all the way to trivis.ee. DONE on staging (v7.5.0)

Shipped as described below, gated on `hasMembership`, which already existed with exactly the
right semantics. Validation lives in `normalizeAvatarColor` and `normalizeOrgTag`, unit tested
without a database, and one of those tests asserts the Go palette matches `AVATAR_COLORS` name
for name and in order, since a drift there would silently repaint every unmarked organization.
Swagger was left alone: the committed spec is already several endpoints stale and `swag` is not
installed here.

The API must return the fields before any frontend asks for them.

- `Color` and `Tag` (`varchar`, `not null;default:''`) on `models.Organization`, plus the same two
  on `OrganizationDto` and `OrganizationWithTokenDto`. `CopyStruct` propagates them for free.
- **No migrate run needed.** backlogin owns its own schema: `repo.go:168` `AutoMigrate`s
  `Organization` at boot, unlike the 11 tenant services where `AutoMigrate` sits inside `Migrate()`
  behind `POST /v1/migrate`.
- New endpoint `PUT /v1/organization/:organizationId/appearance`, registered next to the other org
  routes in `cmd/main.go:327-351`.
- **Use `*string` for both fields in the appearance DTO**, not the `if data.X != ""` idiom used by
  `UpdateOrganizationFromSettings`. That idiom cannot express "clear it", so with it there would
  be no way back to automatic once a colour is set. Pointer semantics: key omitted → leave alone;
  `""` → clear.
- **Validate server-side**: `color` must be one of the eleven names or empty (reject anything
  else. This is what keeps a free-picked hex, which would be unreadable in dark mode, out of the
  database); `tag` trimmed, rejected over 8 characters.
- Both write paths are already safe for the new columns: `UpdateOrganization` and
  `UpdateOrganizationFromSettings` both `Find` the row before the full-row `Save`, so neither
  blanks a colour set elsewhere. Adding `Color`/`Tag` to `UpdateOrgFromSettingsDto` for the
  backsettings sync path keeps the `!= ""` guard, so that path can set but never clear, which is correct
  for a one-way sync.
- Tests beside `TestChangePassword`, same `TEST_DB_DSN` pattern.

**Verify on staging before moving on:** `GET /v1/organization?tokens=false` returns `"color":""`
and `"tag":""` on every org, and every existing screen is unchanged.

### 2. trf-ui2. DONE, at v7.8.2 after three rounds of visual feedback

Cut the tag via `/ui2-release` (it checks package.json and the tag agree). Nothing changes for any
consumer until it bumps.

### 3. trf-app-shell. DONE (v0.38.0), and frontinvoices v7.8.1 is on trf.is with it

- Bump the ui2 pin to v7.7.0.
- `OrgOption` (`src/AppShellLayout.tsx:71`) gains `color`/`tag`.
- The mapper at `:830` currently drops everything but `id/name/slug`. Stop dropping them.
- Pass them to `Avatar` at `:321` (sidebar brand) and `:437` (mobile bar), and through both
  `OrgSwitcher` call sites (`:357` desktop, `:443` mobile). Render `OrgTag` next to the org name in
  the brand block and the mobile bar.
- Pass `orgHref={(org) => `/app/${org.slug}/`}` (the shell already knows the route shape) so the
  dropdown rows get their open-in-a-new-tab link.

Still invisible in production at this point: every value is `""`.

### 4. frontlogin, the marking surface. DONE (v7.0.41)

Built as a dialog behind a palette button per card rather than a swatch row on every card:
seventeen rows of eleven swatches is noise on the one screen that has to stay scannable. Clear
is one click, since a colour set by mistake is otherwise unfixable from there. The cards and the
current-company heading render the mark, so the result shows where it was set.

`src/pages/organization/ListOrganization.tsx:365` already renders a 40px `Avatar` per org on the
post-login landing page: all 17 companies on one screen. Add `AvatarColorPicker` + an 8-character
tag input per card, wired to the new endpoint. This is where the manual pass happens, and the
first place anything becomes visible.

Do this one company first, confirm it in the switcher of an already-bumped app, then the rest.

### 5. The sweep

frontai, frontaudit, frontcontracts, frontcrm, frontinvoices, frontitems, frontledger,
frontpayments, frontproducts, frontpurchase, frontreports, frontsettings, fronttables. Bump both
pins via `/rollout` + `/ui2-bump`, ship the first two or three, watch trf.is, then the rest.

**frontsupport is not in the list**: it consumes ui2 but has no `@trf/app-shell` dependency at
all, so it has no switcher and nothing to gain. Leave it on its pin.

## Decisions taken here that differ from the task notes

1. **The picker is a ui2 component, not frontlogin code.** Design doctrine: net-new visual
   components get built in ui2 and added to the kitchen sink, never hand-rolled per app. It also
   makes reuse from settings free later.
2. **`OrgTag` is its own component**, not a `Badge` with classes at three call sites. It resolves
   the hue, which is logic, not styling, and the shell, the switcher and the login list must not
   drift apart.
3. **Pointer fields on the appearance DTO**, so "back to automatic" is expressible (see step 1).
4. **Runtime narrowing of `color`** (`asAvatarColor`), so a bad or future value can never break a
   render. Worth having when the value comes from a database column that humans can edit.

## Open questions for Tomm

1. **Is 8 characters enough for the tag?** The ruler in the demo answers this visually: `ARHIIV`
   (6) and `MERIT 24` (8) leave the company name readable in a 20px row; `AJALUGU 2024` (12)
   truncates it to `Initium Novu…`. Recommendation: cap at 8, enforced both in the input
   (`maxLength`) and server-side.
2. **Member-gated appearance endpoint?** Recommend **yes**, member not owner: owner-gating would
   stop Tomm marking Rein's copy, which is the single org that most needs marking. The blast
   radius stays small because the endpoint writes only these two columns and validates both, so a
   member cannot touch the name, reg code, or anything that rides in the JWT or onto a document.
   It is still a shared-state write by a non-owner, and that is the trade being accepted.

## Traps

- **The ui2 pin trap.** Editing `package.json` and running `npm install` leaves the lockfile on the
  old SHA with the old source in `node_modules`. Use `npm install "github:Trivis-AI/trf-ui2#v7.7.0"
  --save`, then prove it: the resolved SHA moved in `package-lock.json` **and** `AVATAR_COLORS`
  exists in the installed source. A green typecheck proves nothing, because the old tree typechecks fine.
- **The fronts have drifted.** frontinvoices is on app-shell v0.37.0 / ui2 v7.6.5; the other 13 are
  on v0.36.0 / v7.6.4. The sweep drags 13 repos across an app-shell minor they have not had, so
  the change under test is bigger than this task. Ship two or three and look before the rest.
- The task notes mention `tr-k8s/tools/update-all-fronts.sh` being dead (globs `trffront*`, which
  matches nothing since the rename). **Not verified here**: tr-k8s is not checked out on this
  machine. The `/rollout` and `/ui2-bump` skills are the working path either way.
- No `kubectl` on Tomm's machine, so there is no bulk-SQL shortcut for setting 17 colours. It goes
  through the UI, which is why the picker belongs on the list page.

## Rejected

Renaming the migrated orgs in backlogin's DB only. Zero deploys, but the org name rides in the JWT
as claim `n` and not every consumer was traced, so it is too likely to surface `Acme OÜ (arhiiv)` on an
invoice.
