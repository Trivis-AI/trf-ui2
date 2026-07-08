// Server-backed table infrastructure: a shared presentational core (TableView),
// the fully controlled ServerDataTable, the TablePage organism, drop-in toolbar
// subcomponents, the useTableQuery state hook, and the URL-state adapter.
//
// This barrel is re-exported from the package root (src/index.ts, owned by the
// Integrate phase). Cell renderers (StatusCell, MoneyCell, ...) land alongside
// these and should be exported from here too when built.

// Shared render core (internal, but exported so DataTable/ServerDataTable and
// tests can reference the type).
export { TableView } from "./table-view";
export type { TableViewProps } from "./table-view";

// The controlled, server-driven table.
export { ServerDataTable } from "./server-data-table";
export type { ServerDataTableProps } from "./server-data-table";

// The full-width page organism.
export { TablePage } from "./table-page";
export type { TablePageProps } from "./table-page";

// Toolbar drop-ins.
export {
  TableSearch,
  TableColumnOptions,
  TablePagination,
  TableFilterBar,
} from "./table-toolbar";
export type {
  TableSearchProps,
  TableColumnOptionsProps,
  TableColumnOption,
  TablePaginationProps,
  TableFilterBarProps,
} from "./table-toolbar";

// The header progress line.
export { TableProgress } from "./table-progress";
export type { TableProgressProps } from "./table-progress";

// State hook + URL-state adapter.
export { useTableQuery } from "./use-table-query";
export type { UseTableQueryOptions, TableQuery } from "./use-table-query";
export { createHistoryUrlState } from "./url-state";
export type { UrlStateAdapter, UrlStateFactory } from "./url-state";

// Standard cell renderers (StatusCell, MoneyCell, DateCell, ...). See ./cells.
export * from "./cells";
