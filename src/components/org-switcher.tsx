import * as React from "react";
import { Check, ExternalLink } from "lucide-react";
import { cn } from "../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";
import { Avatar, type AvatarColorInput } from "./avatar";
import { OrgTag } from "./org-tag";

export interface OrgSwitcherOrg {
  id: string;
  name: string;
  slug: string;
  /** Chosen avatar colour. Unset (or unknown) keeps the colour hashed from the slug. */
  color?: AvatarColorInput | null;
  /** Short mark shown after the name, e.g. "ARHIIV": the thing that actually says
   *  which of two identically named organisations this is. Also searchable. */
  tag?: string | null;
}

export interface OrgSwitcherProps {
  /** Organisations the user can switch to (include the current one). */
  orgs: OrgSwitcherOrg[];
  /** Slug of the active organisation — gets a check mark. */
  currentSlug?: string | null;
  /** Fires when a different organisation is picked. The popover closes itself. */
  onSelect: (org: OrgSwitcherOrg) => void;
  /** Fires when the popover opens — hook for lazily fetching the org list. */
  onOpen?: () => void;
  /** Show a loading row instead of "no results" while the org list is being fetched. */
  loading?: boolean;
  /** Show the search input only at or above this many orgs. */
  searchThreshold?: number;
  searchPlaceholder?: string;
  emptyText?: string;
  loadingText?: string;
  /** Build a URL for an org. Supply it and every row gets a trailing "open in a new
   *  tab" link, so a second company can be opened beside the current one instead of
   *  switching away from it. Omit it and no link is rendered. */
  orgHref?: (org: OrgSwitcherOrg) => string;
  /** Accessible label for that link. */
  openLabel?: string;
  /** Popover alignment relative to the trigger. */
  align?: "start" | "center" | "end";
  side?: "top" | "right" | "bottom" | "left";
  /** Extra classes for the popover panel (e.g. a custom width). */
  className?: string;
  /** The trigger element (rendered as-is via `asChild`), e.g. the sidebar brand block. */
  children: React.ReactNode;
}

/** Plain case-insensitive substring match — predictable for company names. */
function substringFilter(itemValue: string, search: string): number {
  const q = search.trim().toLowerCase();
  if (!q) return 1;
  return itemValue.toLowerCase().includes(q) ? 1 : 0;
}

/**
 * Organisation switcher for users who belong to many orgs: a popover listing all
 * organisations with the active one checked, plus type-to-filter search once the list
 * grows past `searchThreshold`. Keyboard navigation (arrows + Enter) comes from cmdk.
 * Rows carry the org's `color` and `tag` when set, which is how two organisations
 * with the same name are told apart; searching matches the tag too.
 *
 * The trigger is consumer-supplied (`children`), so the app shell can keep using its
 * brand block / breadcrumb as the click target. Presentational — the consumer owns
 * fetching (use `onOpen` + `loading` for lazy lists) and what a pick means.
 */
export function OrgSwitcher({
  orgs,
  currentSlug,
  onSelect,
  onOpen,
  loading = false,
  searchThreshold = 8,
  searchPlaceholder = "Search organisations…",
  emptyText = "No organisation found.",
  loadingText = "Loading…",
  orgHref,
  openLabel = "Open in a new tab",
  align = "start",
  side = "bottom",
  className,
  children,
}: OrgSwitcherProps) {
  const [open, setOpen] = React.useState(false);
  const showSearch = orgs.length >= searchThreshold;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) onOpen?.();
  };

  const pick = (org: OrgSwitcherOrg) => {
    setOpen(false);
    if (org.slug !== currentSlug) onSelect(org);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      {/* Width follows the longest org name (up to a cap) instead of a fixed panel width.
          Height follows the org count up to the space Radix reports below the trigger,
          so long lists (20+ orgs) use the viewport instead of CommandList's 18rem cap. */}
      <PopoverContent
        className={cn(
          "flex w-auto min-w-64 max-w-[min(24rem,90vw)] flex-col overflow-hidden p-0",
          "max-h-[var(--radix-popover-content-available-height)]",
          className
        )}
        align={align}
        side={side}
        collisionPadding={8}
      >
        <Command filter={substringFilter}>
          {showSearch && <CommandInput placeholder={searchPlaceholder} />}
          <CommandList className="max-h-none min-h-0">
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">{loadingText}</div>
            ) : (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            <CommandGroup>
              {orgs.map((org) => (
                <CommandItem
                  key={org.id}
                  className="group"
                  value={`${org.name} ${org.slug} ${org.tag ?? ""}`}
                  onSelect={() => pick(org)}
                >
                  <Avatar name={org.name} colorKey={org.slug} color={org.color} size={20} />
                  <span className="min-w-0 flex-1 truncate">{org.name}</span>
                  {org.tag && (
                    <OrgTag color={org.color} colorKey={org.slug} name={org.name}>
                      {org.tag}
                    </OrgTag>
                  )}
                  {org.slug === currentSlug && <Check className="text-muted-foreground" />}
                  {orgHref && (
                    /* A real anchor, so middle-click and cmd-click behave. The row's
                       own click must not fire underneath it: that would switch the
                       current tab to the org you asked to open beside it.

                       Revealed on the active row only, so a long list stays calm.
                       cmdk sets data-selected from both the pointer and the arrow
                       keys, so one rule covers mouse and keyboard; it also stays up
                       while the link itself has focus, and permanently on a coarse
                       pointer, where nothing can hover. Hidden with opacity, not
                       display, so the row does not reflow under the cursor. */
                    <a
                      href={orgHref(org)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${openLabel}: ${org.name}`}
                      title={openLabel}
                      onClick={(e) => e.stopPropagation()}
                      onPointerDown={(e) => e.stopPropagation()}
                      className={cn(
                        "-my-1 shrink-0 rounded-sm p-1 text-muted-foreground opacity-0 transition-opacity",
                        "group-data-[selected=true]:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100",
                        "hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      )}
                    >
                      <ExternalLink />
                    </a>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
