import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "../lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import { ActionPill } from "./ui/action-pill";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "./ui/command";

export interface ComboboxOption<T = unknown> {
  value: string;
  label: string;
  /** Arbitrary payload for preset filtering (e.g. account type) — not rendered. */
  data?: T;
}

export interface ComboboxPreset<T = unknown> {
  label: string;
  match: (option: ComboboxOption<T>) => boolean;
}

export interface ComboboxProps<T = unknown> {
  options: ComboboxOption<T>[];
  value?: string;
  onChange?: (value: string) => void;
  /** Trigger text when nothing is selected. */
  placeholder?: string;
  /** Search box placeholder. */
  searchPlaceholder?: string;
  /** Shown when the search matches nothing. */
  emptyText?: string;
  id?: string;
  disabled?: boolean;
  className?: string;
  /**
   * Category filter pills shown between the search box and the results (e.g. "Expenses" /
   * "Leasing" / "Fixed assets" / "All" for a chart-of-accounts picker). The first preset is
   * active by default; requires at least 2 presets to render.
   */
  presets?: ComboboxPreset<T>[];
}

/**
 * Single-select autocomplete (Popover + Command). The accessible, filterable replacement for the
 * old AccountCombobox — e.g. a customer picker. Pass `presets` to bring back its category pills.
 */
export function Combobox<T = unknown>({
  options,
  value,
  onChange,
  placeholder = "Select…",
  searchPlaceholder = "Search…",
  emptyText = "No results.",
  id,
  disabled,
  className,
  presets,
}: ComboboxProps<T>) {
  const [open, setOpen] = React.useState(false);
  const [activePreset, setActivePreset] = React.useState(0);
  const selected = options.find((o) => o.value === value);
  const visible =
    presets && presets.length > 1
      ? options.filter(presets[activePreset]?.match ?? (() => true))
      : options;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            "flex h-9 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 focus-visible:ring-offset-background",
            "disabled:cursor-not-allowed disabled:opacity-50",
            !selected && "text-muted-foreground",
            className
          )}
        >
          <span className="truncate">{selected ? selected.label : placeholder}</span>
          <ChevronsUpDown className="size-4 shrink-0 opacity-50" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-[var(--radix-popover-trigger-width)] min-w-[12rem] p-0"
      >
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          {presets && presets.length > 1 && (
            <div className="flex flex-wrap gap-1 border-b border-border p-2">
              {presets.map((p, i) => (
                <ActionPill
                  key={p.label}
                  variant={activePreset === i ? "selected" : "default"}
                  onClick={() => setActivePreset(i)}
                >
                  {p.label}
                </ActionPill>
              ))}
            </div>
          )}
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {visible.map((o) => (
                <CommandItem
                  key={o.value}
                  value={o.label}
                  onSelect={() => {
                    onChange?.(o.value);
                    setOpen(false);
                  }}
                >
                  <Check className={cn(value === o.value ? "opacity-100" : "opacity-0")} />
                  {o.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
