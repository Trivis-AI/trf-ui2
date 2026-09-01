# OrgSwitcher

> **Status: ready** · `import { OrgSwitcher } from "@trf/ui2"` · source: `src/components/org-switcher.tsx`

Organisation switcher for users who belong to many orgs: a popover listing all organisations with
the active one checked, plus type-to-filter search once the list grows past `searchThreshold`.
Keyboard navigation (arrows + Enter) comes from `cmdk`.

The trigger is consumer-supplied, so the app shell can keep using its brand block or breadcrumb as
the click target. Presentational: the consumer owns fetching and what a pick means.

## Usage

```tsx
import { OrgSwitcher } from "@trf/ui2";

<OrgSwitcher
  orgs={orgs}
  currentSlug={slug}
  loading={isLoading}
  onOpen={() => fetchOrgs()}          // lazy: only load the list when opened
  onSelect={(org) => navigate(`/app/${org.slug}`)}
>
  <button className="...">{currentOrg.name}</button>
</OrgSwitcher>
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `orgs` | `OrgSwitcherOrg[]` | `{ id, name, slug, color?, tag? }`. **Include the current one.** |
| `currentSlug` | `string \| null` | Slug of the active org; gets a check mark. Picking it is a no-op. |
| `onSelect` | `(org) => void` | Fires when a *different* org is picked. The popover closes itself. |
| `onOpen` | `() => void` | Fires when the popover opens. Hook for lazily fetching the org list. |
| `loading` | `boolean` | Shows a loading row instead of "no results" while the list is being fetched. |
| `searchThreshold` | `number` | Show the search input only at or above this many orgs. Default `8`. |
| `searchPlaceholder` / `emptyText` / `loadingText` | `string` | Copy overrides. |
| `align` / `side` | | Popover placement relative to the trigger. Default `"start"` / `"bottom"`. |
| `className` | `string` | Extra classes for the popover panel, e.g. a custom width. |
| `children` | `ReactNode` | The trigger, rendered as-is via `asChild`. |

Each row renders an [`Avatar`](avatar.md) keyed on the org slug, so the colour survives renames.

## Telling two organisations with the same name apart

A tenant migrated from another system and its live copy carry the same company name, so the list
shows pairs of rows that differ in nothing a human can read. `color` and `tag` on the org fix that
and are meant to be used **together**: the colour is the fast visual scan, the tag is what actually
answers *which one is this*. Colour alone would mean memorising a hue per company.

```tsx
{ id, name: "Initium Novum OÜ", slug: "initium-novum-ou", color: "amber", tag: "ARHIIV" }
```

| Field | Type | Notes |
|---|---|---|
| `color` | `AvatarColor \| string \| null` | Passed to the row's `Avatar`. Unset keeps the colour hashed from the slug. |
| `tag` | `string \| null` | Short mark after the name, rendered as an uppercase outline `Badge`. Keep it to ~8 characters: it shares a 20px row with the company name. |

Both are optional and both default to unset, which renders exactly as it did before they existed,
so a deployment where nothing is tagged is visually a no-op. The tag also joins the search value,
so typing `arhiiv` filters the list to the marked set.

Search is a plain case-insensitive substring match rather than cmdk's fuzzy default, which is
predictable for company names. The panel width follows the longest org name up to a cap, and its
height follows the org count up to the space available below the trigger, so a 20+ org list uses
the viewport instead of `CommandList`'s 18rem cap.

## Rules

- The trigger must be a single focusable element (`asChild` clones onto it).
- Fetch on `onOpen`, not on mount, when the org list is large or not already in the shell's state.
- Do not use `tag` as a general label slot. It is a disambiguator; a row with a tag on every org
  is noise, and the badge competes with the name for the same 20px row.

## Related

- [Avatar](avatar.md) · [AppShell & Sidebar](sidebar.md) · [Combobox (Popover + Command)](combobox.md)
