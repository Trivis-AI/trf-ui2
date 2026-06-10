// @trf/ui2 — public API barrel.
// Consumed as raw .tsx via `github:triiberg/trf-ui2#master` (no build step).
// NOTE: this barrel is required because trf-ui2 is consumed as a package.

// Utils
export { cn } from "./lib/utils";

// --- Brand ---
export { Logo } from "./components/logo";
export type { LogoProps } from "./components/logo";

// --- App shell & sidebar ---
export {
  AppShell,
  Sidebar,
  SidebarProvider,
  SidebarHeader,
  SidebarContent,
  SidebarFooter,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from "./components/sidebar";
export type {
  AppShellProps,
  SidebarProviderProps,
  SidebarMenuButtonProps,
} from "./components/sidebar";

// --- Typography ---
export { H1, H2, H3, Text } from "./components/typography";
export type { HeadingProps, TextProps } from "./components/typography";

// --- Layout & page scaffolding ---
export { Stack } from "./components/stack";
export type { StackProps } from "./components/stack";
export { Row, Grow } from "./components/row";
export type { RowProps } from "./components/row";
export { Page, PageHeader } from "./components/page";
export type { PageProps, PageSize, PageHeaderProps } from "./components/page";

// Primitives
export { Button, buttonVariants } from "./components/ui/button";
export type { ButtonProps, ButtonVariant, ButtonSize } from "./components/ui/button";

export { Badge, badgeVariants } from "./components/ui/badge";
export type { BadgeProps, BadgeVariant } from "./components/ui/badge";

export { StatusBadge, statusVariants } from "./components/ui/status-badge";
export type { StatusBadgeProps, StatusTone } from "./components/ui/status-badge";

export { Input } from "./components/ui/input";
export type { InputProps } from "./components/ui/input";

export { Textarea } from "./components/ui/textarea";
export type { TextareaProps } from "./components/ui/textarea";

export { Label } from "./components/ui/label";

export { Field } from "./components/ui/field";
export type { FieldProps } from "./components/ui/field";

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "./components/ui/card";

export { TableCard } from "./components/ui/table-card";
export type { TableCardProps } from "./components/ui/table-card";

export { RadioCard } from "./components/ui/radio-card";
export type { RadioCardProps } from "./components/ui/radio-card";

export { Spinner } from "./components/ui/spinner";
export type { SpinnerProps, SpinnerSize } from "./components/ui/spinner";

export { Separator } from "./components/ui/separator";

export {
  Dialog,
  DialogTrigger,
  DialogClose,
  DialogPortal,
  DialogOverlay,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogDescription,
} from "./components/ui/dialog";

// --- Phase 2: forms & feedback ---

export { Checkbox } from "./components/ui/checkbox";
export { Switch } from "./components/ui/switch";
export { RadioGroup, RadioGroupItem } from "./components/ui/radio-group";

export {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "./components/ui/tooltip";

export {
  Select,
  SelectGroup,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectLabel,
  SelectItem,
  SelectSeparator,
} from "./components/ui/select";

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuGroup,
  DropdownMenuPortal,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuRadioGroup,
} from "./components/ui/dropdown-menu";

export { Tabs, TabsList, TabsTrigger, TabsContent } from "./components/ui/tabs";

export { Popover, PopoverTrigger, PopoverContent, PopoverAnchor } from "./components/ui/popover";

export {
  Command,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "./components/ui/command";

export { Combobox } from "./components/combobox";
export type { ComboboxProps, ComboboxOption } from "./components/combobox";

export { AsyncCombobox } from "./components/async-combobox";
export type { AsyncComboboxProps } from "./components/async-combobox";

export { Calendar } from "./components/ui/calendar";
export type { CalendarProps } from "./components/ui/calendar";

export { DatePicker } from "./components/date-picker";
export type {
  DatePickerProps,
  SingleDatePickerProps,
  RangeDatePickerProps,
  DateRange,
  Matcher,
} from "./components/date-picker";

export { MonthPicker } from "./components/month-picker";
export type { MonthPickerProps } from "./components/month-picker";

export { Alert, AlertTitle, AlertDescription, alertVariants } from "./components/ui/alert";
export type { AlertProps, AlertVariant } from "./components/ui/alert";

export { ConfirmDialog, useConfirm } from "./components/ui/confirm-dialog";
export type { ConfirmDialogProps, ConfirmOptions } from "./components/ui/confirm-dialog";

export { InfoGrid, InfoField } from "./components/info-grid";
export type { InfoGridProps, InfoFieldProps } from "./components/info-grid";

export { EmptyState } from "./components/empty-state";
export type { EmptyStateProps } from "./components/empty-state";

export { LoadingState } from "./components/loading-state";
export type { LoadingStateProps } from "./components/loading-state";

export { Skeleton } from "./components/ui/skeleton";

// --- Tables ---

// Low-level primitives (dependency-free) — for simple/static tables.
export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./components/ui/table";

// TanStack-powered DataTable — sort, filter, column reorder, inline edit.
export { DataTable } from "./components/data-table";
export type { DataTableProps } from "./components/data-table";
// Re-exported so apps type their columns without importing @tanstack/react-table directly.
// (TanStack's `Row` is aliased to avoid colliding with the layout `Row` component.)
export type { ColumnDef, CellContext, Row as DataTableRow } from "@tanstack/react-table";
