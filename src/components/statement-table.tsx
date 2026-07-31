import * as React from "react";
import { cn } from "../lib/utils";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "./ui/table";

export interface StatementRow {
  /** `header` spans the table; `total` rows are emphasised; `line` is a regular figure row. */
  type: "header" | "line" | "total";
  label: React.ReactNode;
  /** Nesting depth 0–3 (deeper clamps to 3). */
  indent?: number;
  /** One entry per value column. Ignored for `header` rows. */
  values?: Array<string | number | null | undefined>;
  /**
   * When true and `onDrill` is set, this row's figures become clickable — the
   * statement's own opt-in, since only the caller knows which rows resolve to
   * an account set (header, total and computed rows do not).
   */
  drillable?: boolean;
}

export interface StatementTableProps {
  rows: StatementRow[];
  /** Header for the label column. */
  labelHeader: React.ReactNode;
  /** Headers for the figure columns (e.g. current period, prior period). */
  valueHeaders: React.ReactNode[];
  /**
   * Figure formatter. Default: locale number with no decimals; zero/empty/non-numeric → "—".
   * Override for currency, decimals, or a fixed locale.
   */
  formatValue?: (value: string | number | null | undefined) => string;
  /**
   * Opens the detail behind one figure. Receives the row index and the column
   * index, because a figure is only identified by both: on a multi-period
   * statement each column is a different date or period.
   *
   * Rows must also set `drillable`. Without this prop the table renders exactly
   * as before, so existing callers are unaffected.
   */
  onDrill?: (rowIndex: number, colIndex: number) => void;
  className?: string;
}

// Map indent depth → on-scale left padding. Statement nesting rarely exceeds 3.
const INDENT: Record<number, string> = { 0: "pl-4", 1: "pl-8", 2: "pl-12", 3: "pl-16" };
const indentClass = (n = 0): string => INDENT[n] ?? "pl-16";

const defaultFormat = (v: string | number | null | undefined): string => {
  const n = Number(v);
  if (v == null || v === "" || !Number.isFinite(n) || n === 0) return "—";
  return n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
};

/**
 * Financial statement renderer (balance sheet / income statement): rows carry a `type`
 * (header / line / total) and an `indent` depth. Header rows span the table, total rows are
 * emphasised, and figures are right-aligned monospace with tabular figures. Graduated from
 * trffrontreports' FinancialStatementTable.
 */
export function StatementTable({
  rows,
  labelHeader,
  valueHeaders,
  formatValue = defaultFormat,
  onDrill,
  className,
}: StatementTableProps) {
  const colCount = 1 + valueHeaders.length;
  return (
    <Table className={className}>
      <TableHeader>
        <TableRow>
          <TableHead className="w-3/5">{labelHeader}</TableHead>
          {valueHeaders.map((h, i) => (
            <TableHead key={i} className="text-right">
              {h}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row, i) => {
          if (row.type === "header") {
            return (
              <TableRow key={i} className="bg-muted/40 hover:bg-muted/40">
                <TableCell
                  colSpan={colCount}
                  className={cn(
                    "text-xs font-semibold uppercase tracking-wide text-muted-foreground",
                    indentClass(row.indent)
                  )}
                >
                  {row.label}
                </TableCell>
              </TableRow>
            );
          }
          const isTotal = row.type === "total";
          return (
            <TableRow key={i} className={cn(isTotal && "font-medium")}>
              <TableCell
                className={cn(
                  indentClass(row.indent),
                  isTotal ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {row.label}
              </TableCell>
              {valueHeaders.map((_, col) => {
                const canDrill = Boolean(onDrill && row.drillable);
                return (
                  <TableCell
                    key={col}
                    className={cn(
                      "text-right font-mono tabular-nums",
                      canDrill && "cursor-pointer hover:underline"
                    )}
                    role={canDrill ? "button" : undefined}
                    tabIndex={canDrill ? 0 : undefined}
                    onClick={canDrill ? () => onDrill!(i, col) : undefined}
                    onKeyDown={
                      canDrill
                        ? (e) => {
                            if (e.key === "Enter" || e.key === " ") {
                              e.preventDefault();
                              onDrill!(i, col);
                            }
                          }
                        : undefined
                    }
                  >
                    {formatValue(row.values?.[col])}
                  </TableCell>
                );
              })}
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}
