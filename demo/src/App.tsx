import { useEffect, useMemo, useRef, useState } from "react";
import {
  Moon, Sun, Search, Save, Trash2, Info, Inbox,
  BadgeDollarSign, Receipt, ScrollText, Handshake, PieChart, Settings,
  Palette, Atom, Combine, Layers, MoreHorizontal, Copy, Pencil,
  FileText, ImageIcon, X, Download,
  Landmark, Banknote, CreditCard, Repeat, RefreshCw, ExternalLink, ChevronsUpDown,
  type LucideIcon,
} from "lucide-react";
import {
  ActionPill, Alert, AlertDescription, AlertTitle, Avatar,
  Attachment, AttachmentAction, AttachmentActions, AttachmentContent,
  AttachmentDescription, AttachmentGroup, AttachmentMedia, AttachmentTitle, AttachmentTrigger,
  AttachmentDropzone, type AttachmentDropzoneFile,
  AppShell, Badge, Button, cn, type ColumnDef, DataTable,
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarProvider, SidebarTrigger, useSidebar,
  Combobox, type ComboboxPreset, AsyncCombobox, EntityCombobox, type EntityComboboxItem, OrgSwitcher, type OrgSwitcherOrg, Calendar, DatePicker, DateTimePicker, MonthPicker, type DateRange, RadioCard, TableCard,
  StatementTable, type StatementRow,
  EditableGrid, type EditableGridColumn, type EditableGridRow,
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
  Checkbox, ConfirmDialog, useConfirm, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger,
  FloatingWindow, FloatingWindowClose, FloatingWindowContent, FloatingWindowHeader, FloatingWindowTitle, FloatingWindowTrigger,
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuCheckboxItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger,
  CopyField, EmptyState, Field, Grow, H1, H2, H3, InfoField, InfoGrid, Input, Label, LoadingState, Markdown, SearchInput, SecretReveal,
  Logo, PageHeader, Row, Stack, StepCard, Text, RadioGroup, RadioGroupItem, Select, SelectContent,
  SelectItem, SelectTrigger, SelectValue, SimpleSelect, Separator, Skeleton, Spinner, StatusBadge, type StatusTone, Switch, Tabs, TabsContent, TabsList,
  TabsTrigger, Table, TableBody, TableCell,
  TableFooter, TableHead, TableHeader, TableRow, Textarea, Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
  ChartContainer, ChartTooltip, ChartTooltipContent, ChartLegend, ChartLegendContent, type ChartConfig,
  setDateTimeLocale, useDateTimeLocale, formatDate, formatDateTime, formatMonth,
} from "@trf/ui2";
import {
  AreaChart as RAreaChart, Area, CartesianGrid, XAxis, YAxis,
  BarChart as RBarChart, Bar,
  PieChart as RPieChart, Pie,
  RadarChart as RRadarChart, Radar as RRadar,
  RadialBarChart as RRadialBarChart, RadialBar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from "recharts";
// Server-driven table infra + standard cell renderers, consumed from the barrel.
import {
  ServerDataTable, TablePage, TableFilterBar, TableColumnOptions, useTableQuery,
  StatusCell, MoneyCell, MonoCell, DateCell, TextCell, IconCell, ActionsCell,
  AmountBreakdown, EditableDataTable, RowEditModal, type RowEditField,
} from "@trf/ui2";
import {
  queryTable, STATUS_OPTIONS, METHOD_OPTIONS,
  type InvoiceRow, type InvoiceStatus, type PaymentMethod,
} from "./mock/server";
import { useMockQuery } from "./mock/use-mock-query";

/* ------------------------------------------------------------------ helpers */

const FONT_SCALE = { S: 0.9, M: 1, L: 1.15 } as const;
type SizeBracket = keyof typeof FONT_SCALE;

// Injected by Vite from the @trf/ui2 package version (tracks the cut tag).
declare const __UI2_VERSION__: string;

function SidebarBrand({ label = "TRF", version }: { label?: string; version?: string }) {
  const { collapsed } = useSidebar();
  return (
    <div className="flex w-full items-center gap-2 overflow-hidden px-4 py-3">
      <Avatar name={label} colorKey={label} size={24} className="shrink-0" />
      <span
        className={cn(
          "flex items-baseline gap-1.5 overflow-hidden whitespace-nowrap font-semibold transition-[max-width,opacity] duration-200",
          collapsed ? "max-w-0 opacity-0" : "max-w-[12rem] opacity-100"
        )}
      >
        {label}
        {version ? (
          <span className="text-xs font-normal text-muted-foreground">v{version}</span>
        ) : null}
      </span>
    </div>
  );
}

/* ----------------------------------------------------- section: Combobox */

const CUSTOMERS = [
  "100 Meedia Brändi OÜ", "Triiberg AS", "Foam Labs", "Northwind OÜ",
  "Põhjala Logistika AS", "Sinilill Kohvik OÜ", "Estkapital Invest AS", "Kalev & Pojad OÜ",
].map((name) => ({ value: name, label: name }));

function SearchInputDemo() {
  const [q, setQ] = useState("invoice");
  return (
    <Field label="Search" htmlFor="search" description="Leading icon + clear button; forwards all Input props." className="sm:col-span-2">
      <SearchInput
        id="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        onClear={() => setQ("")}
        placeholder="Search…"
      />
    </Field>
  );
}

const ACCOUNTS = [
  { code: "400", name: "Kaubad, toore, materjal ja teenused" },
  { code: "401", name: "Elekter, vesi, küte" },
  { code: "410", name: "Tööjõukulud" },
  { code: "271", name: "Kapitalirent (lühiajaline)" },
  { code: "281", name: "Kapitalirendi kohustus (pikaajaline)" },
  { code: "153", name: "Masinad ja seadmed" },
  { code: "154", name: "Muu materiaalne põhivara" },
  { code: "100", name: "Kassa" },
].map((a) => ({ value: a.code, label: `${a.code} ${a.name}`, data: { code: a.code } }));

const ACCOUNT_PRESETS: ComboboxPreset<{ code: string }>[] = [
  { label: "Expenses", match: (o) => !!o.data?.code.startsWith("4") },
  { label: "Leasing", match: (o) => !!o.data && (o.data.code.startsWith("27") || o.data.code.startsWith("28")) },
  { label: "Fixed assets", match: (o) => !!o.data?.code.startsWith("15") },
  { label: "All", match: () => true },
];

function ComboboxDemo() {
  const [customer, setCustomer] = useState("Triiberg AS");
  const [account, setAccount] = useState("400");
  return (
    <>
      <Field label="Customer" htmlFor="customer" className="w-72">
        <Combobox
          id="customer"
          options={CUSTOMERS}
          value={customer}
          onChange={setCustomer}
          placeholder="Pick a customer…"
          searchPlaceholder="Search customers…"
          emptyText="No customer found."
        />
      </Field>
      <Field label="Account" htmlFor="account" description="With category preset pills." className="w-72">
        <Combobox
          id="account"
          options={ACCOUNTS}
          presets={ACCOUNT_PRESETS}
          value={account}
          onChange={setAccount}
          placeholder="Select account…"
          searchPlaceholder="Search accounts…"
          emptyText="No account found."
        />
      </Field>
    </>
  );
}

/* ----------------------------------------------- section: AsyncCombobox */

type Cpa = { id: string; code: string; description: string; level: number };

const CPA_CODES: Cpa[] = [
  { id: "01.11", code: "01.11", description: "Growing of cereals and oil seeds", level: 4 },
  { id: "10.71", code: "10.71", description: "Manufacture of bread; fresh pastry", level: 4 },
  { id: "26.20", code: "26.20", description: "Manufacture of computers", level: 4 },
  { id: "41.00", code: "41.00", description: "Construction of buildings", level: 3 },
  { id: "49.41", code: "49.41", description: "Freight transport by road", level: 4 },
  { id: "62.01", code: "62.01", description: "Computer programming services", level: 4 },
  { id: "62.02", code: "62.02", description: "Computer consultancy services", level: 4 },
  { id: "70.22", code: "70.22", description: "Business & other management consultancy", level: 4 },
];

// Fake server: case-insensitive match on code or description, with latency.
function searchCpaCodes(query: string): Promise<Cpa[]> {
  const q = query.trim().toLowerCase();
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(
          CPA_CODES.filter(
            (c) => c.code.includes(q) || c.description.toLowerCase().includes(q)
          )
        ),
      600
    )
  );
}

const MIN_CHARS = 2;

function AsyncComboboxDemo() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<Cpa[]>([]);
  const [loading, setLoading] = useState(false);
  const [value, setValue] = useState<string>();
  const [label, setLabel] = useState<string>();

  useEffect(() => {
    if (query.trim().length < MIN_CHARS) {
      setItems([]);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    searchCpaCodes(query).then((res) => {
      if (cancelled) return;
      setItems(res);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [query]);

  const picker = (disabled?: boolean) => (
    <AsyncCombobox<Cpa>
      items={items}
      getKey={(c) => c.id}
      getLabel={(c) => `${c.code} — ${c.description}`}
      renderItem={(c) => (
        <>
          <span className="shrink-0 font-mono text-primary">{c.code}</span>
          <span className="flex-1 truncate">{c.description}</span>
          <Badge variant="secondary" className="shrink-0">L{c.level}</Badge>
        </>
      )}
      query={query}
      onQueryChange={setQuery}
      debounceMs={250}
      loading={loading}
      minChars={MIN_CHARS}
      value={value}
      selectedLabel={label}
      onChange={(v, item) => {
        setValue(v);
        setLabel(item ? `${item.code} — ${item.description}` : undefined);
      }}
      placeholder="Pick a CPA code…"
      searchPlaceholder="Search codes…"
      emptyText="No codes found."
      loadingText="Searching…"
      disabled={disabled}
    />
  );

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Field label="CPA code" htmlFor="cpa" className="w-72">
        {picker()}
      </Field>
      <Text className="text-muted-foreground">
        Idle, then type under {MIN_CHARS} chars (prompt), 2+ chars (loading → rich rows or empty),
        and pick one (selected). Try “xyz” for the empty state.
      </Text>
      <Field label="CPA code (disabled)" htmlFor="cpa-disabled" className="w-72">
        {picker(true)}
      </Field>
    </div>
  );
}

/* ---------------------------------------------- section: EntityCombobox */

type DemoContact = { id: string; name: string; reg: string; email?: string };

const CRM_CONTACTS: DemoContact[] = [
  { id: "c1", name: "Triiberg AS", reg: "10000001", email: "info@triiberg.ee" },
  { id: "c2", name: "Põhjala Logistika AS", reg: "10000002", email: "logistika@pohjala.ee" },
  { id: "c3", name: "Sinilill Kohvik OÜ", reg: "10000003" },
];

const REGISTRY_ORGS: DemoContact[] = [
  { id: "r1", name: "Saaremaa Vill OÜ", reg: "16543210", email: "Kuressaare, Saare maakond" },
  { id: "r2", name: "Sakala Puit AS", reg: "12345678", email: "Viljandi, Viljandi maakond" },
];

function EntityComboboxDemo() {
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<EntityComboboxItem[]>([]);
  const [registry, setRegistry] = useState<EntityComboboxItem[]>([]);
  const [registryLoading, setRegistryLoading] = useState(false);
  const [picked, setPicked] = useState<string>();

  const toItem = (c: DemoContact): EntityComboboxItem => ({
    key: c.id, title: c.name, code: c.reg, description: c.email,
  });

  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <Field label="Customer" htmlFor="entity-customer" className="w-80">
        <EntityCombobox
          id="entity-customer"
          query={query}
          onQueryChange={(q) => {
            setQuery(q);
            setPicked(undefined);
            if (!q.trim()) { setItems([]); setRegistry([]); }
          }}
          onSearch={(q) => {
            // Fake CRM search; registry fallback kicks in on zero hits (try "saa").
            const hits = CRM_CONTACTS.filter((c) =>
              c.name.toLowerCase().includes(q.toLowerCase())
            ).map(toItem);
            setItems(hits);
            if (hits.length === 0 && q.trim().length >= 2) {
              setRegistryLoading(true);
              setTimeout(() => {
                setRegistry(
                  REGISTRY_ORGS.filter((o) =>
                    o.name.toLowerCase().includes(q.toLowerCase())
                  ).map(toItem)
                );
                setRegistryLoading(false);
              }, 600);
            } else {
              setRegistry([]);
            }
          }}
          items={items}
          onPick={(item) => { setQuery(item.title); setItems([]); setPicked(item.title); }}
          fallbackItems={registry}
          fallbackLabel="Business Registry"
          fallbackLoading={registryLoading}
          fallbackLoadingText="Searching business registry…"
          onFallbackPick={(item) => {
            setQuery(item.title); setRegistry([]); setPicked(`${item.title} (imported)`);
          }}
        />
      </Field>
      <Text className="text-muted-foreground">
        Type “tri” for CRM hits (SELECT); “saa” for the registry fallback (IMPORT).
        {picked ? ` Picked: ${picked}` : ""}
      </Text>
    </div>
  );
}

/* ----------------------------------------------- section: OrgSwitcher */

const MANY_ORGS: OrgSwitcherOrg[] = [
  "Triiberg AS", "Foam Labs OÜ", "Northwind OÜ", "Põhjala Logistika AS",
  "Sinilill Kohvik OÜ", "Estkapital Invest AS", "Kalev & Pojad OÜ", "100 Meedia Brändi OÜ",
  "Kamarajura OÜ", "Läänemere Kalandus AS", "Tartu Teraviljasalv OÜ", "Vana-Kalamaja Kinnisvara OÜ",
  "Saaremaa Sadamad AS", "Nõmme Aiand OÜ", "Rakvere Rehvikeskus OÜ", "Viru Veod AS",
  "Pärnu Puhkemajad OÜ", "Hiiumaa Käsitöö OÜ", "Mustamäe Meistrid OÜ", "Kadrioru Konsultatsioonid OÜ",
].map((name, i) => ({ id: String(i + 1), name, slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") }));

const FEW_ORGS = MANY_ORGS.slice(0, 3);

// Returns the element itself (not a wrapper component) so PopoverTrigger's `asChild`
// props (onClick, ref, aria) land on the Button.
function orgTrigger(org: OrgSwitcherOrg) {
  return (
    <Button variant="ghost" className="w-56 justify-start px-2">
      <Avatar name={org.name} colorKey={org.slug} size={24} />
      <span className="min-w-0 flex-1 truncate text-left">{org.name}</span>
      <ChevronsUpDown className="text-muted-foreground" />
    </Button>
  );
}

function OrgSwitcherDemo() {
  const [manyCurrent, setManyCurrent] = useState(MANY_ORGS[0]);
  const [fewCurrent, setFewCurrent] = useState(FEW_ORGS[0]);
  const [lazyOrgs, setLazyOrgs] = useState<OrgSwitcherOrg[]>([]);
  const [lazyLoading, setLazyLoading] = useState(false);
  const [lazyCurrent, setLazyCurrent] = useState(MANY_ORGS[0]);
  const lazyTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(lazyTimer.current), []);
  return (
    <div className="flex flex-wrap gap-8">
      <Field label="Many orgs" description="≥ 8 orgs shows type-to-filter search; current org is checked.">
        <OrgSwitcher orgs={MANY_ORGS} currentSlug={manyCurrent.slug} onSelect={setManyCurrent}>
          {orgTrigger(manyCurrent)}
        </OrgSwitcher>
      </Field>
      <Field label="Few orgs" description="Below the threshold the search input is hidden.">
        <OrgSwitcher orgs={FEW_ORGS} currentSlug={fewCurrent.slug} onSelect={setFewCurrent}>
          {orgTrigger(fewCurrent)}
        </OrgSwitcher>
      </Field>
      <Field label="Lazy list" description="onOpen + loading — list fetched when the popover opens.">
        <OrgSwitcher
          orgs={lazyOrgs}
          currentSlug={lazyCurrent.slug}
          onSelect={setLazyCurrent}
          loading={lazyLoading}
          onOpen={() => {
            if (lazyOrgs.length) return;
            setLazyLoading(true);
            lazyTimer.current = setTimeout(() => { setLazyOrgs(MANY_ORGS); setLazyLoading(false); }, 800);
          }}
        >
          {orgTrigger(lazyCurrent)}
        </OrgSwitcher>
      </Field>
    </div>
  );
}

/* ----------------------------------------------- section: SimpleSelect */

function SimpleSelectDemo() {
  const [projectType, setProjectType] = useState("");
  return (
    <Field
      label={`Project type (SimpleSelect)${projectType === "" ? " — empty" : ""}`}
      htmlFor="ptype"
      className="w-64"
    >
      <SimpleSelect
        id="ptype"
        value={projectType}
        onChange={setProjectType}
        options={[
          { value: "fixed", label: "Fixed price" },
          { value: "hourly", label: "Hourly" },
          { value: "retainer", label: "Retainer" },
        ]}
        placeholder="Pick a type…"
        noneLabel="— None —"
      />
    </Field>
  );
}

/* --------------------------------------------------- section: StepCard */

function StepCardDemo() {
  const [step, setStep] = useState(1);
  return (
    <Stack gap={3} className="w-full max-w-xl">
      <StepCard
        step={1}
        title="Payment details"
        subtitle="Date, amount and direction."
        summary={step > 1 ? "2026-06-11 · €1,240.00 · outgoing" : undefined}
        open={step === 1}
        onOpen={() => setStep(1)}
        completed={step > 1}
      >
        <Stack gap={3}>
          <Text tone="muted">Step 1 form goes here…</Text>
          <Button onClick={() => setStep(2)} className="self-start">Continue</Button>
        </Stack>
      </StepCard>
      <StepCard
        step={2}
        title="Match invoices"
        subtitle="Pick the open invoices this payment covers."
        summary={step > 2 ? "2 invoices · fully allocated" : undefined}
        open={step === 2}
        onOpen={() => setStep(2)}
        completed={step > 2}
        disabled={step < 2}
      >
        <Stack gap={3}>
          <Text tone="muted">Step 2 content…</Text>
          <Button onClick={() => setStep(3)} className="self-start">Continue</Button>
        </Stack>
      </StepCard>
      <StepCard
        step={3}
        title="Confirm"
        open={step === 3}
        onOpen={() => setStep(3)}
        disabled={step < 3}
      >
        <Stack gap={3}>
          <Text tone="muted">Review and confirm.</Text>
          <Button onClick={() => setStep(1)} className="self-start">Restart demo</Button>
        </Stack>
      </StepCard>
    </Stack>
  );
}

/* ---------------------------------------------- section: StatementTable */

const STATEMENT_ROWS: StatementRow[] = [
  { type: "header", label: "ASSETS" },
  { type: "header", label: "Current assets", indent: 1 },
  { type: "line", label: "Cash and cash equivalents", indent: 2, values: [125000, 98000] },
  { type: "line", label: "Receivables", indent: 2, values: [40250, 35900] },
  { type: "line", label: "Inventory", indent: 2, values: [0, 12000] },
  { type: "total", label: "Total current assets", indent: 1, values: [165250, 145900] },
  { type: "header", label: "Fixed assets", indent: 1 },
  { type: "line", label: "Property, plant and equipment", indent: 2, values: [89000, 95000] },
  { type: "total", label: "Total fixed assets", indent: 1, values: [89000, 95000] },
  { type: "total", label: "TOTAL ASSETS", values: [254250, 240900] },
];

function StatementTableDemo() {
  return (
    <div className="w-full max-w-2xl">
      <StatementTable
        rows={STATEMENT_ROWS}
        labelHeader="Item"
        valueHeaders={["31.12.2026", "31.12.2025"]}
      />
    </div>
  );
}

/* -------------------------------------------------------- section: Chart */

// Monthly revenue in euros — realistic shape (Estonian retail/services
// seasonality: a summer dip, a year-end push), not a random/stock demo.
const REVENUE_DATA = [
  { month: "Jaan", revenue: 18400, expenses: 12100 },
  { month: "Veebr", revenue: 19850, expenses: 12800 },
  { month: "Märts", revenue: 24200, expenses: 14300 },
  { month: "Apr", revenue: 26100, expenses: 15200 },
  { month: "Mai", revenue: 25300, expenses: 14900 },
  { month: "Juuni", revenue: 21700, expenses: 13600 },
  { month: "Juuli", revenue: 17900, expenses: 12400 },
  { month: "Aug", revenue: 19200, expenses: 12700 },
  { month: "Sept", revenue: 27400, expenses: 15800 },
  { month: "Okt", revenue: 29600, expenses: 16400 },
  { month: "Nov", revenue: 31200, expenses: 17100 },
  { month: "Dets", revenue: 34800, expenses: 18500 },
] satisfies { month: string; revenue: number; expenses: number }[];

const REVENUE_CHART_CONFIG = {
  revenue: { label: "Müügitulu", color: "var(--chart-1)" },
  expenses: { label: "Kulud", color: "var(--chart-4)" },
} satisfies ChartConfig;

// Quarterly aggregation of REVENUE_DATA — grouped bars compare series per
// category; do NOT stack unless the parts genuinely sum to a meaningful whole.
const QUARTER_DATA = [
  { quarter: "Q1", revenue: 62450, expenses: 39200 },
  { quarter: "Q2", revenue: 73100, expenses: 43700 },
  { quarter: "Q3", revenue: 64500, expenses: 40900 },
  { quarter: "Q4", revenue: 95600, expenses: 52000 },
];

// Revenue by activity — long Estonian labels are the horizontal bar's reason
// to exist: the label column gets real width instead of overlapping x ticks.
const ACTIVITY_DATA = [
  { activity: "Ehitusmaterjalide hulgimüük", revenue: 84000 },
  { activity: "Raamatupidamisteenused", revenue: 42000 },
  { activity: "IT-konsultatsioonid", revenue: 39000 },
  { activity: "Kinnisvara üürileandmine", revenue: 27500 },
  { activity: "Koolitused", revenue: 12800 },
];

// Pie/radial color per SLICE (each row is an identity), not per series —
// bake `fill` into the data and key the config by row name so
// ChartTooltipContent/ChartLegendContent resolve labels via nameKey="name".
// Keep slices ≤5: the palette has 5 fixed hues and cycling would repeat a
// hue on adjacent slices.
const ACTIVITY_SHARE = ACTIVITY_DATA.map((d, i) => ({
  name: d.activity,
  value: d.revenue,
  fill: `var(--chart-${i + 1})`,
}));
const ACTIVITY_SHARE_CONFIG = Object.fromEntries(
  ACTIVITY_SHARE.map((r) => [r.name, { label: r.name }]),
) satisfies ChartConfig;

// Cost structure across categories, two years side by side — the radar's
// niche: comparing 2+ entities across 3+ shared dimensions.
const COST_STRUCTURE = [
  { category: "Palgad", y2025: 96000, y2026: 104000 },
  { category: "Rent", y2025: 24000, y2026: 26400 },
  { category: "IT", y2025: 11200, y2026: 16800 },
  { category: "Turundus", y2025: 8600, y2026: 12400 },
  { category: "Muu", y2025: 14100, y2026: 12900 },
];
const COST_STRUCTURE_CONFIG = {
  y2025: { label: "2025", color: "var(--chart-2)" },
  y2026: { label: "2026", color: "var(--chart-1)" },
} satisfies ChartConfig;

function ChartDemo() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Kuine müügitulu</CardTitle>
          <CardDescription>Jaanuar – detsember 2026</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={REVENUE_CHART_CONFIG} className="aspect-auto h-72 w-full">
            <RAreaChart data={REVENUE_DATA} margin={{ left: 4, right: 4 }}>
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.02} />
                </linearGradient>
                <linearGradient id="fillExpenses" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-expenses)" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="var(--color-expenses)" stopOpacity={0.02} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="month" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={48}
                tickFormatter={(v: number) => `€${Math.round(v / 1000)}k`}
              />
              <ChartTooltip
                content={
                  <ChartTooltipContent
                    formatter={(value, name) => (
                      <div className="flex w-full items-center justify-between gap-4">
                        <span className="text-muted-foreground">
                          {REVENUE_CHART_CONFIG[name as keyof typeof REVENUE_CHART_CONFIG]?.label ?? name}
                        </span>
                        <span className="font-mono font-medium tabular-nums text-foreground">
                          €{Number(value).toLocaleString()}
                        </span>
                      </div>
                    )}
                  />
                }
              />
              <Area
                dataKey="expenses"
                type="monotone"
                fill="url(#fillExpenses)"
                stroke="var(--color-expenses)"
                strokeWidth={2}
                stackId="a"
              />
              <Area
                dataKey="revenue"
                type="monotone"
                fill="url(#fillRevenue)"
                stroke="var(--color-revenue)"
                strokeWidth={2}
                stackId="b"
              />
              <ChartLegend content={<ChartLegendContent />} />
            </RAreaChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Text size="xs" tone="muted">
        ↑ `ChartContainer` + `ChartTooltip`/`ChartLegend` around Recharts — series colors come
        from `ChartConfig` (`--chart-1`…`--chart-5` tokens), so light/dark just work.
      </Text>

      <Card>
        <CardHeader>
          <CardTitle>Kvartali tulud ja kulud</CardTitle>
          <CardDescription>Grouped bars — compare series per category</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={REVENUE_CHART_CONFIG} className="aspect-auto h-64 w-full">
            <RBarChart data={QUARTER_DATA} margin={{ left: 4, right: 4 }}>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis dataKey="quarter" tickLine={false} axisLine={false} tickMargin={8} />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={48}
                tickFormatter={(v: number) => `€${Math.round(v / 1000)}k`}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[4, 4, 0, 0]} />
              <ChartLegend content={<ChartLegendContent />} />
            </RBarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Müügitulu tegevusalade lõikes</CardTitle>
          <CardDescription>Horizontal bars — long labels stay readable</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{ revenue: { label: "Müügitulu", color: "var(--chart-1)" } }}
            className="aspect-auto w-full"
            style={{ height: ACTIVITY_DATA.length * 40 }}
          >
            <RBarChart data={ACTIVITY_DATA} layout="vertical" margin={{ left: 4, right: 4 }}>
              <CartesianGrid horizontal={false} strokeDasharray="3 3" />
              <XAxis
                type="number"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tickFormatter={(v: number) => `€${Math.round(v / 1000)}k`}
              />
              {/* layout="vertical" flips the axes: XAxis must be type="number",
                  YAxis type="category" — and the YAxis needs an explicit width
                  or long labels truncate at the default 60px. */}
              <YAxis
                type="category"
                dataKey="activity"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={170}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="revenue" fill="var(--color-revenue)" radius={[0, 4, 4, 0]} />
            </RBarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tulude jaotus</CardTitle>
          <CardDescription>Donut — per-slice colors, nameKey wiring</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={ACTIVITY_SHARE_CONFIG} className="aspect-auto h-64 w-full">
            <RPieChart>
              <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
              {/* stroke = surface color → a 2px gap separating the slices.
                  isAnimationActive off: recharts 3.9's polar mount animation
                  can stall at scale 0, leaving the marks invisible — applies
                  to Pie, Radar and RadialBar alike. */}
              <Pie
                data={ACTIVITY_SHARE}
                dataKey="value"
                nameKey="name"
                innerRadius={55}
                stroke="var(--background)"
                strokeWidth={2}
                isAnimationActive={false}
              />
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </RPieChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Kulude struktuur, 2025 vs 2026</CardTitle>
          <CardDescription>Radar — 2+ entities across 3+ shared dimensions</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={COST_STRUCTURE_CONFIG} className="aspect-auto h-64 w-full">
            <RRadarChart data={COST_STRUCTURE}>
              <PolarGrid />
              <PolarAngleAxis dataKey="category" />
              {/* invisible, but required: without a radius axis recharts v3
                  collapses the value scale and polygons render sub-pixel */}
              <PolarRadiusAxis tick={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <RRadar
                dataKey="y2025"
                stroke="var(--color-y2025)"
                strokeWidth={2}
                fill="var(--color-y2025)"
                fillOpacity={0.25}
                isAnimationActive={false}
              />
              <RRadar
                dataKey="y2026"
                stroke="var(--color-y2026)"
                strokeWidth={2}
                fill="var(--color-y2026)"
                fillOpacity={0.25}
                isAnimationActive={false}
              />
              <ChartLegend content={<ChartLegendContent />} />
            </RRadarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tulude jaotus rõngastena</CardTitle>
          <CardDescription>Radial bars — same per-slice wiring as the donut</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer config={ACTIVITY_SHARE_CONFIG} className="aspect-auto h-64 w-full">
            <RRadialBarChart
              data={ACTIVITY_SHARE}
              innerRadius={30}
              outerRadius={110}
              startAngle={90}
              endAngle={-270}
            >
              <ChartTooltip content={<ChartTooltipContent nameKey="name" hideLabel />} />
              <RadialBar dataKey="value" background cornerRadius={4} isAnimationActive={false} />
              <ChartLegend content={<ChartLegendContent nameKey="name" />} />
            </RRadialBarChart>
          </ChartContainer>
        </CardContent>
      </Card>

      <Text size="xs" tone="muted">
        ↑ Same wrappers, five more Recharts compositions. Pie/radial color per SLICE (config
        keyed by row name, `nameKey="name"` on tooltip + legend, ≤5 slices — hues are never
        cycled); horizontal bars need `layout="vertical"` + typed axes + explicit YAxis width;
        radar needs a hidden `PolarRadiusAxis`. Polar marks (Pie/Radar/RadialBar) render with
        `isAnimationActive={false}` — recharts 3.9's mount animation can stall at scale 0 and
        leave them invisible.
      </Text>
    </div>
  );
}

/* --------------------------------------------------- section: ActionPill */

function ActionPillDemo() {
  const [unpaidOnly, setUnpaidOnly] = useState(false);
  return (
    <div className="flex w-full max-w-xl flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        <ActionPill>Default</ActionPill>
        <ActionPill variant="selected">Selected</ActionPill>
        <ActionPill variant="primary">Primary</ActionPill>
        <ActionPill variant="warning">Warning</ActionPill>
        <ActionPill variant="destructive">Destructive</ActionPill>
        <ActionPill disabled>Disabled</ActionPill>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Text size="xs" tone="muted">Toggle:</Text>
        <ActionPill
          variant={unpaidOnly ? "selected" : "default"}
          onClick={() => setUnpaidOnly((v) => !v)}
        >
          Unpaid only
        </ActionPill>
      </div>
    </div>
  );
}

/* ----------------------------------------------- section: Attachment */

const ATTACHMENT_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80'%3E%3Crect width='80' height='80' fill='%23a78bfa'/%3E%3C/svg%3E";

function AttachmentDemo() {
  return (
    <div className="flex w-full max-w-2xl flex-col gap-6">
      <div className="flex flex-wrap items-start gap-3">
        <Attachment>
          <AttachmentMedia><FileText /></AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>invoice-1042.pdf</AttachmentTitle>
            <AttachmentDescription>PDF · 214 KB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Remove"><X /></AttachmentAction>
          </AttachmentActions>
        </Attachment>
        <Attachment>
          <AttachmentMedia variant="image"><img src={ATTACHMENT_IMG} alt="" /></AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>receipt.png</AttachmentTitle>
            <AttachmentDescription>PNG · 1.1 MB</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Download"><Download /></AttachmentAction>
            <AttachmentAction aria-label="Remove"><X /></AttachmentAction>
          </AttachmentActions>
        </Attachment>
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <Attachment state="idle">
          <AttachmentMedia><FileText /></AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>Waiting to upload</AttachmentTitle>
            <AttachmentDescription>Idle</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        <Attachment state="uploading">
          <AttachmentMedia><FileText /></AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>bank-statement.csv</AttachmentTitle>
            <AttachmentDescription>Uploading…</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        <Attachment state="processing">
          <AttachmentMedia><FileText /></AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>bank-statement.csv</AttachmentTitle>
            <AttachmentDescription>Processing…</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        <Attachment state="error">
          <AttachmentMedia><FileText /></AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>bank-statement.csv</AttachmentTitle>
            <AttachmentDescription>Upload failed</AttachmentDescription>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Retry"><Download /></AttachmentAction>
          </AttachmentActions>
        </Attachment>
      </div>

      <div className="flex flex-wrap items-start gap-3">
        <Attachment size="sm">
          <AttachmentMedia><ImageIcon /></AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>Small</AttachmentTitle>
            <AttachmentDescription>size="sm"</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        <Attachment size="xs">
          <AttachmentMedia><ImageIcon /></AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>Extra small</AttachmentTitle>
            <AttachmentDescription>size="xs"</AttachmentDescription>
          </AttachmentContent>
        </Attachment>
        <Attachment orientation="vertical">
          <AttachmentTrigger aria-label="Open receipt.png" />
          <AttachmentMedia variant="image"><img src={ATTACHMENT_IMG} alt="" /></AttachmentMedia>
          <AttachmentContent>
            <AttachmentTitle>receipt.png</AttachmentTitle>
          </AttachmentContent>
          <AttachmentActions>
            <AttachmentAction aria-label="Remove"><X /></AttachmentAction>
          </AttachmentActions>
        </Attachment>
      </div>

      <div className="w-full">
        <Text size="xs" tone="muted" className="mb-2 block">AttachmentGroup — scrolls horizontally</Text>
        <AttachmentGroup className="max-w-md">
          {["contract.pdf", "invoice-1042.pdf", "logo.png", "terms.docx", "photo.jpg"].map((name) => (
            <Attachment key={name} size="sm">
              <AttachmentMedia><FileText /></AttachmentMedia>
              <AttachmentContent>
                <AttachmentTitle>{name}</AttachmentTitle>
              </AttachmentContent>
            </Attachment>
          ))}
        </AttachmentGroup>
      </div>
    </div>
  );
}

function AttachmentDropzoneDemo() {
  const [files, setFiles] = useState<AttachmentDropzoneFile[]>([]);
  const nextId = useRef(1);

  const handleFilesAdded = (added: File[]) => {
    const withIds: AttachmentDropzoneFile[] = added.map((file) => ({
      id: String(nextId.current++),
      file,
      state: "uploading",
    }));
    setFiles((fs) => [...fs, ...withIds]);
    withIds.forEach((f) => {
      setTimeout(() => {
        setFiles((fs) =>
          fs.map((x) =>
            x.id !== f.id
              ? x
              : /fail/i.test(f.file.name)
                ? { ...x, state: "error", description: "Upload failed — try again" }
                : { ...x, state: "done" }
          )
        );
      }, 1200);
    });
  };

  return (
    <div className="w-full max-w-xl">
      <AttachmentDropzone
        files={files}
        onFilesAdded={handleFilesAdded}
        onRemove={(id) => setFiles((fs) => fs.filter((x) => x.id !== id))}
        accept="image/*,application/pdf,.csv,.docx"
      />
      <Text size="xs" tone="muted" className="mt-2 block">
        Drag a file here, paste an image (⌘V), or click to browse — it "uploads" for 1.2s. Name a
        file with "fail" in it to see the error state.
      </Text>
    </div>
  );
}

/* ---------------------------------------------- section: EditableGrid */

function EditableGridDemo() {
  const [gridCols, setGridCols] = useState<EditableGridColumn[]>([
    { id: "name", name: "Name", dataType: "string" },
    { id: "qty", name: "Qty", dataType: "number" },
    { id: "due", name: "Due", dataType: "date" },
    { id: "done", name: "Done", dataType: "boolean" },
  ]);
  const [gridRows, setGridRows] = useState<EditableGridRow[]>([
    { id: "1", values: { name: "Server rack", qty: "2", due: "2026-07-01", done: "true" } },
    { id: "2", values: { name: "Patch cables", qty: "48", due: "2026-06-20", done: "false" } },
    { id: "3", values: { name: "UPS battery", qty: "1", due: "", done: "" } },
  ]);
  const nextId = useRef(4);

  return (
    <div className="w-full">
      <EditableGrid
        columns={gridCols}
        rows={gridRows}
        onCellChange={(rowId, colId, value) =>
          setGridRows((rs) =>
            rs.map((r) => (r.id === rowId ? { ...r, values: { ...r.values, [colId]: value } } : r))
          )
        }
        onRowAdd={(values) => {
          setGridRows((rs) => [...rs, { id: String(nextId.current++), values }]);
        }}
        onRowDelete={(rowId) => setGridRows((rs) => rs.filter((r) => r.id !== rowId))}
        onColumnAdd={(name, dataType) =>
          setGridCols((cs) => [...cs, { id: `${name}-${Date.now()}`, name, dataType }])
        }
        onColumnDelete={(col) => setGridCols((cs) => cs.filter((c) => c.id !== col.id))}
      />
      <Text size="xs" tone="muted" className="mt-2 block">
        Click a cell to edit (Enter commits, Esc cancels). Booleans toggle in the new-row select;
        dates use an inline DatePicker. “+ Column” adds a typed column.
      </Text>
    </div>
  );
}

/* ------------------------------------------------ section: ConfirmDialog */

function ConfirmDialogDemo() {
  const [delOpen, setDelOpen] = useState(false);
  const [publishOpen, setPublishOpen] = useState(false);
  const [last, setLast] = useState<string>();
  const { confirm, dialog } = useConfirm();

  const fakeAsync = () => new Promise<void>((r) => setTimeout(r, 1500));

  return (
    <div className="flex flex-col items-start gap-3">
      <div className="flex flex-wrap items-center gap-3">
        {/* Declarative, destructive */}
        <Button variant="destructive" onClick={() => setDelOpen(true)}>
          <Trash2 /> Delete invoice
        </Button>
        <ConfirmDialog
          open={delOpen}
          variant="destructive"
          title="Delete invoice #1042?"
          description="The invoice will be permanently removed. This cannot be undone."
          confirmLabel="Delete"
          warning="Linked payments will be detached from this invoice."
          onConfirm={() => {
            setLast("Deleted #1042");
            setDelOpen(false);
          }}
          onCancel={() => setDelOpen(false)}
        />

        {/* Declarative, non-destructive + async/busy */}
        <Button variant="secondary" onClick={() => setPublishOpen(true)}>
          Publish report…
        </Button>
        <ConfirmDialog
          open={publishOpen}
          title="Publish report?"
          description="This sends the report to all subscribers. It may take a moment."
          confirmLabel="Publish"
          onConfirm={async () => {
            await fakeAsync(); // spinner shows on the confirm button while pending
            setLast("Report published");
            setPublishOpen(false);
          }}
          onCancel={() => setPublishOpen(false)}
        />

        {/* Imperative hook */}
        <Button
          variant="secondary"
          onClick={async () => {
            const ok = await confirm({
              title: "Archive contract?",
              description: "You can restore it later from the archive.",
              confirmLabel: "Archive",
            });
            setLast(ok ? "Archived (via useConfirm)" : "Cancelled (via useConfirm)");
          }}
        >
          Archive (useConfirm)
        </Button>
        {dialog}
      </div>
      {last ? <Text className="text-muted-foreground">Last action: {last}</Text> : null}
    </div>
  );
}

/* ------------------------------------------------ section: FloatingWindow */

function FloatingWindowDemo() {
  return (
    <div className="flex flex-col items-start gap-3">
      <FloatingWindow>
        <FloatingWindowTrigger asChild>
          <Button>View source document</Button>
        </FloatingWindowTrigger>
        <FloatingWindowContent className="flex h-96 max-w-md flex-col gap-3">
          <FloatingWindowHeader>
            <FloatingWindowTitle>invoice-source.pdf</FloatingWindowTitle>
          </FloatingWindowHeader>
          <div className="flex flex-1 items-center justify-center rounded-md border border-dashed border-border text-sm text-muted-foreground">
            Document preview goes here (e.g. an &lt;iframe&gt;)
          </div>
          <FloatingWindowClose asChild>
            <Button variant="secondary" size="sm" className="self-end">Close</Button>
          </FloatingWindowClose>
        </FloatingWindowContent>
      </FloatingWindow>
      <Text size="xs" tone="muted">
        Drag it aside by the header, resize from the bottom-right corner, and keep editing the
        fields behind it — unlike Dialog, it never traps focus or blocks the page.
      </Text>
    </div>
  );
}

/* --------------------------------------------------- section: DatePicker */

// Suite-wide locale switcher: everything below (pickers, DateCell, the plain formatters)
// re-formats live. Apps call setDateTimeLocale(dateTimeLocaleFromToken(token)) at startup.
function DateTimeLocaleDemo() {
  const locale = useDateTimeLocale();
  const sample = new Date(2026, 5, 25, 14, 30);
  return (
    <div className="rounded-md border border-border p-4 sm:col-span-2">
      <Row className="mb-3 items-center gap-3">
        <Text weight="semibold">Date/time locale</Text>
        <SimpleSelect
          id="dt-locale"
          value={locale ?? ""}
          onChange={(v) => setDateTimeLocale(v || undefined)}
          options={[
            { value: "et-EE", label: "et-EE (Estonian)" },
            { value: "en-GB", label: "en-GB (English)" },
            { value: "lv-LV", label: "lv-LV (Latvian)" },
            { value: "lt-LT", label: "lt-LT (Lithuanian)" },
          ]}
          placeholder="Browser default"
          noneLabel="Browser default"
          className="w-56"
        />
      </Row>
      <Text size="sm" className="text-muted-foreground">
        formatDate → {formatDate(sample)} · formatDateTime → {formatDateTime(sample)} · formatMonth →{" "}
        {formatMonth(sample)} · DateCell → <DateCell value={sample} variant="datetime" />
      </Text>
    </div>
  );
}

function DatePickerDemo() {
  const [date, setDate] = useState<Date>();
  const [invoiceDate, setInvoiceDate] = useState<Date | undefined>(new Date(2026, 5, 9));
  const [range, setRange] = useState<DateRange>();
  const [period, setPeriod] = useState<Date | undefined>(new Date(2026, 5, 1));
  const [paid, setPaid] = useState<Date>();
  const [fmtDate, setFmtDate] = useState<Date | undefined>(new Date(2026, 5, 9));
  const [filterDate, setFilterDate] = useState<Date | undefined>(new Date(2026, 5, 9));
  const [keepDay, setKeepDay] = useState<Date | undefined>(new Date(2026, 5, 10));
  const [appt, setAppt] = useState<Date | undefined>(new Date(2026, 5, 9, 14, 30));
  const [meeting, setMeeting] = useState<Date>();
  return (
    <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
      <DateTimeLocaleDemo />
      <Field label="Due date" htmlFor="dp-empty" description="Single date, nothing selected.">
        <DatePicker id="dp-empty" value={date} onChange={setDate} placeholder="Pick a date…" />
      </Field>
      <Field label="Invoice date" htmlFor="dp-selected" description="Single date, preselected.">
        <DatePicker id="dp-selected" value={invoiceDate} onChange={setInvoiceDate} />
      </Field>
      <Field label="Report period" htmlFor="dp-range" className="sm:col-span-2" description="Range mode (two months).">
        <DatePicker mode="range" id="dp-range" value={range} onChange={setRange} placeholder="Pick a range…" />
      </Field>
      <Field label="Birth date" htmlFor="dp-dropdown" description="captionLayout=dropdown — month + year jumping.">
        <DatePicker id="dp-dropdown" value={invoiceDate} onChange={setInvoiceDate} captionLayout="dropdown" />
      </Field>
      <Field label="Payment date" htmlFor="dp-nofuture" description="disabledDates: future dates greyed out.">
        <DatePicker
          id="dp-nofuture"
          value={paid}
          onChange={setPaid}
          disabledDates={{ after: new Date() }}
          placeholder="Pick a past date…"
        />
      </Field>
      <Field label="Custom label" htmlFor="dp-fmt" description="formatDate: weekday + long date.">
        <DatePicker
          id="dp-fmt"
          value={fmtDate}
          onChange={setFmtDate}
          formatDate={(d) =>
            d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "long", year: "numeric" })
          }
        />
      </Field>
      <Field label="Filter by date" htmlFor="dp-clear" description="clearable: ✕ resets to empty.">
        <DatePicker id="dp-clear" value={filterDate} onChange={setFilterDate} clearable />
      </Field>
      <Field label="Keep day on navigate" htmlFor="dp-keep" description="keepDayOnNavigate + dropdown — jump months, keep the day.">
        <DatePicker
          id="dp-keep"
          value={keepDay}
          onChange={setKeepDay}
          captionLayout="dropdown"
          keepDayOnNavigate
        />
      </Field>
      <Field label="Accounting period" htmlFor="mp" description="MonthPicker — picks a whole month.">
        <MonthPicker id="mp" value={period} onChange={setPeriod} minYear={2015} maxYear={2035} />
      </Field>
      <Field label="Disabled" htmlFor="dp-disabled">
        <DatePicker id="dp-disabled" value={invoiceDate} disabled />
      </Field>
      <Field label="Appointment" htmlFor="dt-appt" description="DateTimePicker — date + time, preselected.">
        <DateTimePicker id="dt-appt" value={appt} onChange={setAppt} />
      </Field>
      <Field label="Meeting" htmlFor="dt-meeting" description="DateTimePicker — dropdown nav + 15-min steps.">
        <DateTimePicker
          id="dt-meeting"
          value={meeting}
          onChange={setMeeting}
          captionLayout="dropdown"
          minuteStep={15}
          placeholder="Pick date & time…"
        />
      </Field>
      <div className="sm:col-span-2">
        <Text className="mb-2 text-muted-foreground">Inline calendar (the primitive), dropdown nav:</Text>
        <Calendar
          mode="single"
          captionLayout="dropdown"
          startMonth={new Date(2015, 0)}
          endMonth={new Date(2035, 11)}
          selected={invoiceDate}
          onSelect={setInvoiceDate}
          className="w-fit rounded-md border border-border"
        />
      </div>
    </div>
  );
}

function RadioCardDemo() {
  const [val, setVal] = useState("invoice");
  return (
    <div className="grid w-full max-w-lg gap-3 sm:grid-cols-2">
      <RadioCard selected={val === "invoice"} onClick={() => setVal("invoice")} icon={<Receipt />} title="Invoice" description="A standard sales invoice." />
      <RadioCard selected={val === "offer"} onClick={() => setVal("offer")} icon={<ScrollText />} title="Offer" description="A price quote / proposal." />
    </div>
  );
}

/* ------------------------------------------------------- section: Markdown */

// Exercises every element the Markdown component renders with a custom,
// token-styled renderer, plus the GFM features remark-gfm enables
// (tables, strikethrough, task lists, autolinks). Keep this in sync with the
// renderers in src/components/markdown.tsx — it's the visual spec for them.
const SAMPLE_MD = `# Quarterly summary

Revenue is **up 12%** vs. last quarter, driven by the \`Northwind\` and
[Triiberg AS](https://trf.is) accounts — and the figure is no longer
~~provisional~~. Bare URLs autolink too: https://trf.is.

## Headings render at four levels

### Section heading (h3)

#### Sub-section heading (h4)

A plain paragraph with *italic*, **bold**, and \`inline code\` to show the
base text styling and how inline marks inherit the bubble colour.

## Lists

Unordered:

- Two invoices remain *overdue* — see the table below.
- Net-30 terms are now the default for new customers.
- Run \`trf invoices sync\` before closing the books.

Ordered:

1. Reconcile the bank feed.
2. Match open invoices.
3. Lock the period.

Task list (GFM):

- [x] Send reminders for overdue invoices
- [ ] Archive Q2 statements
- [ ] Export VAT report

## Table

| Customer        | Status   | Payable   |
| --------------- | -------- | --------- |
| Triiberg AS     | Paid     | €1,240.00 |
| Northwind OÜ    | Overdue  | €890.00   |
| Foam Labs       | Draft    | €0.00     |

## Blockquote

> Heads up: figures exclude VAT.

---

## Code block

\`\`\`ts
const total = invoices.reduce((sum, i) => sum + i.payable, 0);
\`\`\`

## Image

![Cashflow trend for Q3](https://placehold.co/640x160/orange/white?text=Cashflow+Q3)
`;

function MarkdownDemo() {
  return (
    <div className="w-full max-w-xl rounded-lg border border-border bg-card p-4 text-card-foreground">
      <Markdown>{SAMPLE_MD}</Markdown>
    </div>
  );
}

/* ------------------------------------------------------- section: Colors */

const COLOR_TOKENS = [
  "background", "foreground", "card", "popover", "primary", "secondary", "muted", "accent",
  "destructive", "success", "warning", "border", "input", "ring",
];

function ColorsSection() {
  return (
    <div className="w-full">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {COLOR_TOKENS.map((t) => (
          <div key={t} className="flex flex-col gap-1.5">
            <div className="h-14 rounded-lg border border-border" style={{ background: `var(--${t})` }} />
            <Text size="xs" mono>{t}</Text>
          </div>
        ))}
      </div>
      <Text size="xs" tone="muted" className="mt-3">
        Semantic tokens (`--primary` etc.), light + dark. Toggle the theme — everything re-skins
        from these. `--primary` is ink in light, amber in dark.
      </Text>
    </div>
  );
}

/* --------------------------------------------------- section: DataTable */

type Invoice = { number: string; customer: string; status: "Draft" | "Confirmed" | "Paid"; total: number };
const STATUS_VARIANT = { Draft: "secondary", Confirmed: "default", Paid: "success" } as const;

function InvoiceTable() {
  const [rows, setRows] = useState<Invoice[]>([
    { number: "1042", customer: "100 Meedia Brändi OÜ", status: "Paid", total: 1240 },
    { number: "1041", customer: "Triiberg AS", status: "Confirmed", total: 380.5 },
    { number: "1040", customer: "Foam Labs", status: "Draft", total: 96 },
    { number: "1039", customer: "Northwind OÜ", status: "Confirmed", total: 5120 },
  ]);
  const columns: ColumnDef<Invoice>[] = [
    { id: "number", accessorKey: "number", header: "Number" },
    { id: "customer", accessorKey: "customer", header: "Customer", meta: { editable: true } },
    {
      id: "status", accessorKey: "status", header: "Status",
      cell: ({ getValue }) => {
        const s = getValue() as Invoice["status"];
        return <Badge variant={STATUS_VARIANT[s]}>{s}</Badge>;
      },
    },
    {
      id: "total", accessorKey: "total", header: "Total", meta: { editable: true, align: "right" },
      cell: ({ getValue }) => `€${(getValue() as number).toLocaleString("en", { minimumFractionDigits: 2 })}`,
    },
  ];
  return (
    <div className="w-full">
      <Text size="xs" tone="muted" className="mb-2">
        Click headers to sort · type to filter · drag the grip to reorder columns · click Customer
        or Total to edit inline.
      </Text>
      <DataTable
        columns={columns}
        data={rows}
        enableSorting
        enableGlobalFilter
        enableColumnReorder
        onCellEdit={(rowIndex, columnId, value) =>
          setRows((prev) =>
            prev.map((r, i) =>
              i === rowIndex ? { ...r, [columnId]: columnId === "total" ? Number(value) || 0 : value } : r
            )
          )
        }
      />
    </div>
  );
}

/* ---------------------------------------------- section: ServerDataTable */

// Domain status -> pill tone, mapped once so every status cell matches.
const STATUS_TONE: Record<InvoiceStatus, StatusTone> = {
  Draft: "neutral",
  Sent: "info",
  Paid: "success",
  Overdue: "warning",
  Cancelled: "error",
};

// Payment method -> an icon standing in for the text (IconCell keeps the label
// visible and accessible). Lucide icons only.
const METHOD_ICON: Record<PaymentMethod, LucideIcon> = {
  Wire: Landmark,
  Cash: Banknote,
  Card: CreditCard,
  "Direct debit": Repeat,
};

// One canonical amount formatter; MoneyCell passes the resulting string through.
const eur = new Intl.NumberFormat(undefined, { style: "currency", currency: "EUR" });

// Data columns (in default order) the column-options menu can hide / reorder. The
// "actions" column is fixed rightmost and stays out of this list.
const SDT_DATA_COLUMNS: { id: string; label: string; hideable: boolean }[] = [
  { id: "number", label: "Number", hideable: false },
  { id: "supplier", label: "Supplier", hideable: true },
  { id: "date", label: "Date", hideable: true },
  { id: "status", label: "Status", hideable: true },
  { id: "method", label: "Method", hideable: true },
  { id: "totalGross", label: "Total gross", hideable: true },
  { id: "payable", label: "Payable", hideable: true },
];


function ServerDataTableDemo() {
  // useTableQuery owns page / sort / filter / debounced-search state and produces a
  // stable queryKey + params. URL sync is off here so the demo does not fight the
  // kitchen sink's own navigation; real pages leave it on (the default).
  const q = useTableQuery({
    defaultSort: [{ id: "date", desc: true }],
    defaultPageSize: 20,
    filterKeys: ["status", "method"],
    syncToUrl: false,
  });

  const [reloadNonce, setReloadNonce] = useState(0);
  const [opened, setOpened] = useState<string>();
  const [dataOrder, setDataOrder] = useState<string[]>(SDT_DATA_COLUMNS.map((c) => c.id));
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const selectedCount = Object.values(selected).filter(Boolean).length;

  // The mock stand-in for react-query: keeps previous data during refetch and
  // serves seen queries from cache. Bumping reloadNonce forces a background
  // revalidate (a new, uncached key) so the loading line is easy to trigger.
  const queryKey = useMemo(() => [...q.queryKey, reloadNonce], [q.queryKey, reloadNonce]);
  const result = useMockQuery(queryKey, () =>
    queryTable({
      pageIndex: q.pageIndex,
      pageSize: q.pageSize,
      sorting: q.sorting,
      search: q.search,
      filters: q.filters,
    })
  );

  const rows = result.data?.rows ?? [];
  const columnOrder = useMemo(() => [...dataOrder, "actions"], [dataOrder]);

  const columns: ColumnDef<InvoiceRow>[] = useMemo(
    () => [
      {
        id: "number", accessorKey: "number", header: "Number",
        cell: ({ row }) => <MonoCell value={row.original.number} />,
      },
      {
        id: "supplier", accessorKey: "supplier", header: "Supplier",
        cell: ({ row }) => (
          <TextCell value={row.original.supplier} subLine={`Reg ${row.original.supplierReg}`} />
        ),
      },
      {
        id: "date", accessorKey: "date", header: "Date",
        cell: ({ row }) => <DateCell value={row.original.date} />,
      },
      {
        id: "status", accessorKey: "status", header: "Status", enableSorting: false,
        cell: ({ row }) => (
          <StatusCell tone={STATUS_TONE[row.original.status]} label={row.original.status} />
        ),
      },
      {
        id: "method", accessorKey: "method", header: "Method", enableSorting: false,
        cell: ({ row }) => (
          // The demo and @trf/ui2 resolve to different lucide-react copies, so the
          // icon component is cast through IconCell's own icon prop type. Real
          // consumers share one lucide-react and need no cast.
          <IconCell
            icon={METHOD_ICON[row.original.method] as React.ComponentProps<typeof IconCell>["icon"]}
            label={row.original.method}
          />
        ),
      },
      {
        id: "totalGross", accessorKey: "totalGross", header: "Total gross",
        meta: { align: "right" },
        cell: ({ row }) => {
          // Mock rows only carry gross + payable; derive a plausible Net / VAT
          // (22%) split so the hover card shows a full breakdown. Real pages pass
          // the actual net / tax / gross / payable fields.
          const gross = row.original.totalGross;
          const net = Math.round((gross / 1.22) * 100) / 100;
          const vat = Math.round((gross - net) * 100) / 100;
          return (
            <MoneyCell
              value={eur.format(gross)}
              hoverCard={
                <AmountBreakdown
                  rows={[
                    { label: "Net", value: eur.format(net) },
                    { label: "VAT (22%)", value: eur.format(vat) },
                    { label: "Gross", value: eur.format(gross) },
                    { label: "Payable", value: eur.format(row.original.payable), emphasis: true },
                  ]}
                />
              }
            />
          );
        },
      },
      {
        id: "payable", accessorKey: "payable", header: "Payable",
        meta: { align: "right" },
        cell: ({ row }) => (
          <MoneyCell value={row.original.payable === 0 ? "" : eur.format(row.original.payable)} />
        ),
      },
      {
        id: "actions", header: "", enableSorting: false, meta: { align: "right" },
        cell: ({ row }) => (
          <ActionsCell
            // Icons cast through ActionsCell's own prop type: see the method cell note.
            actions={[
              { label: "Download", icon: Download, iconOnly: true },
              { label: "Open", icon: ExternalLink, iconOnly: true, onClick: () => setOpened(row.original.number) },
            ] as React.ComponentProps<typeof ActionsCell>["actions"]}
          />
        ),
      },
    ],
    []
  );

  const hasFilters = !!q.search || Object.keys(q.filters).length > 0;

  return (
    <div className="w-full">
      <TablePage
        title="Purchase invoices"
        description="5000 rows from an in-memory mock: server-side search, filter, sort, and pagination with a flicker-free loading model."
        primaryAction={<Button size="sm">New invoice</Button>}
        secondaryActions={
          <Button variant="secondary" size="sm" onClick={() => setReloadNonce((n) => n + 1)}>
            <RefreshCw /> Reload
          </Button>
        }
        search={{
          value: q.searchInput,
          onChange: q.setSearch,
          placeholder: "Search by number or supplier...",
        }}
        columnOptions={
          <TableColumnOptions
            iconOnly
            columns={SDT_DATA_COLUMNS}
            visibility={columnVisibility}
            onVisibilityChange={setColumnVisibility}
            order={dataOrder}
            onOrderChange={setDataOrder}
          />
        }
        filters={
          <TableFilterBar active={hasFilters} onClear={q.clearFilters}>
            <Field label="Status" htmlFor="sdt-status" className="w-44">
              <SimpleSelect
                id="sdt-status"
                value={q.filters.status ?? ""}
                onChange={(v) => q.setFilter("status", v)}
                options={STATUS_OPTIONS.map((s) => ({ value: s, label: s }))}
                placeholder="All statuses"
                noneLabel="All statuses"
              />
            </Field>
            <Field label="Method" htmlFor="sdt-method" className="w-44">
              <SimpleSelect
                id="sdt-method"
                value={q.filters.method ?? ""}
                onChange={(v) => q.setFilter("method", v)}
                options={METHOD_OPTIONS.map((m) => ({ value: m, label: m }))}
                placeholder="All methods"
                noneLabel="All methods"
              />
            </Field>
          </TableFilterBar>
        }
        pagination={{
          pageIndex: q.pageIndex,
          pageCount: result.data?.pageCount ?? -1,
          rowCount: result.data?.rowCount,
          onPageChange: q.setPageIndex,
        }}
      >
        <ServerDataTable<InvoiceRow>
          columns={columns}
          data={rows}
          pageIndex={q.pageIndex}
          pageSize={q.pageSize}
          pageCount={result.data?.pageCount ?? -1}
          rowCount={result.data?.rowCount}
          onPaginationChange={({ pageIndex, pageSize }) => {
            if (pageSize !== q.pageSize) q.setPageSize(pageSize);
            else q.setPageIndex(pageIndex);
          }}
          sorting={q.sorting}
          onSortingChange={q.setSorting}
          columnVisibility={columnVisibility}
          onColumnVisibilityChange={setColumnVisibility}
          columnOrder={columnOrder}
          onColumnOrderChange={(next) => setDataOrder(next.filter((id) => id !== "actions"))}
          enableRowSelection
          enableSelectAll
          getRowId={(row) => row.number}
          selectedRowIds={selected}
          onSelectedRowIdsChange={setSelected}
          bulkActions={
            <>
              <Text size="sm" className="font-medium">{selectedCount} selected</Text>
              <Button variant="secondary" size="sm">Export</Button>
              <Button variant="destructive" size="sm">Delete</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelected({})}>Cancel</Button>
            </>
          }
          loading={result.isLoading}
          fetching={result.isFetching && !result.isLoading}
          onRowClick={(row) => setOpened(row.number)}
          skeletonRows={10}
          emptyMessage="No invoices match your filters."
        />
      </TablePage>

      <Text size="xs" tone="muted" className="mt-3 block">
        Try it: reload for the cold skeleton, then sort a header, page, or type in search (debounced)
        to see the thin loading line while the previous rows stay put. Revisit a page you have already
        seen and its rows return instantly from cache, then revalidate.{" "}
        {opened ? `Opened ${opened} (whole-row click).` : "Click any row to open it."}
      </Text>
    </div>
  );
}

/* -------------------------------------------- section: EditableDataTable */

type TaxRate = {
  id: string;
  code: string;
  name: string;
  rate: number;
  domain: "sales" | "purchase";
  active: boolean;
};

function EditableDataTableDemo() {
  const [rows, setRows] = useState<TaxRate[]>([
    { id: "1", code: "STD22", name: "Standard rate", rate: 22, domain: "sales", active: true },
    { id: "2", code: "RED9", name: "Reduced rate", rate: 9, domain: "sales", active: true },
    { id: "3", code: "ZERO", name: "Zero-rated", rate: 0, domain: "sales", active: false },
    { id: "4", code: "PUR22", name: "Purchase standard", rate: 22, domain: "purchase", active: true },
  ]);

  const columns: ColumnDef<TaxRate>[] = [
    { id: "code", accessorKey: "code", header: "Code", meta: { editor: { type: "text" } } },
    { id: "name", accessorKey: "name", header: "Name", meta: { editor: { type: "text" } } },
    {
      id: "rate", accessorKey: "rate", header: "Rate %",
      meta: { align: "right", editor: { type: "number", min: 0, max: 100, step: 0.1 } },
    },
    {
      id: "domain", accessorKey: "domain", header: "Domain",
      meta: {
        editor: {
          type: "select",
          options: [
            { value: "sales", label: "Sales" },
            { value: "purchase", label: "Purchase" },
          ],
        },
      },
    },
    {
      id: "active", accessorKey: "active", header: "Active",
      meta: { align: "center", editor: { type: "switch" } },
    },
  ];

  return (
    <div className="w-full max-w-3xl">
      <Text size="xs" tone="muted" className="mb-2">
        Every cell edits inline: type into text / number (Enter commits, Esc reverts), pick the
        domain, toggle Active. Edits update the row in place — no navigation to a separate page.
      </Text>
      <EditableDataTable<TaxRate>
        columns={columns}
        data={rows}
        getRowId={(r) => r.id}
        onCellEdit={(rowId, columnId, value) =>
          setRows((prev) =>
            prev.map((r) => (r.id === rowId ? { ...r, [columnId]: value } : r))
          )
        }
      />
    </div>
  );
}

/* ------------------------------------------------ section: RowEditModal */

type Currency = {
  code: string;
  name: string;
  symbol: string;
  rate: number;
  isDefault: boolean;
};

function RowEditModalDemo() {
  const [rows, setRows] = useState<Currency[]>([
    { code: "EUR", name: "Euro", symbol: "€", rate: 1, isDefault: true },
    { code: "USD", name: "US Dollar", symbol: "$", rate: 0.92, isDefault: false },
    { code: "GBP", name: "Pound Sterling", symbol: "£", rate: 1.17, isDefault: false },
  ]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Currency | null>(null);

  const fields: RowEditField[] = [
    { key: "code", label: "Code", required: true, description: "ISO 4217, e.g. EUR." },
    { key: "name", label: "Name", required: true },
    { key: "symbol", label: "Symbol" },
    {
      key: "rate", label: "Rate to base", type: "number", step: 0.0001, required: true,
      validate: (v) => (Number(v) > 0 ? null : "Rate must be greater than zero."),
    },
    {
      key: "isDefault", label: "Default currency", type: "switch",
      description: "The org's base currency.",
    },
  ];

  const columns: ColumnDef<Currency>[] = [
    {
      id: "code", accessorKey: "code", header: "Code",
      cell: ({ row }) => <MonoCell value={row.original.code} />,
    },
    { id: "name", accessorKey: "name", header: "Name" },
    { id: "symbol", accessorKey: "symbol", header: "Symbol" },
    {
      id: "rate", accessorKey: "rate", header: "Rate", meta: { align: "right" },
      cell: ({ getValue }) => (getValue() as number).toFixed(4),
    },
    {
      id: "default", header: "",
      cell: ({ row }) => (row.original.isDefault ? <Badge variant="success">Default</Badge> : null),
    },
    {
      id: "actions", header: "", meta: { align: "right" },
      cell: ({ row }) => (
        <ActionsCell
          actions={[
            {
              label: "Edit", icon: Pencil,
              onClick: () => {
                setEditing(row.original);
                setOpen(true);
              },
            },
          ] as React.ComponentProps<typeof ActionsCell>["actions"]}
        />
      ),
    },
  ];

  return (
    <div className="w-full max-w-2xl">
      <Text size="xs" tone="muted" className="mb-2">
        Click Edit to change a currency in a modal instead of a separate page. Validation blocks a
        zero rate; Save is simulated (600ms) with a pending state, and closes on success.
      </Text>
      <DataTable columns={columns} data={rows} enableSorting={false} />
      <RowEditModal<Currency>
        open={open}
        onOpenChange={setOpen}
        title={editing ? `Edit ${editing.code}` : "Edit currency"}
        description="Update the currency and save without leaving the list."
        fields={fields}
        value={editing}
        onSubmit={async (next) => {
          await new Promise((resolve) => setTimeout(resolve, 600));
          setRows((prev) => prev.map((c) => (c.code === editing?.code ? next : c)));
        }}
      />
    </div>
  );
}

/* ------------------------------------------------ section: Sidebar (organism) */

function SidebarDemo() {
  const [active, setActive] = useState("invoices");
  const leaf = (id: string, label: string) => (
    <SidebarMenuItem>
      <SidebarMenuButton isActive={active === id} onClick={() => setActive(id)}>{label}</SidebarMenuButton>
    </SidebarMenuItem>
  );
  return (
    <div className="h-[540px] w-full overflow-hidden rounded-lg border border-border">
      <SidebarProvider defaultOpenGroups={["sales"]}>
        <div className="flex h-full w-full">
          <Sidebar>
            <SidebarHeader><SidebarBrand /></SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton groupId="sales" icon={<BadgeDollarSign />} tooltip="Sales">Sales</SidebarMenuButton>
                  <SidebarMenuSub groupId="sales">
                    {leaf("invoices", "Invoices")}{leaf("offers", "Offers")}{leaf("waybills", "Waybills")}
                  </SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton groupId="purchase" icon={<Receipt />} tooltip="Purchase">Purchase</SidebarMenuButton>
                  <SidebarMenuSub groupId="purchase">{leaf("bills", "Bills")}{leaf("orders", "Orders")}</SidebarMenuSub>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton icon={<ScrollText />} tooltip="Ledger" isActive={active === "ledger"} onClick={() => setActive("ledger")}>Ledger</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton icon={<Handshake />} tooltip="CRM" isActive={active === "crm"} onClick={() => setActive("crm")}>CRM</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton icon={<PieChart />} tooltip="Reports" isActive={active === "reports"} onClick={() => setActive("reports")}>Reports</SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton icon={<Settings />} tooltip="Settings" isActive={active === "settings"} onClick={() => setActive("settings")}>Settings</SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter><SidebarTrigger /></SidebarFooter>
          </Sidebar>
          <main className="min-w-0 flex-1 overflow-y-auto p-6">
            <H1 className="capitalize">{active}</H1>
            <Text tone="muted" className="mt-1">
              Collapse the rail (bottom-left): sub-items close first, then it narrows to icons —
              which stay centered and never move. Open a group to see the grid accordion.
            </Text>
          </main>
        </div>
      </SidebarProvider>
    </div>
  );
}

/* ------------------------------------------------- atomic-design registry */

type SectionDef = { id: string; label: string; render: () => React.ReactNode };
type GroupDef = { id: string; label: string; icon: React.ReactNode; sections: SectionDef[] };

const GROUPS: GroupDef[] = [
  {
    id: "foundations", label: "Foundations", icon: <Palette />,
    sections: [
      {
        id: "brand", label: "Brand", render: () => (
          <>
            <div className="flex items-end gap-6">
              <Logo size={48} /><Logo size={32} /><Logo size={24} /><Logo size={16} />
            </div>
            <div className="flex items-center gap-3">
              <div className="flex size-14 items-center justify-center rounded-lg bg-primary"><Logo size={32} className="text-primary-foreground" /></div>
              <div className="flex size-14 items-center justify-center rounded-lg bg-foreground"><Logo size={32} className="text-background" /></div>
              <div className="flex size-14 items-center justify-center rounded-lg border border-border"><Logo size={32} /></div>
            </div>
            <Text size="xs" tone="muted" className="w-full">
              `Logo` defaults to `text-primary` — tracks the brand/action color per theme (ink in
              light, amber in dark). Override via `className`.
            </Text>
          </>
        ),
      },
      { id: "colors", label: "Colors", render: () => <ColorsSection /> },
      {
        id: "typography", label: "Typography", render: () => (
          <div className="flex w-full max-w-xl flex-col gap-3">
            <Text size="xs" tone="muted">
              Use the <strong>text S/M/L</strong> control (top-right) — one knob (`--font-scale`)
              scales everything and respects your browser font size.
            </Text>
            <H1>H1 — Page title (24)</H1>
            <H2>H2 — Section heading (20)</H2>
            <H3>H3 — Subsection (16, weight-driven)</H3>
            <Text size="lg">Text lg — 18px</Text>
            <Text>Text — body, 14px (default)</Text>
            <Text size="xs" tone="muted">Text xs muted — 12px, captions & meta</Text>
            <Text weight="medium">Text — medium weight for emphasis</Text>
            <Text mono>Text mono — 1234567890 · €1,240.00 (tabular figures)</Text>
            <Separator className="my-1" />
            <Label>Standalone Label</Label>
            <div className="flex h-5 items-center gap-3">
              <Text as="span">Left</Text><Separator orientation="vertical" /><Text as="span">Right</Text>
            </div>
          </div>
        ),
      },
    ],
  },
  {
    id: "atoms", label: "Atoms", icon: <Atom />,
    sections: [
      {
        id: "buttons", label: "Buttons", render: () => (
          <>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button size="icon" aria-label="Search"><Search /></Button>
            <Button disabled>Disabled</Button>
            <Button><Save /> With icon</Button>
          </>
        ),
      },
      {
        id: "badges", label: "Badges", render: () => (
          <>
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="success">Success</Badge>
            <Badge variant="warning">Warning</Badge>
            <Badge variant="destructive">Destructive</Badge>
            <Badge variant="outline">Outline</Badge>
          </>
        ),
      },
      {
        id: "action-pills", label: "Action pills", render: () => <ActionPillDemo />,
      },
      {
        id: "avatar", label: "Avatar", render: () => (
          <div className="flex flex-wrap items-center gap-4">
            {["Kamarajura OÜ", "Triiberg AS", "Põhjala Logistika", "Sinilill Kohvik", "Foam Labs"].map((n) => (
              <div key={n} className="flex items-center gap-2">
                <Avatar name={n} colorKey={n} />
                <Text size="sm">{n}</Text>
              </div>
            ))}
            <div className="flex items-center gap-3">
              <Avatar name="Acme" size={20} />
              <Avatar name="Acme" size={28} />
              <Avatar name="Acme" size={40} />
              <Avatar name="Acme" size={56} />
            </div>
          </div>
        ),
      },
      {
        id: "inputs", label: "Inputs & Field", render: () => (
          <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="email" description="We never share it." required>
              <Input id="email" type="email" placeholder="you@trf.is" />
            </Field>
            <Field label="Amount" htmlFor="amount" error="Must be a positive number.">
              <Input id="amount" type="number" defaultValue={-5} />
            </Field>
            <Field label="Due date" htmlFor="due" description="Native date input — calendar icon follows the theme.">
              <Input id="due" type="date" defaultValue="2026-06-09" />
            </Field>
            <Field label="Comment" htmlFor="comment" className="sm:col-span-2">
              <Textarea id="comment" placeholder="Free-text notes…" />
            </Field>
            <SearchInputDemo />
          </div>
        ),
      },
      {
        id: "copyfield", label: "Copy field", render: () => (
          <div className="grid w-full max-w-2xl gap-3">
            <CopyField value="trf_sk_3f9a2b7c8d1e4f5061728394a5b6c7d8" />
            <CopyField value="https://trf.is/invite/9c1f4e2a-one-time-link" />
            <CopyField value="Invoice #1042" mono={false} />
          </div>
        ),
      },
      {
        id: "choices", label: "Choice controls", render: () => (
          <>
            <label className="flex items-center gap-2 text-sm"><Checkbox defaultChecked /> Send a copy by email</label>
            <label className="flex items-center gap-2 text-sm"><Switch defaultChecked /> Auto-confirm</label>
            <RadioGroup defaultValue="net14" className="gap-2">
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="net14" /> Net 14</label>
              <label className="flex items-center gap-2 text-sm"><RadioGroupItem value="net30" /> Net 30</label>
            </RadioGroup>
          </>
        ),
      },
      {
        id: "select", label: "Select", render: () => (
          <div className="flex flex-wrap items-start gap-4">
            <Field label="Document type" htmlFor="doctype" className="w-64">
              <Select defaultValue="invoice">
                <SelectTrigger id="doctype"><SelectValue placeholder="Pick a type…" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="invoice">Invoice</SelectItem>
                  <SelectItem value="offer">Offer</SelectItem>
                  <SelectItem value="waybill">Waybill</SelectItem>
                </SelectContent>
              </Select>
            </Field>
            <SimpleSelectDemo />
          </div>
        ),
      },
      {
        id: "statusbadge", label: "Status badge", render: () => (
          <>
            <StatusBadge tone="neutral">Draft</StatusBadge>
            <StatusBadge tone="info">Confirmed</StatusBadge>
            <StatusBadge tone="success">Paid</StatusBadge>
            <StatusBadge tone="warning">Overdue</StatusBadge>
            <StatusBadge tone="error">Cancelled</StatusBadge>
          </>
        ),
      },
      { id: "combobox", label: "Combobox", render: () => <ComboboxDemo /> },
      { id: "async-combobox", label: "Async combobox", render: () => <AsyncComboboxDemo /> },
      { id: "entity-combobox", label: "Entity combobox", render: () => <EntityComboboxDemo /> },
      { id: "org-switcher", label: "Org switcher", render: () => <OrgSwitcherDemo /> },
      { id: "datepicker", label: "Date & time pickers", render: () => <DatePickerDemo /> },
      {
        id: "spinner", label: "Spinner", render: () => (
          <><Spinner size="sm" /><Spinner size="md" /><Spinner size="lg" /></>
        ),
      },
      {
        id: "tooltip", label: "Tooltip", render: () => (
          <Tooltip>
            <TooltipTrigger asChild><Button variant="secondary" size="sm"><Info /> Hover me</Button></TooltipTrigger>
            <TooltipContent>Reference number is optional.</TooltipContent>
          </Tooltip>
        ),
      },
      {
        id: "dropdown", label: "Dropdown menu", render: () => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" aria-label="Row actions"><MoreHorizontal /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Invoice #1042</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem><Pencil /> Edit <DropdownMenuShortcut>⌘E</DropdownMenuShortcut></DropdownMenuItem>
              <DropdownMenuItem><Copy /> Duplicate</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem destructive><Trash2 /> Delete</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
  },
  {
    id: "molecules", label: "Molecules", icon: <Combine />,
    sections: [
      {
        id: "alerts", label: "Alerts", render: () => (
          <div className="flex w-full max-w-xl flex-col gap-3">
            <Alert><Info /><div><AlertTitle>Heads up</AlertTitle><AlertDescription>This invoice has no line items yet.</AlertDescription></div></Alert>
            <Alert variant="destructive"><Trash2 /><div><AlertTitle>Could not save</AlertTitle><AlertDescription>The customer field is required.</AlertDescription></div></Alert>
          </div>
        ),
      },
      {
        id: "secretreveal", label: "Secret reveal", render: () => (
          <div className="w-full max-w-xl">
            <SecretReveal
              value="trf_sk_3f9a2b7c8d1e4f5061728394a5b6c7d8"
              message="Copy your API key — it won't be shown again"
              onDismiss={() => {}}
            />
          </div>
        ),
      },
      {
        id: "skeleton", label: "Skeleton", render: () => (
          <div className="w-full max-w-sm rounded-lg border border-border p-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-2/3" />
                <Skeleton className="h-3 w-1/3" />
              </div>
            </div>
            <Skeleton className="mt-4 h-20 w-full" />
          </div>
        ),
      },
      {
        id: "states", label: "Empty & Loading", render: () => (
          <>
            <LoadingState className="w-64 rounded-lg border border-border" />
            <EmptyState
              className="w-72"
              icon={<Inbox />}
              title="No invoices yet"
              description="Create your first invoice to get started."
              action={<Button size="sm">New invoice</Button>}
            />
          </>
        ),
      },
      {
        id: "infogrid", label: "Info grid", render: () => (
          <div className="w-full max-w-lg rounded-lg border border-border p-5">
            <InfoGrid columns={2}>
              <InfoField label="Customer">Triiberg AS</InfoField>
              <InfoField label="Status"><Badge variant="success">Paid</Badge></InfoField>
              <InfoField label="Issued">2026-05-14</InfoField>
              <InfoField label="Due">2026-05-28</InfoField>
              <InfoField label="Reference">INV-1042</InfoField>
              <InfoField label="Payable"><Text mono>€1,240.00</Text></InfoField>
            </InfoGrid>
          </div>
        ),
      },
      { id: "markdown", label: "Markdown", render: () => <MarkdownDemo /> },
      { id: "radiocard", label: "Radio card", render: () => <RadioCardDemo /> },
      { id: "stepcard", label: "Step card", render: () => <StepCardDemo /> },
      { id: "attachment", label: "Attachment", render: () => <AttachmentDemo /> },
      { id: "attachment-dropzone", label: "Attachment dropzone", render: () => <AttachmentDropzoneDemo /> },
      {
        id: "tabs", label: "Tabs", render: () => (
          <Tabs defaultValue="overview" className="w-full max-w-md">
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="lines">Line items</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="overview"><Text tone="muted">Invoice summary, customer, totals.</Text></TabsContent>
            <TabsContent value="lines"><Text tone="muted">The editable line items table.</Text></TabsContent>
            <TabsContent value="history"><Text tone="muted">Status changes and audit trail.</Text></TabsContent>
          </Tabs>
        ),
      },
      {
        id: "card", label: "Card & Dialog", render: () => (
          <Card className="w-full max-w-sm">
            <CardHeader><CardTitle>Invoice #1042</CardTitle><CardDescription>Confirmed · 100 Meedia Brändi OÜ</CardDescription></CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payable</span>
                <span className="font-mono font-medium tabular-nums">€1,240.00</span>
              </div>
              <Separator className="my-3" />
              <Badge variant="success">Paid</Badge>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Dialog>
                <DialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 /> Cancel</Button></DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel invoice #1042?</DialogTitle>
                    <DialogDescription>This action cannot be undone. Focus is trapped here; press Esc to close.</DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild><Button variant="secondary">Keep it</Button></DialogClose>
                    <DialogClose asChild><Button variant="destructive">Yes, cancel</Button></DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button size="sm">View</Button>
            </CardFooter>
          </Card>
        ),
      },
      { id: "confirm", label: "Confirm dialog", render: () => <ConfirmDialogDemo /> },
      { id: "floating-window", label: "Floating window", render: () => <FloatingWindowDemo /> },
    ],
  },
  {
    id: "organisms", label: "Organisms", icon: <Layers />,
    sections: [
      {
        id: "layout", label: "Layout & page", render: () => (
          <div className="flex w-full flex-col gap-5">
            <div className="rounded-lg border border-border p-4">
              <PageHeader
                title="Invoices"
                description="Sales documents for this organisation."
                actions={<><Button variant="secondary" size="sm">Export</Button><Button size="sm">New invoice</Button></>}
              />
              <Text size="xs" tone="muted">↑ `PageHeader` — title · description · actions</Text>
            </div>
            <div className="rounded-lg border border-border p-4">
              <Row gap={3}>
                <Button variant="secondary" size="sm">Back</Button>
                <Grow><Input placeholder="Grow fills the remaining space" /></Grow>
                <Button size="sm">Save</Button>
              </Row>
              <Text size="xs" tone="muted" className="mt-2">↑ `Row` with a `Grow` in the middle</Text>
            </div>
            <div className="rounded-lg border border-border p-4">
              <Stack gap={2}>
                <div className="rounded-md bg-muted px-3 py-2 text-sm">Stack item 1</div>
                <div className="rounded-md bg-muted px-3 py-2 text-sm">Stack item 2</div>
                <div className="rounded-md bg-muted px-3 py-2 text-sm">Stack item 3</div>
              </Stack>
              <Text size="xs" tone="muted" className="mt-2">↑ `Stack` — vertical, even gap. `Page` wraps it in a centered, width-capped container.</Text>
            </div>
          </div>
        ),
      },
      {
        id: "table", label: "Table (primitive)", render: () => (
          <div className="w-full max-w-md overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader><TableRow><TableHead>Line</TableHead><TableHead className="text-right">Amount</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow><TableCell>Net</TableCell><TableCell className="text-right font-mono tabular-nums">€1,000.00</TableCell></TableRow>
                <TableRow><TableCell>VAT 22%</TableCell><TableCell className="text-right font-mono tabular-nums">€220.00</TableCell></TableRow>
              </TableBody>
              <TableFooter><TableRow><TableCell>Total</TableCell><TableCell className="text-right font-mono tabular-nums">€1,220.00</TableCell></TableRow></TableFooter>
            </Table>
          </div>
        ),
      },
      {
        id: "statement-table", label: "Statement table", render: () => <StatementTableDemo />,
      },
      {
        id: "editable-grid", label: "Editable grid", render: () => <EditableGridDemo />,
      },
      {
        id: "tablecard", label: "Table card", render: () => (
          <TableCard
            className="w-full max-w-md"
            title="Recent invoices"
            actions={<Button size="sm" variant="secondary">Export</Button>}
            footer={<Text size="xs" tone="muted">3 documents</Text>}
          >
            <Table>
              <TableHeader><TableRow><TableHead>Number</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
              <TableBody>
                <TableRow><TableCell>1042</TableCell><TableCell className="text-right font-mono tabular-nums">€1,240.00</TableCell></TableRow>
                <TableRow><TableCell>1041</TableCell><TableCell className="text-right font-mono tabular-nums">€380.50</TableCell></TableRow>
                <TableRow><TableCell>1040</TableCell><TableCell className="text-right font-mono tabular-nums">€96.00</TableCell></TableRow>
              </TableBody>
            </Table>
          </TableCard>
        ),
      },
      { id: "datatable", label: "DataTable", render: () => <InvoiceTable /> },
      { id: "server-datatable", label: "ServerDataTable", render: () => <ServerDataTableDemo /> },
      { id: "editable-datatable", label: "Editable data table", render: () => <EditableDataTableDemo /> },
      { id: "row-edit-modal", label: "Row edit modal", render: () => <RowEditModalDemo /> },
      { id: "chart", label: "Chart", render: () => <ChartDemo /> },
      { id: "sidebar", label: "App shell / Sidebar", render: () => <SidebarDemo /> },
    ],
  },
];

/* ------------------------------------------------------------------ app */

const THEME_OPTIONS = [
  { value: "trivis", label: "Trivis" },
  { value: "neutral", label: "Neutral" },
  { value: "amber", label: "Amber" },
  { value: "coffee", label: "Coffee" },
  { value: "claude", label: "Claude" },
  { value: "tangerine", label: "Tangerine" },
  { value: "sky", label: "Sky" },
  { value: "mars", label: "Mars" },
  { value: "disco", label: "Disco" },
  { value: "modern", label: "Modern" },
];

/* Four representative swatches for a theme. The wrapper carries the theme's class (+ dark)
 * so `bg-primary` etc. resolve to THAT theme's tokens in the current mode — letting the
 * dropdown preview every theme at once. "trivis" is the base (no class). */
function ThemeSwatches({ theme, dark }: { theme: string; dark: boolean }) {
  return (
    <span className={cn("flex shrink-0 items-center gap-0.5", theme !== "trivis" && `theme-${theme}`, dark && "dark")}>
      {["bg-primary", "bg-secondary", "bg-accent", "bg-muted"].map((c) => (
        <span key={c} className={cn("size-3 rounded-full ring-1 ring-black/10 dark:ring-white/20", c)} />
      ))}
    </span>
  );
}

function ThemeToggle({ dark, onToggle }: { dark: boolean; onToggle: () => void }) {
  const { collapsed } = useSidebar();
  return (
    <div
      className={cn(
        "flex items-center overflow-hidden transition-[max-width,opacity] duration-200",
        collapsed ? "max-w-0 opacity-0" : "max-w-[100px] opacity-100"
      )}
    >
      <Button variant="ghost" size="icon" onClick={onToggle} title="Toggle theme" aria-label="Toggle theme">
        {dark ? <Sun /> : <Moon />}
      </Button>
    </div>
  );
}

export function App() {
  const [dark, setDark] = useState(false);
  // "trivis" = the default brand theme (base :root/.dark, no class). Other values add a theme-* class.
  const [theme, setTheme] = useState("trivis");
  const [radius, setRadius] = useState(8);
  const [textSize, setTextSize] = useState<SizeBracket>("M");
  const [active, setActive] = useState("buttons");

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
  useEffect(() => {
    const el = document.documentElement;
    [...el.classList].filter((c) => c.startsWith("theme-")).forEach((c) => el.classList.remove(c));
    if (theme && theme !== "trivis") el.classList.add(`theme-${theme}`);
  }, [theme]);
  useEffect(() => { document.documentElement.style.setProperty("--radius", `${radius}px`); }, [radius]);
  useEffect(() => { document.documentElement.style.setProperty("--font-scale", String(FONT_SCALE[textSize])); }, [textSize]);

  const activeSection = useMemo(() => {
    for (const g of GROUPS) for (const s of g.sections) if (s.id === active) return s;
    return GROUPS[0].sections[0];
  }, [active]);

  return (
    <TooltipProvider delayDuration={200}>
      <AppShell
        defaultOpenGroups={GROUPS.map((g) => g.id)}
        sidebar={
          <Sidebar>
            <SidebarHeader><SidebarBrand label="trf-ui2" version={__UI2_VERSION__} /></SidebarHeader>
            <SidebarContent>
              <SidebarMenu>
                {GROUPS.map((g) => (
                  <SidebarMenuItem key={g.id}>
                    <SidebarMenuButton groupId={g.id} icon={g.icon} tooltip={g.label}>{g.label}</SidebarMenuButton>
                    <SidebarMenuSub groupId={g.id}>
                      {g.sections.map((s) => (
                        <SidebarMenuItem key={s.id}>
                          <SidebarMenuButton isActive={active === s.id} onClick={() => setActive(s.id)}>{s.label}</SidebarMenuButton>
                        </SidebarMenuItem>
                      ))}
                    </SidebarMenuSub>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarContent>
            <SidebarFooter>
              <ThemeToggle dark={dark} onToggle={() => setDark((d) => !d)} />
              <SidebarTrigger />
            </SidebarFooter>
          </Sidebar>
        }
      >
        {/* Top bar */}
        <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-background/80 px-6 py-3 backdrop-blur">
          <div className="flex items-baseline gap-2">
            <H2>{activeSection.label}</H2>
            <Text size="xs" tone="muted">kitchen sink</Text>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              theme
              <Select value={theme} onValueChange={setTheme}>
                <SelectTrigger className="w-52">
                  <div className="flex items-center gap-2">
                    <ThemeSwatches theme={theme} dark={dark} />
                    {THEME_OPTIONS.find((t) => t.value === theme)?.label}
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {THEME_OPTIONS.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      <span className="flex items-center gap-2">
                        <ThemeSwatches theme={t.value} dark={dark} />
                        {t.label}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              text
              {(Object.keys(FONT_SCALE) as SizeBracket[]).map((b) => (
                <Button key={b} variant={textSize === b ? "primary" : "secondary"} size="sm" onClick={() => setTextSize(b)}>{b}</Button>
              ))}
            </div>
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              radius {radius}px
              <input type="range" min={0} max={20} value={radius} onChange={(e) => setRadius(Number(e.target.value))} />
            </label>
          </div>
        </div>

        {/* Active section. The ServerDataTable section runs full-bleed to show a
            genuine full-width table (real apps get this from their AppLayout). */}
        {activeSection.id === "server-datatable" ? (
          <div className="w-full px-6 py-8">{activeSection.render()}</div>
        ) : (
          <div className="mx-auto w-full max-w-5xl px-6 py-8">
            <div className="flex flex-wrap items-start gap-4">{activeSection.render()}</div>
          </div>
        )}
      </AppShell>
    </TooltipProvider>
  );
}
