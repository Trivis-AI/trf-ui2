// An in-memory mock server for the ServerDataTable kitchen-sink section.
//
// It generates ~5000 deterministic invoice-like rows and answers queryTable()
// with a server-shaped result (a page of rows + total count + page count) after a
// tunable artificial delay, so the demo can show the header loading line, the cold
// skeleton, and cached-first revalidation. Everything is derived from the row
// index: no Math.random and no Date.now, so the data is identical on every reload.

export type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue" | "Cancelled";
export type PaymentMethod = "Wire" | "Cash" | "Card" | "Direct debit";

export interface InvoiceRow {
  id: string;
  number: string;
  supplier: string;
  supplierReg: string;
  date: string; // ISO yyyy-mm-dd
  status: InvoiceStatus;
  method: PaymentMethod;
  /** Numeric so the server can sort it; the cell formats it for display. */
  totalGross: number;
  /** Outstanding amount; 0 when fully settled (Paid / Draft / Cancelled). */
  payable: number;
}

export interface TableQueryInput {
  pageIndex: number;
  pageSize: number;
  sorting: { id: string; desc: boolean }[];
  search: string;
  /** Exact-match filters keyed by column id (e.g. { status: "Paid" }). */
  filters: Record<string, string>;
}

export interface TableQueryResult {
  rows: InvoiceRow[];
  /** Total rows matching the filter/search, for the "N total" footer. */
  rowCount: number;
  /** Total pages, for "Page X of Y". */
  pageCount: number;
}

/** Default artificial latency, tunable per call via queryTable's second argument. */
export const DEFAULT_DELAY_MS = 600;

const ROW_COUNT = 5000;

const SUPPLIERS = [
  "100 Meedia Brändi OÜ", "Triiberg AS", "Foam Labs OÜ", "Northwind OÜ",
  "Põhjala Logistika AS", "Sinilill Kohvik OÜ", "Estkapital Invest AS", "Kalev & Pojad OÜ",
  "Saaremaa Vill OÜ", "Sakala Puit AS", "Tallinn Digital OÜ", "Baltic Freight AS",
  "Nordic Steel OÜ", "Viru Elekter AS", "Emajõe Ehitus OÜ", "Pärnu Kalatööstus AS",
  "Tartu Tarkvara OÜ", "Harju Kinnisvara AS", "Lõuna Logistika OÜ", "Koidula Kaubad AS",
];

const STATUSES: InvoiceStatus[] = ["Draft", "Sent", "Paid", "Overdue", "Cancelled"];
const METHODS: PaymentMethod[] = ["Wire", "Cash", "Card", "Direct debit"];

// A fixed reference date (not Date.now) so generated dates are stable.
const BASE_DATE = Date.UTC(2026, 6, 8); // 2026-07-08
const DAY_MS = 86_400_000;

// mulberry32: a small, fast, deterministic PRNG seeded per row. Uses only Math.imul
// (no Math.random), so each row's values are fully reproducible from its index.
function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function generateRow(i: number): InvoiceRow {
  const rand = mulberry32(Math.imul(i + 1, 2654435761));
  const supplierIndex = Math.floor(rand() * SUPPLIERS.length);
  const status = STATUSES[Math.floor(rand() * STATUSES.length)];
  const method = METHODS[Math.floor(rand() * METHODS.length)];
  const dayOffset = Math.floor(rand() * 730); // spread over ~2 years back from BASE_DATE
  const totalGross = Math.round((1000 + rand() * 1_998_000)) / 100; // 10.00 .. ~19 990.00

  const settled = status === "Paid" || status === "Draft" || status === "Cancelled";
  const partial = status === "Sent" && rand() > 0.6;
  const payable = settled ? 0 : partial ? Math.round(totalGross * 60) / 100 : totalGross;

  const date = new Date(BASE_DATE - dayOffset * DAY_MS).toISOString().slice(0, 10);

  return {
    id: String(i),
    number: `INV-${100000 + i}`,
    supplier: SUPPLIERS[supplierIndex],
    supplierReg: String(10_000_000 + supplierIndex * 111_113),
    date,
    status,
    method,
    totalGross,
    payable,
  };
}

// Build the full dataset once at module load. 5000 rows is cheap and keeps every
// query answering from the same fixed in-memory table.
const ALL_ROWS: InvoiceRow[] = Array.from({ length: ROW_COUNT }, (_, i) => generateRow(i));

function matchesSearch(row: InvoiceRow, search: string): boolean {
  if (!search) return true;
  const q = search.trim().toLowerCase();
  return (
    row.number.toLowerCase().includes(q) ||
    row.supplier.toLowerCase().includes(q)
  );
}

// Read a row field by column id (columns map 1:1 to row keys here).
function field(row: InvoiceRow, id: string): unknown {
  return (row as unknown as Record<string, unknown>)[id];
}

function matchesFilters(row: InvoiceRow, filters: Record<string, string>): boolean {
  for (const [key, value] of Object.entries(filters)) {
    if (!value) continue;
    if (String(field(row, key)) !== value) return false;
  }
  return true;
}

function compare(a: InvoiceRow, b: InvoiceRow, id: string): number {
  const av = field(a, id);
  const bv = field(b, id);
  if (typeof av === "number" && typeof bv === "number") return av - bv;
  return String(av).localeCompare(String(bv));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Filters, sorts, and paginates the in-memory table, then resolves after an
 * artificial delay. This is the single seam the real app swaps for a fetch against
 * the TRF API (or Supabase): only this function changes, not the table wiring.
 */
export async function queryTable(
  input: TableQueryInput,
  opts: { delayMs?: number } = {}
): Promise<TableQueryResult> {
  const { pageIndex, pageSize, sorting, search, filters } = input;

  let rows = ALL_ROWS.filter(
    (row) => matchesSearch(row, search) && matchesFilters(row, filters)
  );

  const sort = sorting[0];
  if (sort) {
    rows = [...rows].sort((a, b) => {
      const cmp = compare(a, b, sort.id);
      return sort.desc ? -cmp : cmp;
    });
  }

  const rowCount = rows.length;
  const pageCount = Math.max(1, Math.ceil(rowCount / pageSize));
  const start = pageIndex * pageSize;
  const page = rows.slice(start, start + pageSize);

  await sleep(opts.delayMs ?? DEFAULT_DELAY_MS);

  return { rows: page, rowCount, pageCount };
}

// Exported so the demo can drive filter dropdowns from the same source of truth.
export const STATUS_OPTIONS = STATUSES;
export const METHOD_OPTIONS = METHODS;
