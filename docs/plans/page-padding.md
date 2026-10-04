# Page top padding, page by page

Started 2026-10-04. Every route that renders inside ui2's `Page` (router `constrained()` helpers,
the invoice template editor's inline `Page`, and frontlogin's public About/Terms/Privacy).
ui2 `Page` is on trial with no top padding (see ui-tweaks.md item 23). `<id>` routes: open one
from the app's list. Only linked apps (5101, 5105, 5108, 5110) show local ui2 changes; link
others as we reach them.

Pages with the meta pill (ShellBarMeta) get 24px under it from the shell (ui-tweaks item 24);
the rest start right under the bar while the trial runs.

| # | App | Local URL | Page | Width | Linked | Status |
|---|---|---|---|---|---|---|
| 1 | frontai | http://localhost:5101/app/trivialtrivis_46/settings | SettingsPage | xl | yes | |
| 2 | frontai | http://localhost:5101/app/trivialtrivis_46/approvals | ApprovalsPage | xl | yes | |
| 3 | frontcontracts | http://localhost:5103/app/trivialtrivis_46/contracts/new | ContractNew | xl | no | |
| 4 | frontcontracts | http://localhost:5103/app/trivialtrivis_46/contracts/<id> | ContractDetail | xl | no | |
| 5 | frontcontracts | http://localhost:5103/app/trivialtrivis_46/settings | SettingsPage | xl | no | |
| 6 | frontcrm | http://localhost:5104/app/trivialtrivis_46/contacts/new | ContactNew | xl | no | |
| 7 | frontcrm | http://localhost:5104/app/trivialtrivis_46/contacts/<id> | ContactDetail | xl | no | |
| 8 | frontcrm | http://localhost:5104/app/trivialtrivis_46/pipeline | Pipeline | xl | no | |
| 9 | frontcrm | http://localhost:5104/app/trivialtrivis_46/admin/relation-types | RelationTypeAdmin | xl | no | |
| 10 | frontcrm | http://localhost:5104/app/trivialtrivis_46/admin/attribute-types | AttributeTypeAdmin | xl | no | |
| 11 | frontcrm | http://localhost:5104/app/trivialtrivis_46/admin/task-statuses | StatusAdmin | xl | no | |
| 12 | frontcrm | http://localhost:5104/app/trivialtrivis_46/admin/task-categories | CategoryAdmin | xl | no | |
| 13 | frontcrm | http://localhost:5104/app/trivialtrivis_46/admin/task-webhooks | WebhookAdmin | xl | no | |
| 14 | frontinvoices | http://localhost:5105/app/trivialtrivis_46/invoices/new | InvoiceEdit | 2xl | yes | |
| 15 | frontinvoices | http://localhost:5105/app/trivialtrivis_46/invoices/<id> | InvoiceEdit | 2xl | yes | |
| 16 | frontinvoices | http://localhost:5105/app/trivialtrivis_46/series | SeriesList | 2xl | yes | |
| 17 | frontinvoices | http://localhost:5105/app/trivialtrivis_46/settings | SettingsPage | 2xl | yes | |
| 18 | frontinvoices | http://localhost:5105/app/trivialtrivis_46/settings/template | TemplateEditor | full | yes | |
| 19 | frontinvoices | http://localhost:5105/app/trivialtrivis_46/settings/properties/new | PropertyNew | 2xl | yes | |
| 20 | frontinvoices | http://localhost:5105/app/trivialtrivis_46/settings/properties/<id>/edit | PropertyEdit | 2xl | yes | |
| 21 | frontitems | http://localhost:5106/app/trivialtrivis_46/items/new | ItemNew | xl | no | |
| 22 | frontitems | http://localhost:5106/app/trivialtrivis_46/items/<id> | ItemDetail | xl | no | |
| 23 | frontitems | http://localhost:5106/app/trivialtrivis_46/items/<id>/attach-profile | AttachProfile | xl | no | |
| 24 | frontitems | http://localhost:5106/app/trivialtrivis_46/items/<id>/dispose | DisposeItem | xl | no | |
| 25 | frontitems | http://localhost:5106/app/trivialtrivis_46/reservations/new | ReservationNew | xl | no | |
| 26 | frontitems | http://localhost:5106/app/trivialtrivis_46/reservations/<id> | ReservationDetail | xl | no | |
| 27 | frontledger | http://localhost:5107/app/trivialtrivis_46/accounts/new | AccountNew | xl | no | |
| 28 | frontledger | http://localhost:5107/app/trivialtrivis_46/periods/new | PeriodNew | xl | no | |
| 29 | frontledger | http://localhost:5107/app/trivialtrivis_46/periods/<id> | PeriodDetail | xl | no | |
| 30 | frontledger | http://localhost:5107/app/trivialtrivis_46/entries/new | EntryNew | xl | no | |
| 31 | frontledger | http://localhost:5107/app/trivialtrivis_46/entries/<id> | EntryDetail | xl | no | |
| 32 | frontledger | http://localhost:5107/app/trivialtrivis_46/entries/<id>/edit | EntryEdit | xl | no | |
| 33 | frontledger | http://localhost:5107/app/trivialtrivis_46/entries/<id>/mutate | EntryMutate | xl | no | |
| 34 | frontledger | http://localhost:5107/app/trivialtrivis_46/currencies/new | CurrencyNew | xl | no | |
| 35 | frontledger | http://localhost:5107/app/trivialtrivis_46/currencies/<id>/edit | CurrencyEdit | xl | no | |
| 36 | frontledger | http://localhost:5107/app/trivialtrivis_46/mappings/new | MappingNew | xl | no | |
| 37 | frontledger | http://localhost:5107/app/trivialtrivis_46/mappings/<id>/edit | MappingEdit | xl | no | |
| 38 | frontledger | http://localhost:5107/app/trivialtrivis_46/tax-rates/new | TaxRateNew | xl | no | |
| 39 | frontledger | http://localhost:5107/app/trivialtrivis_46/tax-rates/<id>/edit | TaxRateEdit | xl | no | |
| 40 | frontledger | http://localhost:5107/app/trivialtrivis_46/dimension-types/new | DimensionTypeNew | xl | no | |
| 41 | frontledger | http://localhost:5107/app/trivialtrivis_46/dimension-types/<type-id>/edit | DimensionTypeEdit | xl | no | |
| 42 | frontledger | http://localhost:5107/app/trivialtrivis_46/dimension-types/<type-id>/values/new | DimensionValueNew | xl | no | |
| 43 | frontledger | http://localhost:5107/app/trivialtrivis_46/dimension-types/<type-id>/values/<id>/edit | DimensionValueEdit | xl | no | |
| 44 | frontledger | http://localhost:5107/app/trivialtrivis_46/units/new | UnitNew | xl | no | |
| 45 | frontledger | http://localhost:5107/app/trivialtrivis_46/units/<id>/edit | UnitEdit | xl | no | |
| 46 | frontledger | http://localhost:5107/app/trivialtrivis_46/reports/journal | JournalReport | xl | no | |
| 47 | frontledger | http://localhost:5107/app/trivialtrivis_46/reports/turnover | TurnoverReport | xl | no | |
| 48 | frontledger | http://localhost:5107/app/trivialtrivis_46/reports/dimensions | DimensionReport | xl | no | |
| 49 | frontledger | http://localhost:5107/app/trivialtrivis_46/reports/expenses | DimensionReport | xl | no | |
| 50 | frontlogin | http://localhost:5108/about | About | md | yes | |
| 51 | frontlogin | http://localhost:5108/terms | Terms | md | yes | |
| 52 | frontlogin | http://localhost:5108/privacy | Privacy | md | yes | |
| 53 | frontlogin | http://localhost:5108/app/trivialtrivis_46/overview | Overview | xl | yes | |
| 54 | frontlogin | http://localhost:5108/app/trivialtrivis_46/dashboard | Dashboard | xl | yes | |
| 55 | frontlogin | http://localhost:5108/app/trivialtrivis_46/billing/park | ParkTokens | xl | yes | |
| 56 | frontlogin | http://localhost:5108/app/trivialtrivis_46/billing/redeem | RedeemCode | xl | yes | |
| 57 | frontlogin | http://localhost:5108/app/trivialtrivis_46/manage-organization/new | NewOrganization | xl | yes | |
| 58 | frontlogin | http://localhost:5108/app/trivialtrivis_46/manage-organization/settings | OrganizationSettings | xl | yes | |
| 59 | frontlogin | http://localhost:5108/app/trivialtrivis_46/manage-organization/members | Members | xl | yes | |
| 60 | frontlogin | http://localhost:5108/app/trivialtrivis_46/manage-organization/members/add | AddMember | xl | yes | |
| 61 | frontlogin | http://localhost:5108/app/trivialtrivis_46/account | AccountSettings | xl | yes | |
| 62 | frontlogin | http://localhost:5108/app/trivialtrivis_46/account-overview | AccountOverview | xl | yes | |
| 63 | frontpayments | http://localhost:5109/app/trivialtrivis_46/overview | Overview | xl | no | |
| 64 | frontpayments | http://localhost:5109/app/trivialtrivis_46/bank/<id> | BankAccountDetail | xl | no | |
| 65 | frontpayments | http://localhost:5109/app/trivialtrivis_46/payments/new | PaymentNew | xl | no | |
| 66 | frontpayments | http://localhost:5109/app/trivialtrivis_46/payments/<id> | PaymentDetail | xl | no | |
| 67 | frontpayments | http://localhost:5109/app/trivialtrivis_46/series | SeriesList | xl | no | |
| 68 | frontpayments | http://localhost:5109/app/trivialtrivis_46/batches | PaymentRuns | xl | no | |
| 69 | frontpayments | http://localhost:5109/app/trivialtrivis_46/settings | SettingsPage | xl | no | |
| 70 | frontpayments | http://localhost:5109/app/trivialtrivis_46/card-payments | CardPaymentsPage | xl | no | |
| 71 | frontpayments | http://localhost:5109/app/trivialtrivis_46/statements | Inbox | xl | no | |
| 72 | frontpayments | http://localhost:5109/app/trivialtrivis_46/statements/imports | StatementList | xl | no | |
| 73 | frontpayments | http://localhost:5109/app/trivialtrivis_46/statements/import | StatementImport | xl | no | |
| 74 | frontpayments | http://localhost:5109/app/trivialtrivis_46/statements/<id> | StatementDetail | xl | no | |
| 75 | frontproducts | http://localhost:5110/app/trivialtrivis_46/products/new | ProductNew | xl | yes | |
| 76 | frontproducts | http://localhost:5110/app/trivialtrivis_46/products/<id> | ProductEdit | xl | yes | |
| 77 | frontproducts | http://localhost:5110/app/trivialtrivis_46/settings | SettingsPage | xl | yes | |
| 78 | frontpurchase | http://localhost:5111/app/trivialtrivis_46/invoices/new | InvoiceEdit | 2xl | no | |
| 79 | frontpurchase | http://localhost:5111/app/trivialtrivis_46/approvals | ApprovalInboxPage | 2xl | no | |
| 80 | frontpurchase | http://localhost:5111/app/trivialtrivis_46/invoices/<id> | InvoiceEdit | 2xl | no | |
| 81 | frontpurchase | http://localhost:5111/app/trivialtrivis_46/series | SeriesList | 2xl | no | |
| 82 | frontpurchase | http://localhost:5111/app/trivialtrivis_46/settings | SettingsPage | 2xl | no | |
| 83 | frontpurchase | http://localhost:5111/app/trivialtrivis_46/settings/approvals | ApprovalFlowPage | 2xl | no | |
| 84 | frontpurchase | http://localhost:5111/app/trivialtrivis_46/settings/properties/new | PropertyNew | 2xl | no | |
| 85 | frontpurchase | http://localhost:5111/app/trivialtrivis_46/settings/properties/<id>/edit | PropertyEdit | 2xl | no | |
| 86 | frontreports | http://localhost:5112/app/trivialtrivis_46/ee-annual-reports/new | AnnualReportNew | xl | no | |
| 87 | frontreports | http://localhost:5112/app/trivialtrivis_46/ee-annual-reports/<id> | AnnualReportDetail | xl | no | |
| 88 | frontreports | http://localhost:5112/app/trivialtrivis_46/ee-vat-reports/new | VatReportNew | xl | no | |
| 89 | frontreports | http://localhost:5112/app/trivialtrivis_46/ee-vat-reports/<id> | VatReportDetail | xl | no | |
| 90 | frontreports | http://localhost:5112/app/trivialtrivis_46/ee-balance-sheet | BalanceSheetReportPage | xl | no | |
| 91 | frontreports | http://localhost:5112/app/trivialtrivis_46/ee-income-statement | IncomeStatementReportPage | xl | no | |
| 92 | frontsettings | http://localhost:5113/app/trivialtrivis_46/organization | OrganizationEdit | xl | no | |
| 93 | frontsettings | http://localhost:5113/app/trivialtrivis_46/bank-types | BankTypeList | xl | no | |
| 94 | frontsettings | http://localhost:5113/app/trivialtrivis_46/location-types | LocationTypeList | xl | no | |
| 95 | frontsettings | http://localhost:5113/app/trivialtrivis_46/project-types | ProjectTypeList | xl | no | |
| 96 | frontsettings | http://localhost:5113/app/trivialtrivis_46/banks/new | BankNew | xl | no | |
| 97 | frontsettings | http://localhost:5113/app/trivialtrivis_46/banks/<id>/edit | BankEdit | xl | no | |
| 98 | frontsettings | http://localhost:5113/app/trivialtrivis_46/employees/new | EmployeeNew | xl | no | |
| 99 | frontsettings | http://localhost:5113/app/trivialtrivis_46/employees/<id>/edit | EmployeeEdit | xl | no | |
| 100 | frontsettings | http://localhost:5113/app/trivialtrivis_46/locations/new | LocationNew | xl | no | |
| 101 | frontsettings | http://localhost:5113/app/trivialtrivis_46/locations/<id>/edit | LocationEdit | xl | no | |
| 102 | frontsettings | http://localhost:5113/app/trivialtrivis_46/projects/new | ProjectNew | xl | no | |
| 103 | frontsettings | http://localhost:5113/app/trivialtrivis_46/projects/<id>/edit | ProjectEdit | xl | no | |
| 104 | frontsettings | http://localhost:5113/app/trivialtrivis_46/api-keys | APIKeyList | xl | no | |
| 105 | frontsettings | http://localhost:5113/app/trivialtrivis_46/mcp-keys | MCPKeyList | xl | no | |
| 106 | frontsettings | http://localhost:5113/app/trivialtrivis_46/e-invoice | EInvoice | xl | no | |
| 107 | frontsettings | http://localhost:5113/app/trivialtrivis_46/email-import | EmailImport | xl | no | |
| 108 | frontsettings | http://localhost:5113/app/trivialtrivis_46/hr/employees/new | PersonnelNew | xl | no | |
| 109 | frontsettings | http://localhost:5113/app/trivialtrivis_46/hr/employees/<id> | PersonnelDetail | xl | no | |
| 110 | frontsettings | http://localhost:5113/app/trivialtrivis_46/hr/employees/<id>/edit | PersonnelEdit | xl | no | |
| 111 | frontsettings | http://localhost:5113/app/trivialtrivis_46/hr/absences/new | HRAbsenceNew | xl | no | |
| 112 | fronttables | http://localhost:5114/app/trivialtrivis_46/tables | TablesListPage | xl | no | |
