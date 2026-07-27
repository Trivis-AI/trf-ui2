# Avatar

> **Status: ready** · `import { Avatar } from "@trf/ui2"` · source: `src/components/avatar.tsx`

A round, bordered badge showing the first letter of a name (an organisation, a user, a contact).
The background colour is derived deterministically from a key, so the same entity always gets the
same colour everywhere, with nothing stored.

> **Not the same as `AvatarCell`.** `AvatarCell` is a table cell renderer in
> [server-data-table.md](server-data-table.md). This is the standalone primitive.

## Usage

```tsx
<Avatar name={org.name} colorKey={org.slug} size={20} />
<Avatar name={user.fullName} colorKey={user.id} />
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `name` | `string \| null` | The initial is taken from the first character. Falls back to `?`. |
| `colorKey` | `string \| null` | Stable key for the colour. Defaults to `name`. |
| `size` | `number` | Diameter in px. Default `28`. Font size scales with it. |
| `className` | `string` | |

## Rules

- **Pass a `colorKey` that is not the name** (org slug, user id) wherever the name can change. On
  the default, a rename recolours the entity.
- Colour comes from a fixed spread of 11 hues hashed from the key, at a lightness that stays
  legible with white text in both themes. The border darkens in light mode and lightens in dark,
  so the circle stays defined either way.
- It renders `aria-hidden`: it is decoration next to a visible name, never the only label. If it
  ever stands alone, put the name in adjacent text or an `aria-label` on the wrapper.
- No image support by design. This is an initial badge, not a photo avatar.

## Related

- [OrgSwitcher](org-switcher.md) · [`AvatarCell`](server-data-table.md#cell-renderers) ·
  [03 Design Tokens](../03-design-tokens.md)
