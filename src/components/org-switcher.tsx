import * as React from "react";
import { Check } from "lucide-react";
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
import { Avatar } from "./avatar";

export interface OrgSwitcherOrg {
  id: string;
  name: string;
  slug: string;
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
      {/* Width follows the longest org name (up to a cap) instead of a fixed panel width. */}
      <PopoverContent
        className={cn("w-auto min-w-64 max-w-[min(24rem,90vw)] p-0", className)}
        align={align}
        side={side}
      >
        <Command filter={substringFilter}>
          {showSearch && <CommandInput placeholder={searchPlaceholder} />}
          <CommandList>
            {loading ? (
              <div className="py-6 text-center text-sm text-muted-foreground">{loadingText}</div>
            ) : (
              <CommandEmpty>{emptyText}</CommandEmpty>
            )}
            <CommandGroup>
              {orgs.map((org) => (
                <CommandItem
                  key={org.id}
                  value={`${org.name} ${org.slug}`}
                  onSelect={() => pick(org)}
                >
                  <Avatar name={org.name} colorKey={org.slug} size={20} />
                  <span className="min-w-0 flex-1 truncate">{org.name}</span>
                  {org.slug === currentSlug && <Check className="text-muted-foreground" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
