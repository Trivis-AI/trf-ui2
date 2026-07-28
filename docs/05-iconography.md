# 05 — Iconography

> **Status: ready**

## One library: Lucide

**[lucide-react](https://lucide.dev) is the only icon library.** No mixing, ever. It's already
used across every TRF app and is the default for this system.

```tsx
import { Search, Trash2 } from "lucide-react";
<Button size="icon" aria-label="Search"><Search /></Button>
```

## Rules

1. **Never import icons from any other library.** If an icon doesn't exist in Lucide, pick the
   closest Lucide match — do not add a second icon source. The single exception is **company
   logos**, which Lucide does not carry: those live in the shared `BrandMark` registry
   ([08-ui-components/brand-mark.md](08-ui-components/brand-mark.md)), not in app code.
2. **Default size is `size-4` (16px).** Components that accept icons already constrain SVGs to
   `size-4` via `[&_svg]:size-4`. Don't override unless there's a real reason.
3. **Icons inherit `currentColor`** — they pick up the surrounding text token automatically.
   Don't hardcode icon colors; set text color via tokens (`text-muted-foreground`, etc.).
4. **Icon-only buttons need an `aria-label`.**
5. Browse icons at https://lucide.dev or import names from `lucide-react`.

## Brand marks

Third-party logos (Apple, Google, payment providers) are not icons and are not in Lucide. They are
inline SVG components in `src/components/brand-mark.tsx`, shared by every service:

```tsx
<Button variant="secondary"><GoogleMark /> Continue with Google</Button>
```

See [08-ui-components/brand-mark.md](08-ui-components/brand-mark.md) for the rules (which marks may
be tinted) and [`src/assets/README.md`](../src/assets/README.md) for adding one.

## Related

- [BrandMark](08-ui-components/brand-mark.md) — third-party company logos
- [03 Design Tokens](03-design-tokens.md) — color comes from `currentColor` / text tokens
- [13 AI Coding Guidelines](13-ai-coding-guidelines.md)
