# DropdownMenu

> **Status: ready** · `import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, ... } from "@trf/ui2"` · source: `src/components/ui/dropdown-menu.tsx`

Accessible menu (Radix) for row actions, overflow menus, account menus. Keyboard nav, focus, and
portal handled.

## Usage

```tsx
<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="secondary" size="icon" aria-label="Actions"><MoreHorizontal /></Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="start">
    <DropdownMenuLabel>Invoice #1042</DropdownMenuLabel>
    <DropdownMenuSeparator />
    <DropdownMenuItem><Pencil /> Edit <DropdownMenuShortcut>⌘E</DropdownMenuShortcut></DropdownMenuItem>
    <DropdownMenuItem><Copy /> Duplicate</DropdownMenuItem>
    <DropdownMenuSeparator />
    <DropdownMenuItem destructive><Trash2 /> Delete</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

## Parts

`DropdownMenu` (root) · `DropdownMenuTrigger` (use `asChild` to wrap a `Button`) ·
`DropdownMenuContent` · `DropdownMenuItem` (`inset`, `destructive` props) ·
`DropdownMenuCheckboxItem` · `DropdownMenuRadioGroup` + `DropdownMenuRadioItem` ·
`DropdownMenuLabel` · `DropdownMenuSeparator` · `DropdownMenuShortcut` · `DropdownMenuGroup` ·
`DropdownMenuSub` + `DropdownMenuSubTrigger` + `DropdownMenuSubContent`.

## Rules

- Trigger via `asChild` around a `Button` — don't build a custom trigger.
- `destructive` items use the prop, not a hand-rolled red class.
- Icons are Lucide, auto-sized. Use a `Dialog` to confirm destructive actions chosen here.

## Related

- [Dialog](../../src/components/ui/dialog.tsx) · [05 Iconography](../05-iconography.md)
