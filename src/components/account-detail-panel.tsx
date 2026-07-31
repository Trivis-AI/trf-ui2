import * as React from "react";
import { ExternalLink } from "lucide-react";
import {
  FloatingWindow,
  FloatingWindowContent,
  FloatingWindowHeader,
  FloatingWindowTitle,
} from "./ui/floating-window";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { EmptyState } from "./empty-state";
import { LoadingState } from "./loading-state";
import { Text } from "./typography";

/** Which figure on the source row was clicked — it decides which lines make it up. */
export type AccountDetailColumn = "opening" | "turnover" | "closing";

/** One posted journal line, as returned by backledger GET /v1/reports/account-detail. */
export interface AccountDetailRow {
  line_id: string;
  entry_id: string;
  entry_number: string;
  entry_date: string;
  description: string;
  line_description?: string;
  reference?: string;
  account_id: string;
  account_code: string;
  account_name: string;
  debit: string;
  credit: string;
  running_balance: string;
  source_type?: string;
  source_service?: string;
  source_id?: string;
}

/** Computed over the full match set, never the returned page. */
export interface AccountDetailSummary {
  opening: string;
  turnover_debit: string;
  turnover_credit: string;
  closing: string;
  total_rows: number;
}

export interface AccountDetailResponse {
  from: string;
  to: string;
  rows: AccountDetailRow[];
  summary: AccountDetailSummary;
  page: number;
  page_size: number;
  total_pages: number;
}

/** What the panel is drilling into. */
export interface AccountDetailTarget {
  /** Heading: the account code, statement line label, or account range. */
  title: string;
  /** Secondary heading, e.g. the account name. */
  subtitle?: string;
  /** Selects by account id (one account) or by codes (a statement line). One or the other. */
  accountIds?: string[];
  accountCodes?: string[];
  column: AccountDetailColumn;
  /**
   * The figure this was opened from, for the reconciliation strip, in whichever
   * form the source report states it:
   *
   *   {debit, credit} — a turnover sheet, which gives both sides separately
   *   {balance}       — an accumulated position (opening/closing, balance sheet)
   *   {net}           — a period movement stated as one number (income statement)
   *
   * All debit-positive. Statement lines are presented flipped for liabilities,
   * equity and revenue, so pass the figure ALREADY converted — the panel never
   * has to know about taxonomy signs.
   */
  expected?: { debit: string; credit: string } | { balance: string } | { net: string };
}

export interface AccountDetailPanelProps {
  /** null closes the panel. */
  target: AccountDetailTarget | null;
  onClose: () => void;
  /** Period the source report was rendered for (ISO YYYY-MM-DD). */
  from: string;
  to: string;
  /**
   * Fetches one page. Injected so this component carries no dependency on any
   * app's service layer or auth handling — every consumer already has both.
   */
  fetchDetail: (params: {
    from: string;
    to: string;
    accountIds?: string[];
    accountCodes?: string[];
    page: number;
    pageSize: number;
  }) => Promise<AccountDetailResponse>;
  /**
   * Builds a link to the document an entry came from, or null when there is
   * none to open. The apps own this: the documents live on their sibling
   * subdomains, and only the app knows the org slug.
   */
  sourceHref?: (row: AccountDetailRow) => { href: string; label: string } | null;
  /** Called when a fetch fails, so the app can toast in its own house style. */
  onError?: (error: unknown) => void;
  /** Locale for figure formatting. Defaults to the browser's. */
  locale?: string;
  pageSize?: number;
  /** Override UI strings (i18n). */
  labels?: Partial<{
    opening: string;
    turnover: string;
    closing: string;
    upToAndIncluding: string;
    lines: string;
    matches: string;
    doesNotMatch: string;
    report: string;
    date: string;
    entry: string;
    description: string;
    document: string;
    debit: string;
    credit: string;
    balance: string;
    totalAllPages: string;
    noLines: string;
    prev: string;
    next: string;
    page: (page: number, totalPages: number) => string;
  }>;
}

const num = (v: string | undefined): number => {
  const n = parseFloat(v ?? "0");
  return Number.isFinite(n) ? n : 0;
};

// Two amounts agree when they round to the same cent. Comparing floats directly
// trips on binary representation, and the ledger stores decimal(20,2) anyway.
const sameCent = (a: number, b: number): boolean =>
  Math.round(a * 100) === Math.round(b * 100);

/** The day before an ISO date, so "just before the period" is exact. */
const dayBefore = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
};

/**
 * Far enough back to predate any books. An opening balance is made of every line
 * before the period, so there is no natural lower bound — and the endpoint needs
 * a range.
 */
const BOOKS_START = "1900-01-01";

/**
 * Which lines make up the clicked figure.
 *
 * An opening or closing balance accumulates everything posted BEFORE or UP TO the
 * period, so asking for the period's own range returns nothing — which is exactly
 * what an empty panel over a non-zero balance means if you get this wrong.
 */
export const accountDetailRange = (
  column: AccountDetailColumn,
  from: string,
  to: string,
): { from: string; to: string } => {
  switch (column) {
    case "opening":
      return { from: BOOKS_START, to: dayBefore(from) };
    case "closing":
      return { from: BOOKS_START, to };
    default:
      return { from, to };
  }
};

/**
 * The journal lines behind an aggregated figure, opened from the figure itself.
 *
 * Runs on backledger GET /v1/reports/account-detail, which pages the rows but
 * computes its summary over the FULL match set. That split is what keeps the
 * reconciliation strip honest: the totals it checks are the server's, over every
 * matching line, not a sum of whatever page is on screen.
 *
 * A drill-down whose total disagrees with the figure it was opened from is worse
 * than no drill-down, so this says so out loud rather than letting it pass.
 */
export function AccountDetailPanel({
  target,
  onClose,
  from,
  to,
  fetchDetail,
  sourceHref,
  onError,
  locale,
  pageSize = 100,
  labels,
}: AccountDetailPanelProps) {
  const L = {
    opening: "Opening balance",
    turnover: "Turnover",
    closing: "Closing balance",
    upToAndIncluding: "up to and including",
    lines: "lines",
    matches: "Matches the report figure",
    doesNotMatch: "Does NOT match the report figure",
    report: "report",
    date: "Date",
    entry: "Entry",
    description: "Description",
    document: "Doc",
    debit: "Debit",
    credit: "Credit",
    balance: "Balance",
    totalAllPages: "Total (all pages)",
    noLines: "No journal lines in this period.",
    prev: "Previous",
    next: "Next",
    page: (p: number, t: number) => `Page ${p} / ${t}`,
    ...labels,
  };

  const fmt = React.useCallback(
    (n: number): string =>
      n.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
    [locale],
  );

  const [data, setData] = React.useState<AccountDetailResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [page, setPage] = React.useState(1);

  const column = target?.column ?? "turnover";
  const range = React.useMemo(
    () => accountDetailRange(column, from, to),
    [column, from, to],
  );

  // Identity of what is being drilled, as a stable dependency.
  const selector = target
    ? `${(target.accountIds ?? []).join(",")}|${(target.accountCodes ?? []).join(",")}`
    : "";

  // A different account, figure or period is a different question — back to page 1.
  React.useEffect(() => {
    setPage(1);
  }, [selector, column, from, to]);

  React.useEffect(() => {
    if (!target) {
      setData(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    fetchDetail({
      from: range.from,
      to: range.to,
      accountIds: target.accountIds,
      accountCodes: target.accountCodes,
      page,
      pageSize,
    })
      .then((res) => {
        if (cancelled) return;
        setData(res);
      })
      .catch((err) => {
        if (cancelled) return;
        onError?.(err);
        onClose();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // onClose/fetchDetail are fresh closures each render; depending on them refetches forever.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selector, range.from, range.to, page, pageSize]);

  const rows = data?.rows ?? null;
  const summary = data?.summary;

  /**
   * What the clicked figure claims, against what the lines say.
   *
   * Turnover is checked per side. Opening and closing are one signed
   * debit-positive balance, compared against the summary's closing figure at the
   * end of the queried range. A net figure is compared against the movement
   * within the range only.
   */
  const reconciliation = React.useMemo(() => {
    const expected = target?.expected;
    if (!summary || !expected) return null;
    if ("balance" in expected) {
      return {
        ok: sameCent(num(summary.closing), num(expected.balance)),
        text: fmt(num(expected.balance)),
      };
    }
    if ("net" in expected) {
      // Movement within the range, so opening is deliberately excluded — an
      // income-statement line is a flow, not a position.
      const movement = num(summary.turnover_debit) - num(summary.turnover_credit);
      return { ok: sameCent(movement, num(expected.net)), text: fmt(num(expected.net)) };
    }
    return {
      ok:
        sameCent(num(summary.turnover_debit), num(expected.debit)) &&
        sameCent(num(summary.turnover_credit), num(expected.credit)),
      text: `${fmt(num(expected.debit))} / ${fmt(num(expected.credit))}`,
    };
  }, [summary, target, fmt]);

  const columnLabel =
    column === "opening" ? L.opening : column === "closing" ? L.closing : L.turnover;
  const totalPages = data?.total_pages ?? 0;

  return (
    <FloatingWindow open={target !== null} onOpenChange={(o) => { if (!o) onClose(); }}>
      <FloatingWindowContent className="flex max-h-[80vh] w-[46rem] max-w-[95vw] flex-col gap-4 overflow-hidden">
        <FloatingWindowHeader>
          <FloatingWindowTitle>
            <span className="mr-2 font-mono text-sm text-muted-foreground">{target?.title}</span>
            {target?.subtitle}
          </FloatingWindowTitle>
          <Text size="xs" tone="muted">
            {columnLabel} ·{" "}
            {column === "turnover"
              ? `${range.from} – ${range.to}`
              // "Everything up to X" is the honest description of an accumulated
              // balance; printing 1900 as a start date just looks like a bug.
              : `${L.upToAndIncluding} ${range.to}`}
            {summary ? ` · ${summary.total_rows} ${L.lines}` : ""}
          </Text>
        </FloatingWindowHeader>

        {loading && <LoadingState />}

        {!loading && rows && rows.length === 0 && <EmptyState title={L.noLines} />}

        {!loading && rows && rows.length > 0 && (
          <>
            {reconciliation && (
              <Badge
                variant={reconciliation.ok ? "secondary" : "destructive"}
                className="w-fit font-normal"
              >
                {reconciliation.ok
                  ? L.matches
                  : `${L.doesNotMatch} — ${L.report} ${reconciliation.text}`}
              </Badge>
            )}

            <div className="min-h-0 flex-1 overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 z-10 bg-background">
                  <TableRow>
                    <TableHead className="w-24">{L.date}</TableHead>
                    <TableHead className="w-24">{L.entry}</TableHead>
                    <TableHead>{L.description}</TableHead>
                    {sourceHref && <TableHead className="w-10 text-center">{L.document}</TableHead>}
                    <TableHead className="w-28 text-right">{L.debit}</TableHead>
                    <TableHead className="w-28 text-right">{L.credit}</TableHead>
                    <TableHead className="w-28 text-right">{L.balance}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.map((row) => {
                    const doc = sourceHref?.(row) ?? null;
                    return (
                      <TableRow key={row.line_id}>
                        <TableCell className="whitespace-nowrap text-muted-foreground">
                          {row.entry_date.slice(0, 10)}
                        </TableCell>
                        <TableCell className="whitespace-nowrap font-mono text-xs">
                          {row.entry_number}
                        </TableCell>
                        <TableCell
                          className="max-w-[16rem] truncate"
                          title={row.description || row.line_description || row.reference}
                        >
                          {row.description || row.line_description || (
                            <span className="text-muted-foreground/40">—</span>
                          )}
                          {/* The account is only ambiguous when a line selects several. */}
                          {(target?.accountCodes?.length ?? 0) > 1 && (
                            <span className="ml-1.5 font-mono text-xs text-muted-foreground">
                              {row.account_code}
                            </span>
                          )}
                        </TableCell>
                        {sourceHref && (
                          <TableCell className="text-center">
                            {/* New tab, deliberately: this is a checking tool, and
                                navigating away would drop the report behind it. */}
                            {doc && (
                              <a
                                href={doc.href}
                                target="_blank"
                                rel="noopener noreferrer"
                                title={doc.label}
                                aria-label={doc.label}
                                className="inline-flex text-muted-foreground hover:text-foreground"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            )}
                          </TableCell>
                        )}
                        <TableCell className="text-right tabular-nums">
                          {num(row.debit) ? fmt(num(row.debit)) : <span className="text-muted-foreground/40">—</span>}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">
                          {num(row.credit) ? fmt(num(row.credit)) : <span className="text-muted-foreground/40">—</span>}
                        </TableCell>
                        {/* Server-computed: cumulative over the whole match set, so it
                            stays continuous across pages instead of restarting. */}
                        <TableCell className="text-right tabular-nums text-muted-foreground">
                          {fmt(num(row.running_balance))}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell
                      colSpan={sourceHref ? 4 : 3}
                      className="text-right text-xs font-semibold text-muted-foreground"
                    >
                      {/* Labelled as the full-range total, because with paging on it is
                          no longer the sum of the rows above it. */}
                      {L.totalAllPages}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {fmt(num(summary?.turnover_debit))}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {fmt(num(summary?.turnover_credit))}
                    </TableCell>
                    <TableCell className="text-right font-semibold tabular-nums">
                      {fmt(num(summary?.closing))}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-3">
                <Text size="xs" tone="muted">{L.page(data?.page ?? 1, totalPages)}</Text>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={loading || (data?.page ?? 1) <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                >
                  {L.prev}
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={loading || (data?.page ?? 1) >= totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {L.next}
                </Button>
              </div>
            )}
          </>
        )}
      </FloatingWindowContent>
    </FloatingWindow>
  );
}
