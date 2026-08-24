# Toaster (toasts)

> **Status: ready** · `import { Toaster, toast } from "@trf/ui2"` · source: `src/components/ui/sonner.tsx`

Toast notifications, built on [sonner](https://sonner.emilkowal.ski/), bridged onto the token
contract (colors, Geist, type scale, Lucide status icons — see the "Toasts (sonner)" section in
`styles/tokens.css`). Theme follows the `dark` class on `<html>` automatically.
Success / error / warning render as **filled** toasts: the status token is the background with
its paired `-foreground` for text. Default, info and loading stay popover-toned.

## Usage

Mount **one** `<Toaster />` at the app root:

```tsx
<QueryClientProvider client={qc}>
  <RouterProvider router={router} />
  <Toaster />
</QueryClientProvider>
```

Fire toasts from anywhere:

```tsx
import { toast } from "@trf/ui2";

toast("Saved");
toast.success("Invoice sent");
toast.error("Could not save", { description: "The customer field is required." });
toast.warning("Period is closing soon");
toast.info("3 rows imported");
toast.promise(save(), { loading: "Saving…", success: "Saved", error: "Save failed" });
toast("Invoice deleted", { action: { label: "Undo", onClick: restore } });
toast.dismiss(); // or toast.dismiss(id)
```

## Rules

- **One `<Toaster />` per app**, at the root. Never mount per page/component.
- **Don't pass `richColors`** — its backgrounds are hardcoded in sonner and ignore our tokens.
  The filled status look comes from the token bridge in `tokens.css` instead.
- Toast for **transient outcomes** (saved, sent, failed). Inline `Field error` / `Alert` for
  validation the user must act on; `ConfirmDialog` for decisions.
- This replaces `react-hot-toast` in the apps (migration is gradual, repo by repo). Don't add
  sonner or react-hot-toast directly to an app — import from `@trf/ui2`.

## Migrating an app from react-hot-toast

1. `<Toaster />` from `@trf/ui2` at the root; delete the react-hot-toast `<Toaster />`.
2. Replace `import toast from "react-hot-toast"` with `import { toast } from "@trf/ui2"`.
   `toast / .success / .error / .loading / .promise / .dismiss` are drop-in;
   react-hot-toast's `toast.custom(jsx)` becomes `toast(<jsx/>)` or `toast.custom(t => ...)`.
3. `npm uninstall react-hot-toast`.

## Related

- [feedback.md](feedback.md) (Alert, EmptyState) · [confirm-dialog.md](confirm-dialog.md)
