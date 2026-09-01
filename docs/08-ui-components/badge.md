# Badge

> **Status: ready** · `import { Badge } from "@trf/ui2"` · source: `src/components/ui/badge.tsx`

A small solid label — counts, tags, generic labels. For document **status**, use `StatusBadge`.

## Usage

```tsx
<Badge>Default</Badge>
<Badge variant="success">Paid</Badge>
<Badge variant="outline">Draft</Badge>
<Badge asChild><a href="/tag/vip">VIP</a></Badge>   {/* polymorphic */}
```

`variant`: `default | secondary | success | warning | destructive | outline`.

`size`: `default | sm`. `sm` is the tight one: it exists so a badge can ride along a 20px list
row (the org tag in [OrgSwitcher](org-switcher.md)) without pushing the text out. Everything else
stays on `default`.
`asChild` renders the badge as a link/router `Link` (merges styles onto the child).

## Rules

- `Badge` = generic solid label/count; **`StatusBadge`** = soft state pill with a dot for
  document statuses. Don't recolor a Badge by hand — use a variant.

## Related

- [StatusBadge](status-badge.md) · [13 AI Coding Guidelines](../13-ai-coding-guidelines.md)
