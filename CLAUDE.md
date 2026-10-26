# trf-ui2 — working & deploy guide

For UI/design-system rules see [AGENTS.md](AGENTS.md). This file covers **branches,
releasing, and deployment** — read it before pushing anything.

## First thing when you return to this repo

The repo was switched onto `main` during the trivis→main cutover (2026-06-30).
Your local clone is likely behind. **Always start with:**

```bash
git fetch --all --tags
git checkout main
git pull
```

`main` was fast-forwarded to the latest stable content, plus two CI commits, and a
`v7.0.0` tag was pushed.

## Environments & deploy model

| Branch / action            | Builds image | Auto-deploys to        | Role     |
|----------------------------|--------------|------------------------|----------|
| tag `v*` on `main`         | `:prod`      | `ui.trf.is`            | staging  |
| push `trivis` branch       | `:trivis`    | `ui.trivis.ee`         | prod     |

So the flow is: **develop in a task worktree and land on `main` → tag to test on staging →
promote to prod by fast-forwarding `trivis`.** Rules: `../documentation/PARALLEL-WORK.md`.

### To test a change on staging (trf.is)

```bash
# from the worktree (or main), with the work committed:
git fetch origin && git rebase origin/main
git push origin HEAD:main
git tag v7.0.1            # bump from the latest v* tag
git push origin v7.0.1
```

This triggers `.github/workflows/docker.yml`:
build `:prod` → push to ghcr → POST to `webhook.pukser.ee` → rolling restart of
`deploy/trf-ui2` in namespace `trf-ui2`. Watch it:

```bash
gh run list --workflow docker.yml -L 3
kubectl rollout status deploy/trf-ui2 -n trf-ui2
```

Live at https://ui.trf.is.

### To promote to prod (trivis.ee)

Once staging looks good, move `trivis` to `main` and push it, from any checkout, no branch switching:

```bash
git fetch origin
git push origin origin/main:trivis    # fast-forward
```

If that is rejected, `trivis` has commits that are not on `main`: merge in a throwaway worktree
(`../documentation/PARALLEL-WORK.md`, rule 5), taking main's versions of the workflow files (see caveat).

This triggers `.github/workflows/trivis-build.yaml` → `:trivis` → `webhook.trivis.ee`
→ `ui.trivis.ee`.

## Repo wiring (set up 2026-06-30)

- `.github/workflows/docker.yml` — **new**; the tag→`:prod`→staging path.
- `.github/workflows/trivis-build.yaml` — trigger fixed from `main` to `trivis`.
- Repo secrets: `WEBHOOK_URL=https://webhook.pukser.ee` (staging),
  `TRIVIS_WH_URL` (prod), `WEBHOOK_SECRET` (HMAC, shared).
- The Dockerfile takes **no build args** (static build; no `VITE_API_BASE_URL`).

## ⚠️ Caveat for the first `main → trivis` merge

The `trivis` branch still has the **old** `trivis-build.yaml` (it triggered on `main`).
When you first merge `main → trivis`, take **main's** version of both workflow files so
the fix lands on `trivis`:

```bash
git checkout main -- .github/workflows/docker.yml .github/workflows/trivis-build.yaml
```

## k8s manifests

Live in the `tr-k8s` repo, not here: `tr-k8s/trf-is/trf-ui2/` (staging) and
`tr-k8s/trivis/trf-ui2/` (prod). The webhook only does a rolling restart — if you change
env/resources/ingress, `kubectl apply` those manifests manually.
