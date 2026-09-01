# Avatar

> **Status: ready** · `import { Avatar, AvatarColorPicker } from "@trf/ui2"` ·
> source: `src/components/avatar.tsx`, `src/components/avatar-color-picker.tsx`

A round, bordered badge showing the first letter of a name (an organisation, a user, a contact).
The background colour is derived deterministically from a key, so the same entity always gets the
same colour everywhere, with nothing stored. Pass `color` to override that hash with a chosen
palette colour, for the case the hash cannot serve: two entities with the *same* name.

> **Not the same as `AvatarCell`.** `AvatarCell` is a table cell renderer in
> [server-data-table.md](server-data-table.md). This is the standalone primitive.

## Usage

```tsx
<Avatar name={org.name} colorKey={org.slug} size={20} />
<Avatar name={user.fullName} colorKey={user.id} />

// Chosen colour wins over the hash; an unset or unknown value falls back to it.
<Avatar name={org.name} colorKey={org.slug} color={org.color} />
```

## Props

| Prop | Type | Notes |
|---|---|---|
| `name` | `string \| null` | The initial is taken from the first character. Falls back to `?`. |
| `colorKey` | `string \| null` | Stable key for the colour. Defaults to `name`. |
| `color` | `AvatarColor \| string \| null` | Chosen palette colour; wins over the hash. Unset or unrecognised falls back to the hash. |
| `size` | `number` | Diameter in px. Default `28`. Font size scales with it. |
| `className` | `string` | |

## The palette

`AVATAR_COLORS` is the eleven hues, exported so a consumer builds a picker without redefining the
list: `red orange amber lime green teal cyan blue indigo purple pink`. Store the **name**, never a
free hex: every circle is `hsl(h 52% 46%)` with a computed border, and a user-picked hex would not
survive dark mode. `asAvatarColor(value)` narrows an untrusted value (an API field) to a palette
colour or `undefined`, so a bad value degrades to the hash instead of breaking a screen.

The order and length of `AVATAR_COLORS` are load-bearing: `hueFor` indexes into it, so reordering
it or adding a twelfth colour would repaint every entity that relies on the hash.

## AvatarColorPicker

The eleven colours as swatches, plus a leading *automatic* swatch (marked with a `Shuffle` glyph)
that clears the choice and returns to the hash. Each swatch is the real `Avatar` in that colour, so
what you pick is what you get.

```tsx
<AvatarColorPicker
  value={org.color}
  onChange={(color) => save({ color })}   // null = automatic
  name={org.name}
  colorKey={org.slug}
/>
```

| Prop | Type | Notes |
|---|---|---|
| `value` | `AvatarColor \| string \| null` | Anything outside the palette reads as automatic. |
| `onChange` | `(color: AvatarColor \| null) => void` | `null` means "back to the hash". |
| `name` / `colorKey` | `string \| null` | Passed to each swatch, as on `Avatar`. |
| `size` | `number` | Swatch diameter. Default `28`. |
| `autoLabel` | `string` | Accessible label for the automatic swatch. Default `"Automatic"`. |
| `disabled` | `boolean` | |

## Rules

- **Pass a `colorKey` that is not the name** (org slug, user id) wherever the name can change. On
  the default, a rename recolours the entity.
- **Only reach for `color` when the hash genuinely fails**, i.e. two organisations sharing a name. Use
  the hash everywhere else; it needs no storage and no one has to maintain it.
- A colour distinguishes, it does not identify: it says "these two rows differ", not which is
  which. Where that matters, ship it with a short text mark (see [OrgSwitcher](org-switcher.md)).
- Colour comes from a fixed spread of 11 hues hashed from the key, at a lightness that stays
  legible with white text in both themes. The border darkens in light mode and lightens in dark,
  so the circle stays defined either way.
- It renders `aria-hidden`: it is decoration next to a visible name, never the only label. If it
  ever stands alone, put the name in adjacent text or an `aria-label` on the wrapper.
- No image support by design. This is an initial badge, not a photo avatar.

## Related

- [OrgSwitcher](org-switcher.md) · [`AvatarCell`](server-data-table.md#cell-renderers) ·
  [03 Design Tokens](../03-design-tokens.md)
