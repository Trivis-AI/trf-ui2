# Button

> **Status: ready** · `import { Button } from "@trf/ui2"` · source: `src/components/ui/button.tsx`

The standard clickable action. Built on a native `<button>`; supports `asChild` to render as
another element (e.g. a router `<Link>`).

## Props

| Prop | Type | Default | Notes |
|---|---|---|---|
| `variant` | `primary \| secondary \| destructive \| ghost \| link` | `primary` | Visual intent. |
| `size` | `sm \| md \| lg \| icon` | `md` | `icon` is square; pass an `aria-label`. |
| `asChild` | `boolean` | `false` | Render the child as the button, merging styles onto it. |
| ...rest | `button` attributes | — | `onClick`, `disabled`, `type`, etc. |

## Usage

```tsx
import { Button } from "@trf/ui2";
import { Save, Search } from "lucide-react";

<Button onClick={save}><Save /> Save</Button>
<Button variant="destructive" size="sm">Delete</Button>
<Button size="icon" aria-label="Search"><Search /></Button>

// As a link (styles merge onto the child):
<Button asChild variant="link"><a href="/invoices">All invoices</a></Button>
```

## Rules

- **Action copy is short** (1–3 words), Sentence case.
- **One primary button per view/section.** Use `secondary`/`ghost` for the rest.
- **Destructive actions** use `variant="destructive"` and should confirm via a Dialog.
- Icons are **Lucide only**, auto-sized to `size-4`. Icon-only → `aria-label`.
- Don't wrap Button to add a className — pass `className`; `cn()` merges it safely.

## Related

- [05 Iconography](../05-iconography.md) · [13 AI Coding Guidelines](../13-ai-coding-guidelines.md)
- Pattern: destructive actions → confirm with `Dialog`.
