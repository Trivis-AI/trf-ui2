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

### Q1 — Typography: fixed type scale, or loose?
**Raised by:** Claude · **Blocks:** `H1/H2/H3`, `Text` components.

- **Option A — fixed scale, few styles, no exceptions** (e.g. H1, H2, H3, body, small, label).
  One weight policy (the reference system used `font-semibold` only — banned `font-bold`/700).
  Pros: consistency, AI-proof, on-system by construction. Cons: less ad-hoc flexibility.
- **Option B — looser set** of Tailwind size utilities with light guidance. Pros: flexible.
  Cons: drift, off-scale sizes creep in.
- **Considerations:** expose sizes as tokens? line-height & letter-spacing policy; weight policy;
  mono font for table numbers; how the apps use `H2` (25×) and `Text` (24×) today.

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

- **Visual identity / brand:** colors + font are placeholder tokens in `src/styles/tokens.css` —
  swap when Figma/brand lands.
- **Font choice:** system stack for now; pick a real typeface (ties into Q1).
- **Multi-tenant theming:** one TRF brand vs per-org / white-label theming — affects token
  architecture (one theme vs themeable-per-tenant).

---

## 🟢 Decided (for reference)

- **Foundation:** shadcn-style — owned Radix + Tailwind v4 + CVA, CSS-variable tokens.
- **Distribution:** raw `.tsx` via `github:triiberg/trf-ui2#main`, no build step.
- **Icons:** Lucide only (see `05-iconography.md`).
- **Tables:** TanStack (owned) over AG Grid; AG Grid reserved for any future Excel-grade grid
  (see `08-ui-components/table.md`).

## Related

- [STRUCTURE.json](STRUCTURE.json) · [README-START-HERE](README-START-HERE.md)
