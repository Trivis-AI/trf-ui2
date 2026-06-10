# Migration Infrastructure

> **Status: ready** · Covers branching strategy, test server, tag pinning, and migration order for
> all 13 remaining `trffront*` apps adopting trf-ui2.

## Branch convention

Every app migration lives on a branch named **`feat/trf-ui2-adoption`** — the same name in every
repo. This lets the test server apply one simple rule:

> For each service, use `feat/trf-ui2-adoption` if it exists, otherwise fall back to `main`.

Tom configures the server-side webhook routing. Do not touch CI workflows — the `docker.yml` in
each repo triggers on `v*` tags only; test-tag routing (`t*`) is handled server-side.

### Branch workflow per app

```
main  ──────────────────────────────────────────►
        \
         feat/trf-ui2-adoption  (all migration commits)
                                                 \── PR → main when done
```

1. Branch from `main`: `git checkout -b feat/trf-ui2-adoption`
2. Do the migration in commits (keep them logical, not one giant commit)
3. Rebase onto `main` before opening the PR to keep history clean
4. Open PR with base `main` — same pattern as `trfinvoices` PR #1

## trf-ui2 tag pinning

Each app pins a specific tag in `package.json`:

```json
"@trf/ui2": "github:triiberg/trf-ui2#v0.6.0"
```

> Always use the latest tag. Check github.com/triiberg/trf-ui2/releases if unsure.

**Rules:**
- Never pin `#main` in an app — tags are immutable, `main` moves
- When trf-ui2 cuts a new tag mid-migration, update all in-progress branches in one pass
- Additive changes only in trf-ui2 while migrations are open — don't break consumers

## Migration order

Start with smaller/simpler apps to validate the process, then tackle complex ones.

| # | App | Complexity | Notes |
|---|-----|-----------|-------|
| 1 | `trffrontlogin` | Low | Auth screens only, minimal components |
| 2 | `trffrontsettings` | Low | Settings forms |
| 3 | `trffrontaudit` | Low | Read-only log views, mostly tables |
| 4 | `trffrontai` | Medium | AI interface, likely custom layouts |
| 5 | `trffrontreports` | Medium | Charts/tables mix |
| 6 | `trffrontcrm` | Medium | Contacts + org management |
| 7 | `trffrontitems` | Medium | Item catalog |
| 8 | `trffrontproducts` | Medium | Product CRUD |
| 9 | `trffronttables` | Medium | Shared table utilities — coordinate with consumers |
| 10 | `trffrontcontracts` | High | Document workflows |
| 11 | `trffrontpayments` | High | Payment + reconciliation flows |
| 12 | `trffrontpurchase` | High | Purchase order workflows |
| 13 | `trffrontledger` | High | Accounting, dimensions, tax — most domain-heavy |

## Per-app checklist

- [ ] Branch `feat/trf-ui2-adoption` created from `main`
- [ ] `@trf/ui2` added to `package.json` (pinned tag)
- [ ] Fonts installed (`@fontsource-variable/geist`, `@fontsource-variable/geist-mono`)
- [ ] `index.css` wired up (tokens import + `@source` directive)
- [ ] `AGENTS.md` added to project root (see `for-consuming-apps.md` for template)
- [ ] All visual components migrated (see `14-migration-guide.md`)
- [ ] `@trf/ui` kept only for `TranslationClient` + `fetchDiscoveryMenu`
- [ ] Light + dark mode verified
- [ ] PR opened with base `main`

## Reference

- `trfinvoices` is the reference implementation (PR #1, branch `feat/trf-ui2-adoption`)
- See `14-migration-guide.md` for the v1 → v2 component mapping
- See `for-consuming-apps.md` for the install steps and `AGENTS.md` template
