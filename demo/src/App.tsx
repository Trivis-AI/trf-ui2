import { useEffect, useState } from "react";
import { Moon, Sun, Search, Save, Trash2 } from "lucide-react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  Separator,
  Spinner,
  Textarea,
} from "@trf/ui2";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </h2>
      <div className="flex flex-wrap items-start gap-3">{children}</div>
    </section>
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
    <div className="min-h-screen">
      {/* Header / controls */}
      <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-border bg-background/80 px-6 py-3 backdrop-blur">
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

        <Section title="Spinner">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
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
  );
}
