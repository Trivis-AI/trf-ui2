import * as React from "react";
import { ChevronRight, PanelLeftClose, PanelLeftOpen, Menu } from "lucide-react";
import { cn } from "../lib/utils";
import { tr } from "../lib/i18n";
import { useScrollbarActivity } from "../hooks/useScrollbarActivity";
import { readPrefCookie, writePrefCookie } from "../lib/prefCookie";

/*
 * Composable sidebar (shadcn-shaped), presentational only — no routing/auth/data inside.
 * The polish (inspired by trf-ui v1) is CSS-only:
 *  - rail animates width 16rem <-> 3.5rem; icons never move (icon column left-offset = 20px =
 *    (56-16)/2, identical expanded vs collapsed); labels fade via max-width + opacity.
 *  - collapsing is STAGED: accordions close first, then the rail narrows (and reverse on expand).
 *  - sub-menus animate with the grid-template-rows 0fr->1fr trick (no JS height measuring).
 *  - header + footer are flex-fixed; only the middle scrolls.
 */

/*
 * Width. The expanded rail is resizable from its right edge (SidebarResizeHandle, rendered by
 * <Sidebar>): the width follows the hand between the minimum and the maximum; narrower than the
 * snap width the rail collapses to icons, and dragging the icon rail out past the snap width
 * expands it again. Double-click on the edge resets the default. The collapsed flag and the
 * width persist together in one cookie on the apex domain (prefCookie.ts), like the theme and
 * the AI panel state in @trf/app-shell, so every app shares them. Sizes are CSS px: --font-scale
 * scales text, not rem, so the icon geometry (20px offset, 56px rail) ignores the text size.
 */
const COOKIE = "trf-sidebar";
/** Where the collapsed flag lived before the cookie; read once as a fallback, never written. */
const LEGACY_COLLAPSE_KEY = "trf-ui2-sidebar-collapsed";
export const SIDEBAR_DEFAULT_WIDTH = 256;
export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 400;
/** The icon rail: a 16px icon centers at 28px, so the icon column's left offset is 20px. */
export const SIDEBAR_ICON_WIDTH = 56;
/** Dragging the expanded rail narrower than this collapses it. */
export const SIDEBAR_SNAP_WIDTH = 150;
/** Dragging the icon rail out this far past the snap width expands it again (hysteresis). */
const SIDEBAR_EXPAND_HYSTERESIS = 20;

export function clampSidebarWidth(px: number): number {
  return Math.min(SIDEBAR_MAX_WIDTH, Math.max(SIDEBAR_MIN_WIDTH, Math.round(px)));
}

function readStoredSidebar(defaultCollapsed: boolean): { collapsed: boolean; width: number } {
  const fallback = { collapsed: defaultCollapsed, width: SIDEBAR_DEFAULT_WIDTH };
  if (typeof window === "undefined") return fallback;
  const v = readPrefCookie(COOKIE);
  if (v) {
    const [c, w] = v.split(".");
    const n = Number(w);
    return {
      collapsed: c === "1",
      width: Number.isFinite(n) && n >= SIDEBAR_MIN_WIDTH && n <= SIDEBAR_MAX_WIDTH ? n : SIDEBAR_DEFAULT_WIDTH,
    };
  }
  try {
    const legacy = window.localStorage.getItem(LEGACY_COLLAPSE_KEY);
    if (legacy != null) return { ...fallback, collapsed: legacy === "1" };
  } catch {
    /* storage blocked: the default stands */
  }
  return fallback;
}

type SidebarContextValue = {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  toggleCollapsed: () => void;
  /** Expanded width in CSS px, within SIDEBAR_MIN_WIDTH..SIDEBAR_MAX_WIDTH. */
  width: number;
  setWidth: (px: number) => void;
  /** Back to SIDEBAR_DEFAULT_WIDTH, expanded. */
  resetWidth: () => void;
  /** True while the edge is being dragged (the width transition is off meanwhile). */
  resizing: boolean;
  setResizing: (v: boolean) => void;
  openGroups: Set<string>;
  toggleGroup: (id: string, forceOpen?: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
};

const SidebarContext = React.createContext<SidebarContextValue | null>(null);

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within <SidebarProvider>");
  return ctx;
}

export interface SidebarProviderProps {
  defaultCollapsed?: boolean;
  /** Initial open group ids (uncontrolled). */
  defaultOpenGroups?: string[];
  /** Controlled open group ids — pass with onOpenGroupsChange to drive open state from the app
   *  (e.g. auto-open the active route's group once an async menu has loaded). */
  openGroups?: string[];
  onOpenGroupsChange?: (ids: string[]) => void;
  children: React.ReactNode;
}

export function SidebarProvider({
  defaultCollapsed = false,
  defaultOpenGroups = [],
  openGroups: openGroupsProp,
  onOpenGroupsChange,
  children,
}: SidebarProviderProps) {
  // Read once, synchronously, so the first paint already has the stored width and state.
  const [stored] = React.useState(() => readStoredSidebar(defaultCollapsed));
  const [collapsed, setCollapsedState] = React.useState<boolean>(stored.collapsed);
  const [width, setWidthState] = React.useState<number>(stored.width);
  const [resizing, setResizing] = React.useState(false);
  const [openGroups, setOpenGroupsState] = React.useState<Set<string>>(
    () => new Set(openGroupsProp ?? defaultOpenGroups)
  );
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const savedGroups = React.useRef<Set<string> | null>(null);

  // Controlled mode: keep internal state in sync with the `openGroups` prop.
  React.useEffect(() => {
    if (openGroupsProp == null) return;
    setOpenGroupsState((prev) => {
      const next = new Set(openGroupsProp);
      const same = next.size === prev.size && [...next].every((x) => prev.has(x));
      return same ? prev : next;
    });
  }, [openGroupsProp]);

  // Update internal state AND notify the parent (so controlled usage stays in sync).
  const setOpenGroups = React.useCallback(
    (updater: Set<string> | ((prev: Set<string>) => Set<string>)) => {
      setOpenGroupsState((prev) => {
        const next = typeof updater === "function" ? updater(prev) : updater;
        onOpenGroupsChange?.([...next]);
        return next;
      });
    },
    [onOpenGroupsChange]
  );

  const setCollapsed = React.useCallback((v: boolean) => setCollapsedState(v), []);
  const setWidth = React.useCallback((px: number) => setWidthState(clampSidebarWidth(px)), []);
  const resetWidth = React.useCallback(() => {
    setWidthState(SIDEBAR_DEFAULT_WIDTH);
    setCollapsedState(false);
  }, []);

  // Persist both in one cookie, `<collapsed 0|1>.<width>`; not on every drag frame, once it ends.
  React.useEffect(() => {
    if (resizing) return;
    writePrefCookie(COOKIE, `${collapsed ? 1 : 0}.${width}`);
  }, [collapsed, width, resizing]);

  const toggleGroup = React.useCallback(
    (id: string, forceOpen?: boolean) => {
      setOpenGroups((prev) => {
        const next = new Set(prev);
        if (forceOpen) next.add(id);
        else if (next.has(id)) next.delete(id);
        else next.add(id);
        return next;
      });
    },
    [setOpenGroups]
  );

  // Staged collapse: close accordions first, then narrow (and reverse on expand).
  const toggleCollapsed = React.useCallback(() => {
    if (!collapsed) {
      savedGroups.current = openGroups;
      setOpenGroups(new Set());
      window.setTimeout(() => setCollapsed(true), 180);
    } else {
      setCollapsed(false);
      const restore = savedGroups.current;
      if (restore) window.setTimeout(() => setOpenGroups(restore), 220);
    }
  }, [collapsed, openGroups, setCollapsed, setOpenGroups]);

  const value = React.useMemo<SidebarContextValue>(
    () => ({
      collapsed,
      setCollapsed,
      toggleCollapsed,
      width,
      setWidth,
      resetWidth,
      resizing,
      setResizing,
      openGroups,
      toggleGroup,
      mobileOpen,
      setMobileOpen,
    }),
    [collapsed, setCollapsed, toggleCollapsed, width, setWidth, resetWidth, resizing, openGroups, toggleGroup, mobileOpen]
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

/** The rail. Desktop: width-animating aside. Mobile: an overlay drawer when mobileOpen. */
export function Sidebar({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = useSidebar();
  const { collapsed, mobileOpen, width, resizing } = ctx;
  return (
    <>
      {/* Desktop rail. `--sidebar-width` lets the labels' fade max-width follow the rail. */}
      <aside
        data-collapsed={collapsed || undefined}
        style={{ width: collapsed ? SIDEBAR_ICON_WIDTH : width, "--sidebar-width": `${width}px` } as React.CSSProperties}
        className={cn(
          "relative hidden h-full shrink-0 flex-col overflow-hidden border-r border-border bg-sidebar text-card-foreground md:flex",
          resizing ? "transition-none" : "transition-[width] duration-300 ease-in-out motion-reduce:transition-none",
          className
        )}
      >
        {children}
        <SidebarResizeHandle />
      </aside>

      {/* Mobile menu: a full-screen, touch-first panel (not a mini desktop rail).
          Forces an expanded context so labels always show; respects safe-area insets.
          The mobile-specific sizing lives in the `max-md:` utilities on the rows. */}
      {/* Animated full-screen mobile menu (always mounted so it can transition). */}
      <div
        aria-hidden={!mobileOpen}
        className={cn(
          "fixed inset-0 z-50 flex md:hidden transition-[opacity,visibility] duration-200 ease-out",
          mobileOpen ? "visible opacity-100" : "invisible opacity-0 pointer-events-none"
        )}
      >
        {/* No transform: the header bar is identical/aligned to the closed-state bar,
            so a fade (on the wrapper) keeps it visually static — only the body appears. */}
        <aside className="flex h-full w-full flex-col overflow-hidden bg-sidebar text-card-foreground pb-[env(safe-area-inset-bottom)]">

          {/* The header bar (with its own ☰/✕ toggle) is part of `children`, so it
              aligns exactly with the closed-state bar. */}
          <SidebarContext.Provider value={{ ...ctx, collapsed: false }}>
            {children}
          </SidebarContext.Provider>
        </aside>
      </div>
    </>
  );
}

/** Hamburger that opens the mobile drawer. Render in a mobile top bar (`md:hidden`). */
export function SidebarMobileTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { setMobileOpen } = useSidebar();
  return (
    <button
      type="button"
      aria-label={tr("<trn-ui-open-menu>", "Open menu")}
      onClick={() => setMobileOpen(true)}
      className={cn(
        "flex size-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&_svg]:size-5",
        className
      )}
      {...props}
    >
      <Menu />
    </button>
  );
}

export function SidebarHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex shrink-0 items-center border-b border-border", className)}
      {...props}
    />
  );
}

export function SidebarContent({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  const { mobileOpen } = useSidebar();
  return (
    <div
      className={cn(
        "min-h-0 flex-1 overflow-y-auto overflow-x-hidden py-2",
        // Mobile: the nav body slides up into place as the menu opens (the header bar
        // stays fixed, so there's no jump). Inert on desktop (max-md:).
        "max-md:transition-transform max-md:duration-200 max-md:ease-out",
        mobileOpen ? "max-md:translate-y-0" : "max-md:translate-y-4",
        className
      )}
      {...props}
    />
  );
}

export function SidebarFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center gap-0.5 overflow-hidden border-t border-border p-2",
        className
      )}
      {...props}
    />
  );
}

export function SidebarMenu({ className, ...props }: React.HTMLAttributes<HTMLUListElement>) {
  return <ul className={cn("flex flex-col gap-0.5 px-2", className)} {...props} />;
}

export function SidebarMenuItem({ className, ...props }: React.LiHTMLAttributes<HTMLLIElement>) {
  return <li className={cn("list-none", className)} {...props} />;
}

/** Label that fades to zero width when collapsed (so the icon never shifts). */
function FadeLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  const { collapsed } = useSidebar();
  return (
    <span
      className={cn(
        "min-w-0 flex-1 overflow-hidden whitespace-nowrap text-ellipsis transition-[max-width,opacity] duration-200 ease-in-out",
        collapsed ? "max-w-0 opacity-0" : "max-w-[var(--sidebar-width,12rem)] opacity-100 max-md:max-w-none",
        className
      )}
    >
      {children}
    </span>
  );
}

export interface SidebarMenuButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "type"> {
  /** Leading icon (Lucide). Stays pixel-fixed; the label fades around it. */
  icon?: React.ReactNode;
  /** Active (current route) styling. */
  isActive?: boolean;
  /** If set, this row is an expandable group: clicking toggles it, a chevron is shown. */
  groupId?: string;
  /** If set, render as an `<a href>` link instead of a button. */
  href?: string;
  /** Shown as a native tooltip when collapsed (icon-only). */
  tooltip?: string;
}

export function SidebarMenuButton({
  icon,
  isActive,
  groupId,
  href,
  tooltip,
  className,
  children,
  onClick,
  ...props
}: SidebarMenuButtonProps) {
  const { collapsed, setCollapsed, openGroups, toggleGroup, setMobileOpen } = useSidebar();
  const isOpen = groupId ? openGroups.has(groupId) : false;

  const handleClick = (e: React.MouseEvent<HTMLButtonElement & HTMLAnchorElement>) => {
    if (collapsed) {
      // Clicking a collapsed rail expands it first (then opens the group, if any).
      setCollapsed(false);
      if (groupId) toggleGroup(groupId, true);
    } else if (groupId) {
      toggleGroup(groupId);
    }
    // A leaf row navigates — close the mobile drawer (no-op on desktop).
    if (!groupId) setMobileOpen(false);
    onClick?.(e as React.MouseEvent<HTMLButtonElement>);
  };

  // pl-3 + the SidebarMenu's px-2 ⇒ icon left = 8+12 = 20px ⇒ icon CENTER = 28px = rail centre
  // (56/2), the same vertical line as the header logo. Padding is identical expanded/collapsed,
  // so the icon never moves. Keep these in sync if SidebarMenu's px-* changes.
  const classes = cn(
    "flex w-full items-center rounded-md py-1.5 pl-3 pr-3 text-left text-sm transition-colors",
    // Mobile-first: larger rows + font for touch (the rail is hidden below md, so
    // these only affect the full-screen mobile menu).
    "max-md:gap-1 max-md:py-3 max-md:text-base",
    isActive
      // Light: purple ink reads fine on the tinted bg. Dark: the magenta primary is too
      // dark on the tint, so the active label goes near-white (foreground) for contrast.
      ? "bg-primary/10 font-medium text-primary dark:text-foreground"
      : "text-foreground hover:bg-accent hover:text-accent-foreground",
    "[&_svg]:size-4 [&_svg]:shrink-0 max-md:[&_svg]:size-5",
    className
  );

  const inner = (
    <>
      {icon}
      <FadeLabel className={icon ? "ml-2" : undefined}>{children}</FadeLabel>
      {groupId && (
        <span
          className={cn(
            "ml-auto flex shrink-0 overflow-hidden transition-[max-width,opacity] duration-200",
            collapsed ? "max-w-0 opacity-0" : "max-w-4 opacity-100"
          )}
        >
          <ChevronRight
            className={cn(
              "size-3.5 transition-transform duration-200",
              isOpen && "rotate-90"
            )}
          />
        </span>
      )}
    </>
  );

  if (href && !groupId) {
    return (
      <a
        href={href}
        title={collapsed ? tooltip : undefined}
        className={classes}
        onClick={handleClick}
      >
        {inner}
      </a>
    );
  }

  return (
    <button
      type="button"
      title={collapsed ? tooltip : undefined}
      className={classes}
      onClick={handleClick}
      {...props}
    >
      {inner}
    </button>
  );
}

/** Animated container for a group's children. Open/closed by `groupId` via the grid 0fr/1fr trick. */
export function SidebarMenuSub({
  groupId,
  className,
  children,
}: {
  groupId: string;
  className?: string;
  children: React.ReactNode;
}) {
  const { collapsed, openGroups } = useSidebar();
  const open = !collapsed && openGroups.has(groupId);
  const ref = React.useRef<HTMLDivElement>(null);
  const prevOpen = React.useRef(open);
  // When a group opens, the revealed children may render below the fold on short
  // viewports — the menu appears not to react. After the expand animation, scroll
  // the newly-shown items into view (minimally — `nearest` is a no-op if visible).
  React.useEffect(() => {
    if (open && !prevOpen.current) {
      const id = window.setTimeout(() => {
        ref.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      }, 210);
      prevOpen.current = open;
      return () => window.clearTimeout(id);
    }
    prevOpen.current = open;
  }, [open]);
  return (
    <div
      ref={ref}
      className="grid transition-[grid-template-rows] duration-200 ease-in-out"
      style={{ gridTemplateRows: open ? "1fr" : "0fr" }}
    >
      <div className="overflow-hidden">
        {/* ml-5 (20px) + the SidebarMenu's px-2 (8px) ⇒ the left border sits at 28px,
            centered under the parent row's icon. */}
        <ul className={cn("ml-5 mt-0.5 flex flex-col gap-0.5 border-l border-border pl-2.5", className)}>
          {children}
        </ul>
      </div>
    </div>
  );
}

/**
 * The grip on the rail's right edge: drag to resize, past the snap width to collapse or expand,
 * double-click to reset. The width the hand asks for is always `start + dx`, whether the rail
 * is collapsed or not, so the two snaps stay symmetric. Pointer capture keeps the drag alive
 * over iframes (the AI panel) and the body cursor stays col-resize until release.
 */
function SidebarResizeHandle() {
  const { collapsed, setCollapsed, width, setWidth, resetWidth, resizing, setResizing } = useSidebar();

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const el = e.currentTarget;
    el.setPointerCapture(e.pointerId);
    const startX = e.clientX;
    const startW = collapsed ? SIDEBAR_ICON_WIDTH : width;
    let isCollapsed = collapsed;
    const body = document.body;
    const prev = { cursor: body.style.cursor, userSelect: body.style.userSelect };
    body.style.cursor = "col-resize";
    body.style.userSelect = "none";
    setResizing(true);

    const onMove = (ev: PointerEvent) => {
      const w = startW + (ev.clientX - startX);
      if (isCollapsed) {
        if (w >= SIDEBAR_SNAP_WIDTH + SIDEBAR_EXPAND_HYSTERESIS) {
          isCollapsed = false;
          setCollapsed(false);
          setWidth(w);
        }
      } else if (w < SIDEBAR_SNAP_WIDTH) {
        // Collapse, and keep the width the drag started from, so the toggle reopens there
        // rather than at the minimum the hand passed on the way down.
        isCollapsed = true;
        setCollapsed(true);
        setWidth(width);
      } else {
        setWidth(w);
      }
    };
    const end = () => {
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", end);
      el.removeEventListener("pointercancel", end);
      body.style.cursor = prev.cursor;
      body.style.userSelect = prev.userSelect;
      setResizing(false);
    };
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", end);
    el.addEventListener("pointercancel", end);
  };

  return (
    <div
      role="separator"
      aria-orientation="vertical"
      aria-label={tr("<trn-ui-resize-sidebar>", "Resize sidebar")}
      aria-valuemin={SIDEBAR_MIN_WIDTH}
      aria-valuemax={SIDEBAR_MAX_WIDTH}
      aria-valuenow={collapsed ? SIDEBAR_ICON_WIDTH : width}
      data-sidebar-resize
      onPointerDown={onPointerDown}
      onDoubleClick={resetWidth}
      className={cn(
        "absolute inset-y-0 right-0 z-10 w-2 cursor-col-resize touch-none select-none",
        // The 1px line on the edge: nothing at rest, ring-toned while hovered or dragging.
        "after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-ring after:opacity-0 after:transition-opacity after:duration-150",
        "hover:after:opacity-60",
        resizing && "after:opacity-60"
      )}
    />
  );
}

/** Collapse/expand toggle (the staged animation lives in the provider). */
export function SidebarTrigger({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const { collapsed, toggleCollapsed } = useSidebar();
  return (
    <button
      type="button"
      title={collapsed ? tr("<trn-ui-expand-sidebar>", "Expand sidebar") : tr("<trn-ui-collapse-sidebar>", "Collapse sidebar")}
      onClick={toggleCollapsed}
      className={cn(
        "flex size-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground [&_svg]:size-4",
        // Collapsing the rail is a desktop-only affordance — hide it in the mobile menu.
        "max-md:hidden",
        collapsed ? "mx-auto" : "ml-auto",
        className
      )}
      {...props}
    >
      {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
    </button>
  );
}

/** The main content area beside the sidebar. */
export function SidebarInset({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <main
      className={cn("flex min-w-0 flex-1 flex-col overflow-y-auto", className)}
      {...props}
    />
  );
}

/** Convenience frame: provider + flex row. Pass the <Sidebar> and page content as children. */
export interface AppShellProps {
  sidebar: React.ReactNode;
  children: React.ReactNode;
  defaultCollapsed?: boolean;
  defaultOpenGroups?: string[];
  /** Controlled open groups (with onOpenGroupsChange) — e.g. to auto-open the active route. */
  openGroups?: string[];
  onOpenGroupsChange?: (ids: string[]) => void;
  className?: string;
}

export function AppShell({
  sidebar,
  children,
  defaultCollapsed,
  defaultOpenGroups,
  openGroups,
  onOpenGroupsChange,
  className,
}: AppShellProps) {
  // Thin scrollbars show their thumb while a box scrolls (tokens.css, "Scrollbars").
  useScrollbarActivity();
  return (
    <SidebarProvider
      defaultCollapsed={defaultCollapsed}
      defaultOpenGroups={defaultOpenGroups}
      openGroups={openGroups}
      onOpenGroupsChange={onOpenGroupsChange}
    >
      <div className={cn("flex h-dvh w-full overflow-hidden", className)}>
        {sidebar}
        <SidebarInset>{children}</SidebarInset>
      </div>
    </SidebarProvider>
  );
}
