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
 * Renders the derived invoice status as a `StatusCell` pill. Drop into a status
 * column's `cell` (or an invoice detail header) instead of mapping status to a tone
 * by hand.
 */
export function InvoiceStatusCell({ className, ...input }: InvoiceStatusCellProps) {
  const s = deriveInvoiceStatus(input);
  return <StatusCell tone={s.tone} label={s.label} className={cn("capitalize", className)} />;
}
