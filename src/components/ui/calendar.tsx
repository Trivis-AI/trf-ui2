import * as React from "react";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { DayPicker, getDefaultClassNames } from "react-day-picker";
import { cn } from "../../lib/utils";
import { buttonVariants } from "./button";

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

/**
 * Month-grid calendar (react-day-picker), skinned entirely from tokens — light + dark, Lucide
 * chevrons. Usually composed inside {@link DatePicker}; use directly only for inline calendars.
 */
export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  hideNavigation = true,
  weekStartsOn = 1,
  ...props
}: CalendarProps) {
  const defaults = getDefaultClassNames();
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      // Prev/next month arrows are hidden by default — month/year navigation happens through the
      // dropdowns (captionLayout="dropdown"). Pass hideNavigation={false} to bring the arrows back.
      hideNavigation={hideNavigation}
      // Weeks start on Monday, not react-day-picker's en-US default of Sunday: every market the
      // suite serves (EE/LV/LT, en-GB) is Monday-first, and so is ISO 8601. Override per instance
      // with weekStartsOn={0} if a calendar ever needs Sunday.
      weekStartsOn={weekStartsOn}
      className={cn("p-3", className)}
      classNames={{
        root: cn("w-fit", defaults.root),
        months: "relative flex flex-col gap-4 sm:flex-row",
        month: "flex w-full flex-col gap-4",
        month_caption: "relative flex h-9 items-center justify-center",
        caption_label: "flex items-center gap-1 text-sm font-medium",
        // Month/year dropdown navigation (captionLayout="dropdown").
        dropdowns: "flex items-center justify-center gap-1.5 text-sm font-medium",
        dropdown_root:
          "relative inline-flex items-center rounded-md px-1.5 py-1 hover:bg-accent has-[:focus-visible]:outline-none has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring",
        dropdown: "absolute inset-0 z-10 cursor-pointer opacity-0",
        nav: "absolute inset-x-0 top-0 flex items-center justify-between",
        button_previous: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-9 text-muted-foreground hover:text-foreground"
        ),
        button_next: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-9 text-muted-foreground hover:text-foreground"
        ),
        month_grid: "w-full border-collapse",
        weekdays: "flex",
        weekday: "w-9 rounded-md text-xs font-normal text-muted-foreground",
        week: "mt-1 flex w-full",
        day: "relative size-9 p-0 text-center text-sm focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost", size: "icon" }),
          "size-9 rounded-md p-0 font-normal"
        ),
        today: "[&>button]:font-semibold [&>button]:text-primary",
        selected:
          "rounded-md [&>button]:bg-primary [&>button]:text-primary-foreground [&>button:hover]:bg-primary [&>button:hover]:text-primary-foreground",
        outside: "text-muted-foreground/50",
        disabled: "text-muted-foreground opacity-50",
        hidden: "invisible",
        range_start:
          "rounded-l-md bg-accent [&>button]:bg-primary [&>button]:text-primary-foreground",
        range_middle:
          "rounded-none bg-accent [&>button]:bg-transparent [&>button]:text-accent-foreground [&>button:hover]:bg-transparent",
        range_end:
          "rounded-r-md bg-accent [&>button]:bg-primary [&>button]:text-primary-foreground",
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, className: chevronClassName, ...chevronProps }) => {
          const Icon =
            orientation === "left"
              ? ChevronLeft
              : orientation === "right"
                ? ChevronRight
                : orientation === "up"
                  ? ChevronUp
                  : ChevronDown;
          return <Icon className={cn("size-4", chevronClassName)} {...chevronProps} />;
        },
      }}
      {...props}
    />
  );
}
