// Standard table cell renderers. Small helpers used inside ColumnDef.cell so the
// same content type (status, money, dates, ...) looks identical on every page.
// See docs/PLAN-server-data-table.md section 4.7.
//
// This barrel is re-exported from src/components/table/index.ts and, in turn, the
// package root (src/index.ts, owned by the Integrate phase).

export { StatusCell } from "./status-cell";
export type { StatusCellProps } from "./status-cell";

export {
  deriveInvoiceStatus,
  InvoiceStatusCell,
  INVOICE_STATUS_FILTER_OPTIONS,
  invoiceStatusFilterToParams,
  invoiceStatusFilterFromParams,
} from "./invoice-status";
export type { InvoiceStatusInput, InvoiceStatusCellProps } from "./invoice-status";

export { MoneyCell } from "./money-cell";
export type { MoneyCellProps } from "./money-cell";

export { MonoCell } from "./mono-cell";
export type { MonoCellProps } from "./mono-cell";

export { DateCell } from "./date-cell";
export type { DateCellProps, DateCellVariant } from "./date-cell";

export { TextCell } from "./text-cell";
export type { TextCellProps } from "./text-cell";

export { IconCell } from "./icon-cell";
export type { IconCellProps } from "./icon-cell";

export { BooleanCell } from "./boolean-cell";
export type { BooleanCellProps, BooleanCellVariant } from "./boolean-cell";

export { MeterCell } from "./meter-cell";
export type { MeterCellProps, MeterTone } from "./meter-cell";

export { BadgeListCell } from "./badge-list-cell";
export type { BadgeListCellProps, BadgeListItem } from "./badge-list-cell";

export { LinkCell } from "./link-cell";
export type { LinkCellProps } from "./link-cell";

export { ActionsCell } from "./actions-cell";
export type { ActionsCellProps, ActionItem } from "./actions-cell";

export { AvatarCell } from "./avatar-cell";
export type { AvatarCellProps } from "./avatar-cell";

export { ThumbnailCell } from "./thumbnail-cell";
export type { ThumbnailCellProps } from "./thumbnail-cell";

export { CellHoverCard, AmountBreakdown } from "./hover-card-seam";
export type {
  HoverCardSeamProps,
  AmountBreakdownProps,
  AmountBreakdownRow,
} from "./hover-card-seam";
