# Sonner toast rollout — staging (trf.is) deployment plan

> Status: in progress · Started 2026-08-24 · Owner: Jaak
> Prod (trivis.ee) promotion is explicitly out of scope for now; this plan is staging only.

Replace react-hot-toast with @trf/ui2's sonner-based `Toaster`/`toast` (shipped in **v7.6.0**),
one repo at a time. Component doc + migration checklist: `08-ui-components/toaster.md`.

## Survey findings (2026-08-24)

Every remaining app is the same shape, so the swap is mechanical everywhere:

- Exactly **one** react-hot-toast `<Toaster position="top-right" toastOptions={{style:…}}>` in
  `src/main.tsx` per app.
- **All call sites are plain `toast.success/error/…(msg)`** — no `toast.custom`, no
  `toast.loading/dismiss/promise`, no per-call options anywhere. 100% drop-in for sonner.
- Some apps (e.g. frontledger) hardcode dark hex styles on the rht Toaster — broken in light
  theme today; the ui2 Toaster fixes that for free.
- **Deliberate visual change:** ui2 `<Toaster />` renders bottom-right (sonner default);
  react-hot-toast was top-right. frontlogin/frontinvoices already use the default, so
  bottom-right is the new suite standard. (If top-right must stay, pass `position="top-right"`
  — decide once, apply everywhere.)
- The ui2 bump is the real risk, not the toast swap: most apps sit on **v7.2.11**, so
  v7.6.0 brings five releases' worth of changes (7.5.x ServerDataTable work, date-picker
  updates). Typecheck + visual smoke per app is mandatory.

## Repo status

| repo | ui2 pin | rht call-site files | state |
|---|---|---|---|
| frontlogin | v7.6.0 | 0 | migrated in another session, **uncommitted** — that session ships it |
| frontinvoices | v7.6.0 | 0 | migrated in another session, **uncommitted** (+1 unrelated dirty file) — that session ships it |
| frontaudit | v7.6.0 | 2 | **done**, staging v7.0.15 |
| fronttables | v7.2.11 | 3 | wave 1 |
| frontcontracts | v7.2.11 | 6 | wave 1 |
| frontproducts | v7.2.11 | 6 | wave 1 |
| frontsupport | v7.2.11 | 7 | wave 1 |
| frontai | v7.2.11 | 8 | wave 2 |
| frontitems | v7.2.11 | 9 | wave 2 |
| frontpurchase | v7.5.2 | 11 | wave 2 (shortest bump distance) |
| frontreports | v7.2.11 | 12 | wave 2 |
| frontcrm | v7.2.11 | 15 | wave 3 |
| frontpayments | v7.2.11 | 17 | wave 3 (frontend OK to touch; backpayments still off-limits) |
| frontsettings | v7.2.11 | 27 | wave 3 |
| frontledger | v7.2.11 | 33 | wave 3, last (heaviest usage + core accounting app) |

Not in scope: trf-app-shell (no rht; bump to v7.6.0 separately when it next releases),
services / trivisapp / trivislanding (no rht, no ui2 toasts needed).

## Per-repo procedure

1. `git pull` on main; abort if dirty or not on the default branch.
2. `/ui2-bump v7.6.0` (clean reinstall + lockfile SHA check).
3. Swap:
   - `import toast from "react-hot-toast"` → `import { toast } from "@trf/ui2"` (all files).
   - main.tsx: drop the rht `Toaster` import + its `position`/`toastOptions` block; render
     ui2 `<Toaster />` (add to the existing `@trf/ui2` import).
   - `npm uninstall react-hot-toast`.
4. Verify: typecheck/build; `/dev-up` and fire one success + one error toast in light and
   dark (or `/shot`).
5. Commit, patch-bump tag, push main + tag → staging build → verify on the app's `*.trf.is`.
6. Get a go-ahead before the next repo (waves are checkpoints, not batches to blast through).

## Progress log

- 2026-08-24: ui2 v7.6.0 released to staging (Toaster/toast + token bridge). frontlogin,
  frontinvoices migrated in a parallel session (uncommitted there).
- 2026-08-24: **frontaudit done** (tag v7.0.15, verified on audit.trf.is: sonner in the served
  bundle, zero rht traces). Note: only one toast call site there (error on failed log fetch).
