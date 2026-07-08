import { cn } from "../../../lib/utils";
import { type StatusTone } from "../../ui/status-badge";
import { StatusCell } from "./status-cell";

// Canonical sell-invoice lifecycle status. One place maps the raw backend fields
// (document status + payment status + due date) to a labeled, toned pill, so every
// invoice list, detail header, and dashboard renders the exact same states. Never
// re-derive this per page (see docs/08-ui-components/server-data-table.md).

export interface InvoiceStatusInput {
  /** The document status: "draft" | "confirmed" | "cancelled" | "credited" | ... */
  status: string;
  /** Payment status when the document is confirmed/active: "paid" | "partial" | "unpaid". */
  paymentStatus?: string | null;
  /** Due date, used only to flag an unpaid confirmed invoice as overdue. */
  dueDate?: string | Date | null;
  /** Injectable "today" for testing; defaults to the current date. */
  now?: Date;
}

export interface InvoiceStatusCellProps extends InvoiceStatusInput {
  className?: string;
}

// Parse to a date, treating a bare "YYYY-MM-DD" as a LOCAL date so it never shifts a
// day the way new Date("YYYY-MM-DD") (parsed as UTC midnight) would.
function toDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === "") return null;
  if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (m) {
    const local = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
    return Number.isNaN(local.getTime()) ? null : local;
  }
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

// Compare date-only (midnight-local) so an invoice is overdue the day after its due
// date, not the moment the clock passes the due date's time.
function startOfDay(d: Date): number {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}

/**
 * The single invoice-lifecycle state machine. Maps raw backend fields to a stable
 * `{ key, label, tone }`. Use this everywhere an invoice status is shown.
 */
export function deriveInvoiceStatus(
  input: InvoiceStatusInput,
): { key: string; label: string; tone: StatusTone } {
  const { status, paymentStatus, dueDate, now } = input;

  if (status === "draft") return { key: "draft", label: "Draft", tone: "neutral" };
  if (status === "cancelled") return { key: "cancelled", label: "Cancelled", tone: "error" };
  if (status === "credited") return { key: "credited", label: "Credited", tone: "warning" };

  // Confirmed / active: resolve by payment status.
  if (status === "confirmed" || status === "active") {
    if (paymentStatus === "paid") return { key: "paid", label: "Paid", tone: "success" };
    if (paymentStatus === "partial") {
      return { key: "partial", label: "Partial", tone: "warning" };
    }
    // Unpaid or missing payment status: overdue if the due date has passed.
    const due = toDate(dueDate);
    if (due && startOfDay(due) < startOfDay(now ?? new Date())) {
      return { key: "overdue", label: "Overdue", tone: "error" };
    }
    return { key: "awaiting", label: "Unpaid", tone: "info" };
  }

  // Unknown status: surface it verbatim rather than swallowing it.
  return { key: status, label: status, tone: "neutral" };
}

/**
 * Filterable invoice statuses, for a status filter dropdown. This is the companion
 * to `deriveInvoiceStatus`: the derive function renders the display state, these map
 * a chosen filter value to the backend query params (and back).
 *
 * NOTE: "Overdue" is intentionally NOT a filter option. The backend has no due-date
 * filter yet, so there is no way to query for overdue rows specifically; "Unpaid"
 * returns overdue rows too (they are confirmed + unpaid).
 */
export const INVOICE_STATUS_FILTER_OPTIONS: { value: string; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "unpaid", label: "Unpaid" },
  { value: "partial", label: "Partial" },
  { value: "paid", label: "Paid" },
  { value: "cancelled", label: "Cancelled" },
  { value: "credited", label: "Credited" },
];

/**
 * Maps a status-filter value (see `INVOICE_STATUS_FILTER_OPTIONS`) to the backend
 * query params `{ status, payment_status }`. An unknown/empty value clears both.
 */
export function invoiceStatusFilterToParams(
  value: string,
): { status: string; payment_status: string } {
  switch (value) {
    case "draft":
      return { status: "draft", payment_status: "" };
    case "cancelled":
      return { status: "cancelled", payment_status: "" };
    case "credited":
      return { status: "credited", payment_status: "" };
    case "paid":
      return { status: "confirmed", payment_status: "paid" };
    case "partial":
      return { status: "confirmed", payment_status: "partial" };
    case "unpaid":
      return { status: "confirmed", payment_status: "unpaid" };
    default:
      return { status: "", payment_status: "" };
  }
}

/**
 * Reverse of `invoiceStatusFilterToParams`: given the backend params, return the
 * matching filter value, or "" if none match (e.g. status=confirmed with no
 * payment_status, which is not a selectable filter option).
 */
export function invoiceStatusFilterFromParams(
  p: { status?: string; payment_status?: string },
): string {
  const status = p.status ?? "";
  const paymentStatus = p.payment_status ?? "";
  const match = INVOICE_STATUS_FILTER_OPTIONS.find((opt) => {
    const params = invoiceStatusFilterToParams(opt.value);
    return params.status === status && params.payment_status === paymentStatus;
  });
  return match ? match.value : "";
}

/**
 * Renders the derived invoice status as a `StatusCell` pill. Drop into a status
 * column's `cell` (or an invoice detail header) instead of mapping status to a tone
 * by hand.
 */
export function InvoiceStatusCell({ className, ...input }: InvoiceStatusCellProps) {
  const s = deriveInvoiceStatus(input);
  return <StatusCell tone={s.tone} label={s.label} className={cn("capitalize", className)} />;
}
