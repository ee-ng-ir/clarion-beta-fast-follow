# IR Ops console

IR's internal provisioning portal, for DevSecOps and IR Support. It covers the same features as the live console (`console.dev-abhra.ir.com`, Oct 2026), built on Picasso's rules rather than copying its layout.

```bash
npm run dev:ops   # from the repo root → http://localhost:5175
```

## What's in it

| Route | Page |
| --- | --- |
| `/tenants` | Every tenancy: search, status filter, sort, and row actions (view, copy URL, cancel) |
| `/tenants/new` | Provision new tenancy: company, client account contact, region and domains, first client admin |
| `/tenants/:id` | Tenant: Overview, Client admins, Audit log, Feature flags, Products (`?tab=`) |
| `/product-plans` | Every live subscription across tenants; bulk resync and version updates |
| `/services` | Service dependency map (and list) with OpenTofu state and Lattice reachability by environment |
| `/email-activity` | SendGrid Email Activity: recent platform email and whether it was delivered |
| `/tofu-modules` | Raw OpenTofu state by environment, read-only |
| `/feature-flags` | Global defaults (`targeting["*"]`) and how many tenants override each |

The live console's environment switcher, refresh button and "Internal" badge are left out: they're about which backend you're pointed at, not the product. Services and Tofu modules keep their own environment views, because state per environment is what those pages are about.

## How it's built

- **Picasso throughout.** The page uses `AppShell` and `Sidebar`, with `SidebarBrand` showing the Console artwork from `packages/picasso/ui/brand-assets`. Every page title is a `PageHeader`; actions sit next to it in `components/PageTop.tsx`, never in a card. Width per page follows Picasso: lists are fluid, the tenant page is standard, the new-tenant form is reading width.
- **One-of-n selects.** Picasso's `Select` is a multi-select filter with Apply, so filters use it directly. Single-choice form fields use `ChoiceSelect` (`components/ui.tsx`): Picasso's `InputButton` opening a Picasso `DropdownMenu`.
- **Status** is always a `Badge` with a dot and a word, never colour on its own.
- **Data.** `src/data/` holds the dummy book of business (tenants, plans, flags, services, tofu state, email) and an in-memory store. Changes last for the session and are written to the tenant's audit log; reload to reset. Acme Contact Centre's client admins come from `@ir/mock-data`, so it's the same tenant the client console and Clarion show.
- **Naming.** The live dev stage still has old-name flags and a cancelled old-name product. Here, everything is Clarion and test-only flags are left out.

## Departures from the live console

- The row action "Delete tenant" is now **Cancel tenancy**, behind a type-the-name confirmation. That matches what actually happens: cancelled tenants stay in the list.
- Dates are day-first (`28 Oct 2026`), not `10/28/2026`.
- The tenant Feature flags tab says which value wins (Global / Tenant / Clarion plan). Plan flags link to Products rather than repeating "Edit on Products" on every row.
- Products saves are a draft: they show the number of unsaved changes and offer Discard and Save. Licence fields warn when the new limit is below current use.
