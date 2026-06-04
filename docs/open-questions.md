# Open Questions & Future Plans

> **Status: living** — a parking lot for unresolved decisions and future work. File a question
> here instead of guessing. When something is decided, mark it 🟢 and note the decision + where
> it's implemented.

## How to use

- Add an entry: the **question**, **why it matters**, **options/considerations**, **status**.
- Status: 🟡 open · 🟢 decided · ⚪ deferred (parked on purpose)
- Keep entries short; link to the doc/code where a decision lands.

---

## 🟡 Open

### Q1 — Typography: fixed type scale, or loose? — 🟢 DECIDED & BUILT (2026-06-03)

**Outcome:** fixed, **tight weight-driven** scale (Option A), shipped as `H1/H2/H3/Text`.
Scale `xs 12 · sm 14 (body) · base 16 · lg 18 · xl 20 · 2xl 24 · 3xl 30`; headings `font-semibold`
(no 700). **One-knob `--font-scale`** (rem-based, browser-respecting, S/M/L-ready) implemented and
verified. Mono + tabular-nums applied to table numbers. See `08-ui-components/typography.md` and
`03-design-tokens.md`. Original analysis kept below for reference.

**Raised by:** Claude · **Blocks:** `H1/H2/H3`, `Text` components.

- **Option A — fixed scale, few styles, no exceptions** (e.g. H1, H2, H3, body, small, label).
  One weight policy (the reference system used `font-semibold` only — banned `font-bold`/700).
  Pros: consistency, AI-proof, on-system by construction. Cons: less ad-hoc flexibility.
- **Option B — looser set** of Tailwind size utilities with light guidance. Pros: flexible.
  Cons: drift, off-scale sizes creep in.
- **Considerations:** expose sizes as tokens? line-height & letter-spacing policy; weight policy;
  how the apps use `H2` (25×) and `Text` (24×) today.
- **🟢 Decided (Jaak): monospace for tables and numbers** — numeric/table cells get `font-mono`
  + `tabular-nums` (aligned digits). Apply across `Table`, `DataTable`, and numeric `Text`.
- **🟢 Decided (Jaak): one-knob scaling.** All text sizes derive from a single constant
  **`--font-scale`** (default 1), exactly like `--radius` does for corners — change one number,
  every text size scales proportionally.
- **🟢 Decided (Jaak): respect browser font size (accessibility).** All sizes in **`rem`**;
  never hardcode a px root font-size; never use px for type. The user's browser font-size / zoom
  must scale the whole UI. `--font-scale` composes **on top of** the browser setting
  (browser × app scale), it does not replace it. *(Current state already complies — no root px
  is set; guard against regressions.)*
- **🟢 Decided (Jaak): future in-app size setting.** A **bracketed, not freeform** control —
  e.g. **S / M / L** — that just sets `--font-scale` (e.g. S ≈ 0.9375, M = 1, L ≈ 1.0625),
  surfaced in app settings later. Same mechanism, zero new machinery.

- **Benchmark — Claude (measured live on claude.ai + desktop-app screenshot):** font = Anthropic
  Sans; **root 16, body 14** (dominant), **small 12**, with 16/20 for emphasis and a 40px hero
  greeting. The dense app lives almost entirely in a **12–14 band with no big headings** —
  hierarchy is **weight + color** driven, not size. trf-ui2 already matches root/body/small.
- **Candidate direction (to decide):** a **tight, weight-driven scale** suited to the data-dense
  TRF apps — 12 / 14 / 16 carry ~90% of the UI (hierarchy via 400/500/600 weight + muted color),
  with ~20 and a ~32 *display* size reserved for sparse moments (dashboards, empty states, hero).
  Body stays 14, root 16. This is denser than trf-ui2's current 18/24 heading jumps.
- **Implementation (mirror `--radius`):** in `@theme inline`, define `--text-xs … --text-2xl`
  (and their line-heights) as `calc(<rem-base> * var(--font-scale))`; set `--font-scale` on
  `:root`. Then `H1/H2/H3/Text` map to these steps; `PageHeader`/`Dialog` adopt them; table
  numbers get `font-mono` + `tabular-nums`. Add a sink **font-size slider** (like the radius one)
  to prove the one-knob behaviour.

### Q2 — Localization / i18n
**Raised by:** Jaak.

- **Current state:** apps use a `TranslationClient` hitting `services-api.trf.is/v1/translations`
  with `<trn-…>` keys + English fallback. Not yet ported to trf-ui2.
- **Core question:** what is the design system's relationship to i18n?
  - **Option A (recommended):** components stay **i18n-agnostic** — accept `ReactNode` labels/
    children, never hardcode user-facing strings. The app owns translation via `TranslationClient`.
    The DS ships zero copy. KISS, no coupling.
  - **Option B:** DS bakes in translation (provider + keys). More power, more coupling.
- **Sub-questions:** port `TranslationClient` into trf-ui2 (shared) or keep per-app? Any **RTL**
  languages to support? Number/date/**currency** formatting helpers (invoices show €, dates) —
  DS-provided or app-provided? Pluralization. Default-string convention.

### Q3 — Analytics / event tracking
**Raised by:** Jaak.

- **Core question:** should components support analytics, and if so how?
  - **Option A (recommended, KISS):** components emit nothing; apps attach their own handlers.
    DS stays pure.
  - **Option B:** components accept optional instrumentation hooks (an `analytics-id` /
    `onInteraction` prop, or `data-*` passthrough) so key interactions (DataTable sort/filter,
    Dialog open, Button clicks) can be tracked consistently.
  - **Option C:** an `AnalyticsProvider` that auto-instruments DS components.
- **Sub-questions:** which tool (PostHog / Plausible / GA / custom)? A shared event-naming
  taxonomy? Privacy/consent (EU) gating? Does this belong in the DS at all, or only in apps?

---

## ⚪ Also tracked (known-open from earlier)

- **Visual identity / brand:** colors are placeholder tokens in `src/styles/tokens.css` —
  swap when Figma/brand lands.
- **Multi-tenant theming:** one TRF brand vs per-org / white-label theming — affects token
  architecture (one theme vs themeable-per-tenant).

---

## 🟢 Decided (for reference)

- **Foundation:** shadcn-style — owned Radix + Tailwind v4 + CVA, CSS-variable tokens.
- **Distribution:** raw `.tsx` via `github:triiberg/trf-ui2#main`, no build step.
- **Icons:** Lucide only (see `05-iconography.md`).
- **Fonts:** **Geist** (UI) + **Geist Mono** (tables/numbers), self-hosted via
  `@fontsource-variable/geist[-mono]`. Set in `src/styles/tokens.css`; loading documented in
  `for-consuming-apps.md`. (Type *scale* still open — Q1.)
- **Tables:** TanStack (owned) over AG Grid; AG Grid reserved for any future Excel-grade grid
  (see `08-ui-components/table.md`).

## Related

- [STRUCTURE.json](STRUCTURE.json) · [README-START-HERE](README-START-HERE.md)
