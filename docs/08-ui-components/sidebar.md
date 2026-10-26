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
  plus normal button props (`onClick`).
- **`SidebarMenuSub`** — `groupId` ties it to its toggle; animates open/closed.
- **`SidebarProvider` / `AppShell`** — `defaultCollapsed`, `defaultOpenGroups`.
- **`useSidebar()`**: `{ collapsed, setCollapsed, toggleCollapsed, width, setWidth, resetWidth,
  resizing, openGroups, toggleGroup, mobileOpen, setMobileOpen }` for custom header/footer
  widgets (e.g. a fading wordmark). `width` is the expanded width in CSS px.
- **Geometry constants** (CSS px, exported): `SIDEBAR_DEFAULT_WIDTH` 256, `SIDEBAR_MIN_WIDTH` 200,
  `SIDEBAR_MAX_WIDTH` 400, `SIDEBAR_ICON_WIDTH` 56, `SIDEBAR_SNAP_WIDTH` 150, and
  `clampSidebarWidth(px)`. A layout that reserves room beside the rail reads these instead of
  repeating the numbers.

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
