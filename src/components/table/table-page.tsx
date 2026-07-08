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

  // Toolbar row: fixed positions.
  /** Quick-filter search, always toolbar-left. Omit to hide. */
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  /** A TableColumnOptions menu, always toolbar-right. */
  columnOptions?: React.ReactNode;
  /** Optional, between search and options. Discouraged. */
  toolbarExtras?: React.ReactNode;

  /** Filter bar, between toolbar and table (wrap in TableFilterBar). */
  filters?: React.ReactNode;

  /** Bulk action bar, shown above the table when rows are selected. */
  bulkActions?: React.ReactNode;

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
 * Full-width table page frame. Fixed region order, top to bottom: header ->
 * toolbar (search left, column options right) -> filter bar -> bulk actions ->
 * table -> pagination footer. The app owns *what* goes in each region; the
 * organism owns *where* it goes, so pages cannot drift apart.
 */
export function TablePage({
  title,
  description,
  primaryAction,
  secondaryActions,
  search,
  columnOptions,
  toolbarExtras,
  filters,
  bulkActions,
  size = "full",
  pagination,
  children,
  className,
}: TablePageProps) {
  const hasToolbar = !!search || !!columnOptions || !!toolbarExtras;

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

      {/* Toolbar */}
      {hasToolbar && (
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            {search && (
              <TableSearch
                value={search.value}
                onChange={search.onChange}
                placeholder={search.placeholder}
              />
            )}
            {toolbarExtras}
          </div>
          {columnOptions && <div className="shrink-0">{columnOptions}</div>}
        </div>
      )}

      {/* Filters */}
      {filters}

      {/* Bulk actions */}
      {bulkActions && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-2">
          {bulkActions}
        </div>
      )}

      {/* Table */}
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
