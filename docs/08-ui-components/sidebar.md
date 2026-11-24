# App shell & Sidebar

> **Status: ready** · `import { AppShell, Sidebar, SidebarProvider, SidebarHeader, SidebarContent,
> SidebarFooter, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarTrigger,
> SidebarInset, useSidebar } from "@trf/ui2"` · source: `src/components/sidebar.tsx`

A composable, **presentational** sidebar — no routing, auth, or data fetching inside. The app
supplies the menu data, active state, and any header/footer widgets (org switcher, theme toggle,
logout) as children/slots.

## Anatomy

```tsx
<AppShell sidebar={
  <Sidebar>
    <SidebarHeader>{/* logo / org switcher */}</SidebarHeader>
    <SidebarContent>                         {/* scrolls; header+footer stay put */}
      <SidebarMenu>
        <SidebarMenuItem>
          <SidebarMenuButton groupId="sales" icon={<BadgeDollarSign />} tooltip="Sales">Sales</SidebarMenuButton>
          <SidebarMenuSub groupId="sales">
            <SidebarMenuItem><SidebarMenuButton href="/invoices" isActive>Invoices</SidebarMenuButton></SidebarMenuItem>
          </SidebarMenuSub>
        </SidebarMenuItem>
        <SidebarMenuItem>
          <SidebarMenuButton icon={<ScrollText />} href="/ledger" isActive>Ledger</SidebarMenuButton>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarContent>
    <SidebarFooter>{/* actions */} <SidebarTrigger /></SidebarFooter>
  </Sidebar>
}>
  {/* page content */}
</AppShell>
```

`AppShell` is a convenience (provider + flex + `SidebarInset`). For full control, use
`SidebarProvider` + `Sidebar` + `SidebarInset` directly.

## Key props

- **`SidebarMenuButton`** — `icon` (Lucide), `isActive`, `href` (renders `<a>`), `tooltip`
  (shown when collapsed), `groupId` (makes it an expandable group toggle with a chevron),
  plus normal button props (`onClick`). For the grouped menu: `count`, `hasActive`, `variant`.
- **`SidebarMenuItem`** — `color` (a menu palette name) gives a top-level group its colour.
- **`SidebarMenuSub`** — `groupId` ties it to its toggle; animates open/closed. Nests: a group
  inside a sub is a third level.
- **`SidebarProvider` / `AppShell`** — `defaultCollapsed`, `defaultOpenGroups`, controlled
  `openGroups` + `onOpenGroupsChange`, and `accordion`.
- **`useSidebar()`**: `{ collapsed, setCollapsed, toggleCollapsed, width, setWidth, resetWidth,
  resizing, openGroups, toggleGroup, mobileOpen, setMobileOpen }` for custom header/footer
  widgets (e.g. a fading wordmark). `width` is the expanded width in CSS px.
- **Geometry constants** (CSS px, exported): `SIDEBAR_DEFAULT_WIDTH` 256, `SIDEBAR_MIN_WIDTH` 200,
  `SIDEBAR_MAX_WIDTH` 400, `SIDEBAR_ICON_WIDTH` 56, `SIDEBAR_SNAP_WIDTH` 150, and
  `clampSidebarWidth(px)`. A layout that reserves room beside the rail reads these instead of
  repeating the numbers.

## The grouped menu

The whole product in one menu: coloured groups, one open at a time, counts for what waits. All of
it is opt-in. A sidebar that passes none of the props below renders exactly as before.

```tsx
<SidebarProvider accordion openGroups={open} onOpenGroupsChange={setOpen}>
  <Sidebar>
    <SidebarContent className="flex flex-col">
      <SidebarMenu>
        <SidebarMenuItem color="green">
          <SidebarMenuButton groupId="sales" icon={<BadgeDollarSign />} tooltip="Sales"
            count={1} hasActive={pageIsIn("sales")}>Sales</SidebarMenuButton>
          <SidebarMenuSub groupId="sales">
            <SidebarMenuItem><SidebarMenuButton isActive count={1}>Invoices</SidebarMenuButton></SidebarMenuItem>
          </SidebarMenuSub>
        </SidebarMenuItem>
        <SidebarMenuItem color="gray">
          <SidebarMenuButton groupId="settings" icon={<Settings />} tooltip="Settings">Settings</SidebarMenuButton>
          <SidebarMenuSub groupId="settings">
            <SidebarMenuItem>                         {/* a section: third level */}
              <SidebarMenuButton groupId="settings-accounting">Accounting</SidebarMenuButton>
              <SidebarMenuSub groupId="settings-accounting">…</SidebarMenuSub>
            </SidebarMenuItem>
            <SidebarMenuItem><SidebarMenuButton variant="destructive">Sign out</SidebarMenuButton></SidebarMenuItem>
          </SidebarMenuSub>
        </SidebarMenuItem>
      </SidebarMenu>
      <div className="mt-auto flex shrink-0 items-center px-2 pt-2">   {/* bottom, or scrolls away */}
        {themeToggle}                                             {/* the app's light/dark button */}
        <SidebarTrigger />
      </div>
    </SidebarContent>
  </Sidebar>
</SidebarProvider>
```

- **`color` on `SidebarMenuItem`**: one of the menu palette names, exported as `SIDEBAR_COLORS`
  (`gray red orange yellow green teal cyan blue violet purple magenta`, the `--menu-*` tokens: one
  lightness and chroma for all, a hue each, lifted in dark). Set it on the top-level item; every
  row under it inherits it. It changes three things: the group's icon carries the colour all the
  time, the tree line takes a trace of it (22%), and the current page is filled with it (14%) with
  the label in the text colour. The open group's row gets no mark of its own. Chevrons go quiet
  (muted, full strength on hover). Unknown or empty leaves the item as is; `asSidebarColor`
  narrows a value from a menu payload.
- **`accordion` on the provider**: opening a group closes the others on its level. A level is one
  `SidebarMenu` or one `SidebarMenuSub`, so the sections inside Settings take turns without closing
  Settings, and a section stays remembered while its parent is closed. When the app drives
  `openGroups` itself (opening the current route's groups), it replaces the list rather than adding
  to it; the provider only prunes on a click.
- **`hasActive` on a group button**: the current page is somewhere inside. While that group is
  closed, or the rail is collapsed, its row is filled (12% of the group colour), because the page's
  own row is out of sight. An open group is never filled: only the page is.
- **`count`**: a small red number after the label for what waits there; nothing at 0 or unset,
  `99+` above 99. Hidden on the icon rail. Works on groups and pages alike.
- **`variant="destructive"`**: a red row for leaving (Sign out).
- **No footer needed**: `SidebarTrigger` can be the last row of `SidebarContent`. Make the content
  a flex column and give the row `mt-auto`: it rests on the bottom of the rail while the menu is
  shorter than the rail, and a taller menu pushes it down so it scrolls away with the rest (it is
  not sticky). The trigger centres itself on the rail. The app's light/dark button (a ghost icon
  `Button`, moon or sun) goes on the left of the same row and folds away on the rail, so the
  trigger keeps the centre line.

Kitchen sink: "App shell / Grouped menu".

## The behavior (all CSS, no animation lib)

- **Resizable**: drag the rail's right edge (an 8px grip inside the border, a ring-toned 1px line
  while hovered or dragging; `cursor: col-resize`). The width follows the hand between the minimum
  and the maximum. Narrower than the snap width the rail collapses to icons; dragging the icon rail
  out past the snap width expands it again and the width follows from there. Double-click on the
  edge resets the default. The width transition is off during the drag and under
  `prefers-reduced-motion`. No keyboard resize; the collapse toggle covers that.
- **Collapse to icon rail** (256px → 56px). Collapsed flag and width persist together in one cookie,
  `trf-sidebar=<0|1>.<width>`, on the apex domain (`path=/`, one year, `samesite=lax`,
  `domain=.<last two labels>`; a host cookie on localhost or an IP), the same way `@trf/app-shell`
  stores the theme and the AI panel state, so every app shares the one memory. The old
  `localStorage` flag is read once as a fallback and never written again.
- **Staged**: collapsing closes the open groups first, *then* narrows; expanding widens first,
  then restores the groups.
- **Icons never move**: the icon sits at a fixed 20px left offset = `(56−16)/2`, so it's centered
  in the collapsed rail and identical when expanded. Labels fade via `max-width`+`opacity`.
- **Accordion** via the `grid-template-rows: 0fr→1fr` trick.
- **Sticky** header & footer; only `SidebarContent` scrolls.
- Clicking a collapsed item expands the rail first; `tooltip` shows the label while collapsed.

## Rules

- **Presentational only.** Don't put routing/fetch/auth in the sidebar — pass `href`/`onClick`
  and `isActive` from the app; drop app widgets into the header/footer slots.
- Icons are **Lucide** (doc 05). Every collapsible group needs a unique `groupId`.

## Related

- [05 Iconography](../05-iconography.md) · [07 Component Architecture](../07-component-architecture.md)
- Mobile: `Sidebar` renders an overlay drawer when `useSidebar().mobileOpen` — wire a trigger via `setMobileOpen`.
