# Tabs

> **Status: ready** · `import { Tabs, TabsList, TabsTrigger, TabsContent } from "@trf/ui2"` · source: `src/components/ui/tabs.tsx`

Accessible tabbed views (Radix) for splitting a screen's content (e.g. an invoice's
Overview / Line items / History). Keyboard arrow navigation handled.

## Usage

```tsx
<Tabs defaultValue="overview">
  <TabsList>
    <TabsTrigger value="overview">Overview</TabsTrigger>
    <TabsTrigger value="lines">Line items</TabsTrigger>
  </TabsList>
  <TabsContent value="overview">…</TabsContent>
  <TabsContent value="lines">…</TabsContent>
</Tabs>
```

Controlled via `value` + `onValueChange`, or uncontrolled via `defaultValue`. Each `TabsTrigger`
and its `TabsContent` share a `value`.

## Rules

- Use for **content within one screen**, not top-level app navigation (that's the `Sidebar`).
- Keep tab labels short; icons (Lucide) are auto-sized.

## Related

- [Sidebar](sidebar.md) — for app-level navigation · [13 AI Coding Guidelines](../13-ai-coding-guidelines.md)
