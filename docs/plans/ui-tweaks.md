# UI tweaks: sidebar, sales invoices, AI chat

Started 2026-10-04. Status is kept here, not in chat. Jaak sends numbered tweaks; each batch
is checked locally, then everything ships as one release at the end.

## How it is being tested

- `frontinvoices` (5105), `frontai` (5101), `frontlogin` (5108) and `frontproducts` (5110) serve app-shell and ui2 from the local
  checkouts through an uncommitted, dev-only `linkLocalLibs()` plugin in their
  `vite.config.ts`. Never commit that block; remove it with `git checkout -- vite.config.ts`
  once this work ships. `TRF_LINK_LIBS=0 npm run dev` serves the pinned tags instead.
- Colour changes are made in the Default theme only (`theme-default` in `tokens.css`);
  other themes stay as they are.

## Items

| # | Change | Where | Status |
|---|---|---|---|
| 1 | No line under the sidebar org header | app-shell | done locally |
| 2 | No line under the desktop top bar | app-shell | done locally |
| 3 | Shadow under the top bar once content scrolls under it (page scroll, or a page's own scroll box flush under the bar, e.g. AI chat) | app-shell | done locally |
| 4 | Shadow under the sidebar org header once the menu scrolls | app-shell | done locally |
| 5 | Menu search stands out in Default: white in light, page colour in dark (new `--sidebar-field` token) | ui2 tokens + app-shell | done locally |
| 6 | Palette picker removed from the sidebar footer (light/dark/system picker stays) | app-shell | done locally |
| 7 | Active field in Default (focused, or picker open): dark: border +20% white, inside +50% black; light: border +20% black, inside unchanged. Same for the menu search. New tokens `--input-focus`, `--field-focus`, `--sidebar-field-focus` | ui2 tokens + 9 field components, app-shell, frontai (composer textarea stays transparent) | done locally |
| 8 | No focus ring on fields in Default (new `--field-ring`, `--field-ring-offset`, transparent there) | ui2 tokens + 9 field components | done locally |
| 9 | Fresh AI chat: greeting, composer, starter pills centred; subtitle removed; input focused on open (that focus already existed); first send glides the composer to the bottom (FLIP, 450ms, off for reduced motion) | frontai `ChatPage.tsx` | done locally |
| 10 | Rename the menu group Oto AI to AI Agent / AI-abiline, and `<trn-trf-ai>` (frontai's signed-out heading) to match | services `service.go` + `translations.json` | in the working tree, needs a services deploy and the translations POST |
| 11 | Chat composer follows the fields in Default: no ring, sharper border, darker inside in dark (new `--composer-focus`) | ui2 `chat-composer.tsx` + tokens | done locally |
| 12 | No desktop top bar (crumb) on the AI chat page: new `<ShellBarHidden />` in app-shell, rendered by `ChatPage` | app-shell `crumbs.tsx`, `AppShellLayout.tsx`; frontai; doc 17 | done locally |
| 13 | Chat input row: attach is a + on the left, the mic moves to the right before Send | frontai `ChatPage.tsx` | done locally |
| 14 | Chat: messages fade (32px, page colour) into the composer instead of a hard cut | frontai `ChatPage.tsx` | done locally |
| 15 | Chat: Talk to a human is a floating round button top right (message-circle-question-mark icon, tooltip, 32px from the right); once asked it stays amber with a Support has been notified tooltip | frontai `ChatPage.tsx` | done locally |
| 16 | Chat: no token count under the input, only Be careful with agentic AI (new key `<trn-agentic-ai-warning>`, ee Olge agenditüüpi AI kasutamisel ettevaatlik.). Low and empty balance warnings stay | frontai, services `translations.json` | done locally, needs the translations POST |
| 17 | Sidebar: org dropdown hover inset 8px with rounded corners (button size unchanged); no top padding above the menu search | app-shell | done locally |
| 18 | User settings in tabs: Profile, Security (password, 2FA, session length), Appearance; tab in `?tab=` | frontlogin `AccountSettings.tsx`, translations | done locally |
| 19 | Appearance: Mode (light/dark/system, RadioCards) and Theme (new ui2 `PalettePicker`, graduated `PaletteSwatches`). Both pickers gone from the sidebar footer. Palette and mode logic moved to app-shell `appearance.ts` (`usePalette`, `useColorMode`), shared live between shell and settings | ui2, app-shell, frontlogin | done locally |
| 20 | Default is the default palette everywhere: until a browser has the marker cookie it reads as Default once, then picks stand. On prod this moves everyone to Default once | app-shell `appearance.ts` | done locally, needs sign-off |
| 21 | User settings no longer bounces to Overview on a fresh link: it waits for the org token (minted after first render) instead of `navigate("/")` | frontlogin `AccountSettings.tsx` | done locally |
| 22 | Org picker opens 4px into the header (new ui2 `OrgSwitcher` prop `sideOffset`, app-shell passes -4) so the menu search does not peek out above it; hover inset now 8px | ui2, app-shell | done locally |
| 23 | ui2 `Page` has no top padding (was `py-8`, now `pt-0 pb-8`); one class in `src/components/page.tsx` | ui2 | shipping to staging (Jaak chose 0px) |
| 24 | Meta pill (status/date/sum under the bar): 16px margin under the bar while it shows, so content starts 24px below it (scrolls away, pinned bar not taller); pill row top padding 12px to 4px, centring the pill on the sidebar search | app-shell | done locally |
| 25 | Text smoothing everywhere: `antialiased` on `<html>` in ui2 `tokens.css` (the portal had it alone, so its sidebar looked thinner); frontlogin's own line removed | ui2, frontlogin | done locally |

Open: the mobile top bar still has its bottom line (ask whether it goes too).
Open: the same bounce (`if (!token) navigate("/")` before the token is minted) is in frontlogin's AccountOverview, OrganizationSettings and Members. Overview hides it because "/" forwards there anyway.
Open: with no palette picker, prod users stay on their stored pick or Trivis, so the
Default-only colour changes would reach nobody on prod. Decide whether Default becomes the
default everywhere before shipping.
Open: "Oto AI" also appears in genericdata knowledge articles (the assistant's own menu guide) and the trivislanding demo sidebar.

## Shipped

2026-10-04, staging (trf.is): ui2 v7.17.0, app-shell v0.42.0, services v7.11.1, and all 14
frontends on the new pins: frontai v7.8.64, frontaudit v7.0.26, frontcontracts v7.0.27,
frontcrm v7.0.76, frontinvoices v7.12.10, frontitems v7.1.3, frontledger v7.3.14,
frontlogin v7.0.60 (User settings tabs), frontpayments v7.18.2, frontproducts v7.0.34,
frontpurchase v7.22.1, frontreports v7.2.1, frontsettings v7.1.38, fronttables v7.0.26.
Every staging site confirmed serving the new shell. Still to do: the translations POST (new
keys not served on staging yet), Jaak's staging check, then prod.

## Shipping (after sign-off)

1. ui2: release (new `--sidebar-field` and active-field tokens, field components, doc 03).
2. app-shell: bump its ui2 pin, release. Its own `tsc` needs that bump first: it uses the new
   `OrgSwitcher` `sideOffset` prop.
3. All 14 frontends: bump app-shell and ui2 together (`/rollout`), staging, sign-off, prod.
   They must move together: the new app-shell uses `bg-sidebar-field`, which only exists
   with the new ui2 tokens. On an old ui2 the class is never generated, and the search box
   goes transparent.
4. Remove the local link from `frontinvoices`, `frontai`, `frontlogin` and `frontproducts`. frontai also carries real
   changes (`ChatPage.tsx` items 7 and 9, two comments for item 10) that ship with its bump.
   frontai's `tsc` fails until it pins the new app-shell: `ChatPage` imports `ShellBarHidden`.
   frontlogin's `tsc` likewise needs the new ui2 (`PalettePicker`) and app-shell (`usePalette`, `useColorMode`).
5. services (item 10): its own deploy; the menu re-seeds on startup. Then the manual
   POST of translations.json to /v1/translations with an admin token (Jaak).
