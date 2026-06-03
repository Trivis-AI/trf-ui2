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
   closest Lucide match — do not add a second icon source.
2. **Default size is `size-4` (16px).** Components that accept icons already constrain SVGs to
   `size-4` via `[&_svg]:size-4`. Don't override unless there's a real reason.
3. **Icons inherit `currentColor`** — they pick up the surrounding text token automatically.
   Don't hardcode icon colors; set text color via tokens (`text-muted-foreground`, etc.).
4. **Icon-only buttons need an `aria-label`.**
5. Browse icons at https://lucide.dev or import names from `lucide-react`.

## Related

- [03 Design Tokens](03-design-tokens.md) — color comes from `currentColor` / text tokens
- [13 AI Coding Guidelines](13-ai-coding-guidelines.md)
