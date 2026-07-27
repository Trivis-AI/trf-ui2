# Collapsible

> **Status: ready** · `import { Collapsible } from "@trf/ui2"` · source: `src/components/ui/collapsible.tsx`

A disclosure section: a chevron + label trigger over content that expands and collapses smoothly.
Works controlled or uncontrolled.

Despite living under `ui/`, this is a single self-contained component, not a Radix trigger/content
trio. Pass the label as a prop, the content as children.

## Usage

```tsx
// Uncontrolled
<Collapsible label="Advanced options">
  <Field label="Reference" htmlFor="ref"><Input id="ref" /></Field>
</Collapsible>

// Controlled, tinted while open
<Collapsible
  label={<><Filter /> Filters</>}
  open={showFilters}
  onOpenChange={setShowFilters}
  tintWhenOpen
  contentClassName="space-y-3"
>
  <TableFilterBar>…</TableFilterBar>
</Collapsible>
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `label` | `ReactNode` | The trigger label. The chevron is supplied; do not add one. |
| `open` | `boolean` | Controlled state. Omit to let the component own it. |
| `defaultOpen` | `boolean` | Initial state when uncontrolled. Default `false`. |
| `onOpenChange` | `(open: boolean) => void` | Fires in both modes. |
| `tintWhenOpen` | `boolean` | Tint the block while open, setting the expanded content apart from the page. Padding is constant in both states so the header does not shift when the section opens. |
| `className` | `string` | Outer block. |
| `contentClassName` | `string` | Content wrapper, e.g. padding or `Stack`-style spacing. |
| `children` | `ReactNode` | The content. |

## Behaviour worth knowing

- The height animation uses the CSS grid `0fr → 1fr` technique rather than measuring in JS, so it
  stays smooth for content of any height and needs no `ResizeObserver`.
- **Content stays mounted** while collapsed (hidden via `overflow-hidden` + `invisible`), so form
  state inside survives a collapse. Do not rely on unmount to reset a nested form, and do not put
  anything expensive or self-fetching inside a section that is usually closed.
- The trigger carries `aria-expanded` and `aria-controls`; the animation respects
  `prefers-reduced-motion`.

## Related

- [Layout & Page](layout.md) · [Cards](cards.md) · [Tabs](tabs.md)
