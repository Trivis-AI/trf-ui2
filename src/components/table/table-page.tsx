import * as React from "react";
import { cn } from "../../lib/utils";
import { Page, type PageSize } from "../page";
import { H1 } from "../typography";
import { TableSearch, TablePagination } from "./table-toolbar";

export interface TablePageProps {
  title: React.ReactNode;
  description?: React.ReactNode;

  // Header actions: structured so order and variant cannot drift page to page.
  /** Rendered rightmost, the primary CTA (e.g. "New invoice"). */
  primaryAction?: React.ReactNode;
  /** Rendered left of the primary action (secondary/ghost utilities). */
  secondaryActions?: React.ReactNode;

  /** Quick-filter search, rendered on the same row as the filters. Omit to hide. */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /** A TableColumnOptions menu (pass iconOnly), right-aligned on the filter row. */
  columnOptions?: React.ReactNode;

  /** Filter controls, shown on one row with the search (wrap in TableFilterBar). */
  filters?: React.ReactNode;

  /** Page max width. Default "full". */
  size?: PageSize;

  /** Built-in pagination footer. */
  pagination?: {
    pageIndex: number;
    pageCount: number;
    rowCount?: number;
    onPageChange: (index: number) => void;
  };

  /** The ServerDataTable. */
  children: React.ReactNode;
  className?: string;
}

/**
 * Full-width table page frame. Region order, top to bottom: header -> filter row
 * (search + filters, column options right-aligned) -> table -> pagination footer.
 * Bulk actions live on the table itself (ServerDataTable.bulkActions replaces the
 * column-header row while rows are selected). The app owns *what* goes in each
 * region; the organism owns *where* it goes, so pages cannot drift apart.
 */
export function TablePage({
  title,
  description,
  primaryAction,
  secondaryActions,
  search,
  columnOptions,
  filters,
  size = "full",
  pagination,
  children,
  className,
}: TablePageProps) {
  return (
    <Page size={size} className={cn("flex flex-col gap-4", className)}>
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <H1>{title}</H1>
          {description != null && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
        {(secondaryActions || primaryAction) && (
          <div className="flex shrink-0 items-center gap-2">
            {secondaryActions}
            {primaryAction}
          </div>
        )}
      </div>

      {/* Filter row: search, filters, and column options share one row */}
      {(search || filters || columnOptions) && (
        <div className="flex flex-wrap items-end gap-3">
          {search && (
            <TableSearch
              value={search.value}
              onChange={search.onChange}
              placeholder={search.placeholder}
            />
          )}
          {filters}
          {columnOptions && <div className="ml-auto">{columnOptions}</div>}
        </div>
      )}

      {/* Table (its header row becomes the bulk toolbar when rows are selected) */}
      {children}

      {/* Pagination footer */}
      {pagination && (
        <TablePagination
          pageIndex={pagination.pageIndex}
          pageCount={pagination.pageCount}
          rowCount={pagination.rowCount}
          onPageChange={pagination.onPageChange}
        />
      )}
    </Page>
  );
}
