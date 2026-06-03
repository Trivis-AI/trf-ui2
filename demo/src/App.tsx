import { useEffect, useState } from "react";
import { Moon, Sun, Search, Save, Trash2, Info, Inbox } from "lucide-react";
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  type ColumnDef,
  DataTable,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  Field,
  Input,
  Label,
  LoadingState,
  RadioGroup,
  RadioGroupItem,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Spinner,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@trf/ui2";

const slug = (s: string) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function Section({
  title,
  nav,
  children,
}: {
  title: string;
  /** Short label for the table of contents (defaults to the title). */
  nav?: string;
  children: React.ReactNode;
}) {
  return (
    <section id={slug(title)} data-nav={nav ?? title} className="flex scroll-mt-32 flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
  );
}

/** Auto-built from the rendered sections, so new sections show up automatically. */
function Toc() {
  const [items, setItems] = useState<{ id: string; label: string }[]>([]);
  useEffect(() => {
    const secs = [...document.querySelectorAll<HTMLElement>("section[data-nav]")];
    setItems(secs.map((s) => ({ id: s.id, label: s.dataset.nav ?? s.id })));
  }, []);
  return (
    <nav className="flex flex-wrap gap-1.5">
      {items.map((it) => (
        <a
          key={it.id}
          href={`#${it.id}`}
          className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          {it.label}
        </a>
      ))}
    </nav>
  );
}

type Invoice = {
  number: string;
  customer: string;
  status: "Draft" | "Confirmed" | "Paid";
  total: number;
};

const STATUS_VARIANT = {
  Draft: "secondary",
  Confirmed: "default",
  Paid: "success",
} as const;

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
      id: "status",
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const s = getValue() as Invoice["status"];
        return <Badge variant={STATUS_VARIANT[s]}>{s}</Badge>;
      },
    },
    {
      id: "total",
      accessorKey: "total",
      header: "Total",
      meta: { editable: true, align: "right" },
      cell: ({ getValue }) =>
        `€${(getValue() as number).toLocaleString("en", { minimumFractionDigits: 2 })}`,
    },
  ];

  return (
    <DataTable
      columns={columns}
      data={rows}
      enableSorting
      enableGlobalFilter
      enableColumnReorder
      onCellEdit={(rowIndex, columnId, value) =>
        setRows((prev) =>
          prev.map((r, i) =>
            i === rowIndex
              ? { ...r, [columnId]: columnId === "total" ? Number(value) || 0 : value }
              : r
          )
        )
      }
    />
  );
}

export function App() {
  const [dark, setDark] = useState(false);
  const [radius, setRadius] = useState(8);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => {
    // Demonstrates the "change one number" token: drive --radius live.
    document.documentElement.style.setProperty("--radius", `${radius}px`);
  }, [radius]);

  return (
    <TooltipProvider delayDuration={200}>
    <div className="min-h-screen">
      {/* Sticky header + table of contents */}
      <div className="sticky top-0 z-20 border-b border-border bg-background/80 backdrop-blur">
        <header className="flex items-center justify-between gap-4 px-6 py-3">
          <div className="flex items-baseline gap-3">
            <span className="text-lg font-semibold">trf-ui2</span>
            <span className="text-sm text-muted-foreground">kitchen sink</span>
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              radius {radius}px
              <input
                type="range"
                min={0}
                max={20}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
              />
            </label>
            <Button variant="secondary" size="sm" onClick={() => setDark((d) => !d)}>
              {dark ? <Sun /> : <Moon />}
              {dark ? "Light" : "Dark"}
            </Button>
          </div>
        </header>
        <div className="px-6 pb-2">
          <Toc />
        </div>
      </div>

      <main className="mx-auto flex max-w-4xl flex-col gap-10 px-6 py-10">
        <Section title="Buttons">
          <Button variant="primary">Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
          <Button size="sm">Small</Button>
          <Button size="lg">Large</Button>
          <Button size="icon" aria-label="Search">
            <Search />
          </Button>
          <Button disabled>Disabled</Button>
          <Button>
            <Save /> With icon
          </Button>
        </Section>

        <Section title="Badges">
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warning">Warning</Badge>
          <Badge variant="destructive">Destructive</Badge>
          <Badge variant="outline">Outline</Badge>
        </Section>

        <Section title="Forms">
          <div className="grid w-full gap-4 sm:grid-cols-2">
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
        </Section>

        <Section title="DataTable — sort · filter · drag-reorder columns · inline edit" nav="DataTable">
          <div className="w-full">
            <p className="mb-2 text-xs text-muted-foreground">
              Click headers to sort · type to filter · drag the grip to reorder columns · click
              Customer or Total to edit inline.
            </p>
            <InvoiceTable />
          </div>
        </Section>

        <Section title="Table (primitive)" nav="Table">
          <div className="w-full max-w-md overflow-hidden rounded-lg border border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Line</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>Net</TableCell>
                  <TableCell className="text-right">€1,000.00</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>VAT 22%</TableCell>
                  <TableCell className="text-right">€220.00</TableCell>
                </TableRow>
              </TableBody>
              <TableFooter>
                <TableRow>
                  <TableCell>Total</TableCell>
                  <TableCell className="text-right">€1,220.00</TableCell>
                </TableRow>
              </TableFooter>
            </Table>
          </div>
        </Section>

        <Section title="Typography & dividers" nav="Typography">
          <div className="flex w-full max-w-md flex-col gap-2">
            <p className="text-lg font-semibold">Heading — lg / semibold</p>
            <p className="text-sm">Body text — sm / regular</p>
            <p className="text-sm text-muted-foreground">Muted text — sm / muted-foreground</p>
            <Label>Standalone Label</Label>
            <Separator className="my-2" />
            <div className="flex h-5 items-center gap-3 text-sm">
              <span>Left</span>
              <Separator orientation="vertical" />
              <span>Right</span>
            </div>
          </div>
        </Section>

        <Section title="Select">
          <Field label="Document type" htmlFor="doctype" className="w-64">
            <Select defaultValue="invoice">
              <SelectTrigger id="doctype">
                <SelectValue placeholder="Pick a type…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="invoice">Invoice</SelectItem>
                <SelectItem value="offer">Offer</SelectItem>
                <SelectItem value="waybill">Waybill</SelectItem>
              </SelectContent>
            </Select>
          </Field>
        </Section>

        <Section title="Choice controls">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox defaultChecked /> Send a copy by email
          </label>
          <label className="flex items-center gap-2 text-sm">
            <Switch defaultChecked /> Auto-confirm
          </label>
          <RadioGroup defaultValue="net14" className="gap-2">
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="net14" /> Net 14
            </label>
            <label className="flex items-center gap-2 text-sm">
              <RadioGroupItem value="net30" /> Net 30
            </label>
          </RadioGroup>
        </Section>

        <Section title="Tooltip">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="secondary" size="sm">
                <Info /> Hover me
              </Button>
            </TooltipTrigger>
            <TooltipContent>Reference number is optional.</TooltipContent>
          </Tooltip>
        </Section>

        <Section title="Alerts">
          <div className="flex w-full flex-col gap-3">
            <Alert>
              <Info />
              <div>
                <AlertTitle>Heads up</AlertTitle>
                <AlertDescription>This invoice has no line items yet.</AlertDescription>
              </div>
            </Alert>
            <Alert variant="destructive">
              <Trash2 />
              <div>
                <AlertTitle>Could not save</AlertTitle>
                <AlertDescription>The customer field is required.</AlertDescription>
              </div>
            </Alert>
          </div>
        </Section>

        <Section title="Spinner / states">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
          <div className="w-full" />
          <LoadingState className="w-64 rounded-lg border border-border" />
          <EmptyState
            className="w-72"
            icon={<Inbox />}
            title="No invoices yet"
            description="Create your first invoice to get started."
            action={<Button size="sm">New invoice</Button>}
          />
        </Section>

        <Section title="Card + Dialog">
          <Card className="w-full max-w-sm">
            <CardHeader>
              <CardTitle>Invoice #1042</CardTitle>
              <CardDescription>Confirmed · 100 Meedia Brändi OÜ</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Payable</span>
                <span className="font-medium">€1,240.00</span>
              </div>
              <Separator className="my-3" />
              <Badge variant="success">Paid</Badge>
            </CardContent>
            <CardFooter className="justify-end gap-2">
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 /> Cancel
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Cancel invoice #1042?</DialogTitle>
                    <DialogDescription>
                      This action cannot be undone. Focus is trapped here; press Esc to close.
                    </DialogDescription>
                  </DialogHeader>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button variant="secondary">Keep it</Button>
                    </DialogClose>
                    <DialogClose asChild>
                      <Button variant="destructive">Yes, cancel</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
              <Button size="sm">View</Button>
            </CardFooter>
          </Card>
        </Section>
      </main>
    </div>
    </TooltipProvider>
  );
}
