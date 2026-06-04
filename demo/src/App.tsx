import { useEffect, useMemo, useState } from "react";
import {
  Moon, Sun, Search, Save, Trash2, Info, Inbox,
  BadgeDollarSign, Receipt, ScrollText, Handshake, PieChart, Settings,
  Palette, Atom, Combine, Layers, MoreHorizontal, Copy, Pencil,
} from "lucide-react";
import {
  Alert, AlertDescription, AlertTitle,
  AppShell, Badge, Button, cn, type ColumnDef, DataTable,
  Sidebar, SidebarContent, SidebarFooter, SidebarHeader, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarMenuSub, SidebarProvider, SidebarTrigger, useSidebar,
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
  Checkbox, Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle, DialogTrigger, DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger,
  EmptyState, Field, Grow, H1, H2, H3, Input, Label, LoadingState,
  Logo, PageHeader, Row, Stack, Text, RadioGroup, RadioGroupItem, Select, SelectContent,
  SelectItem, SelectTrigger, SelectValue, Separator, Spinner, Switch, Table, TableBody, TableCell,
  TableFooter, TableHead, TableHeader, TableRow, Textarea, Tooltip, TooltipContent,
  TooltipProvider, TooltipTrigger,
} from "@trf/ui2";

/* ------------------------------------------------------------------ helpers */

const FONT_SCALE = { S: 0.9, M: 1, L: 1.15 } as const;
type SizeBracket = keyof typeof FONT_SCALE;

function SidebarBrand({ label = "TRF" }: { label?: string }) {
  const { collapsed } = useSidebar();
  return (
    <div className="flex w-full items-center gap-2 overflow-hidden px-4 py-3">
      <Logo size={24} className="shrink-0" />
      <span
        className={cn(
          "overflow-hidden whitespace-nowrap font-semibold transition-[max-width,opacity] duration-200",
          collapsed ? "max-w-0 opacity-0" : "max-w-[10rem] opacity-100"
        )}
      >
        {label}
      </span>
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
        id: "inputs", label: "Inputs & Field", render: () => (
          <div className="grid w-full max-w-2xl gap-4 sm:grid-cols-2">
            <Field label="Email" htmlFor="email" description="We never share it." required>
              <Input id="email" type="email" placeholder="you@trf.is" />
            </Field>
            <Field label="Amount" htmlFor="amount" error="Must be a positive number.">
              <Input id="amount" type="number" defaultValue={-5} />
            </Field>
            <Field label="Comment" htmlFor="comment" className="sm:col-span-2">
              <Textarea id="comment" placeholder="Free-text notes…" />
            </Field>
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
        ),
      },
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
      { id: "datatable", label: "DataTable", render: () => <InvoiceTable /> },
      { id: "sidebar", label: "App shell / Sidebar", render: () => <SidebarDemo /> },
    ],
  },
];

/* ------------------------------------------------------------------ app */

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
  const [radius, setRadius] = useState(8);
  const [textSize, setTextSize] = useState<SizeBracket>("M");
  const [active, setActive] = useState("buttons");

  useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]);
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
            <SidebarHeader><SidebarBrand label="trf-ui2" /></SidebarHeader>
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

        {/* Active section */}
        <div className="mx-auto w-full max-w-5xl px-6 py-8">
          <div className="flex flex-wrap items-start gap-4">{activeSection.render()}</div>
        </div>
      </AppShell>
    </TooltipProvider>
  );
}
