# TankKoll — Design

**Date:** 2026-07-18
**Status:** Approved via /goal spec + user-provided high-fidelity mockup (`Mockup.png` in repo root)
**Target:** Production PWA published at https://erlandsson.online/tankkoll (served from GitHub Pages, repo `vindrosen/tankkoll`, also reachable at https://vindrosen.github.io/tankkoll/)

## 1. Purpose

TankKoll helps car owners log every refueling, see their real fuel consumption, compare it against the manufacturer's official WLTP figure, and understand fuel costs over time. A new entry must take under 15 seconds. All data lives locally in the browser (LocalStorage); the architecture must allow swapping in a REST API later without refactoring.

**UI language: Swedish** (the mockup is Swedish and all of Robert's published apps are Swedish-first). Units metric, currency defaults to SEK (`kr`), formatted with `Intl.NumberFormat('sv-SE')`.

## 2. Design source

The user supplied a complete high-fidelity mockup (`Mockup.png`) covering:

- **Desktop dashboard**: left sidebar (Översikt, Tankningar, Statistik, Bilar, Kostnader, Påminnelser, Inställningar), radial consumption gauge (0–15 L/100 km, "Senaste 5 tankningarna"), "Senaste tankningen" card, "Denna månad" card, "Förbrukning över tid" line chart with period selector, "Senaste tankningar" table, primary "+ Ny tankning" button, active-vehicle chip (Volkswagen Golf ABC123), "Mörkt läge" toggle.
- **Mobile screens**: dashboard, "Ny tankning" form, "Tankningar" list, "Statistik" (tabs Översikt / Kostnader / Jämförelse, stat tiles, monthly bar chart), "Min bil" (vehicle detail with WLTP-vs-actual comparison, "+9 % högre än fabriksuppgift" in red), bottom tab bar (Översikt, Tankningar, Statistik, Bilar, Mer).

Scope adjustments vs the mockup (YAGNI, per the /goal MVP list):

- Sidebar items **Kostnader** and **Påminnelser** are *not* separate MVP pages. Cost views live in Statistik's **Kostnader** tab (as the mobile mockup already shows). Reminders are a future feature; the data model reserves room but no UI is built.
- Mobile "Mer" tab maps to **Inställningar** (settings is the only overflow destination in MVP).

Screens the mockup doesn't show, designed here: Inställningar, vehicle create/edit form, refueling edit, delete confirmations, empty states (illustrated), onboarding state when no vehicle exists.

## 3. Approaches considered

1. **Next.js static export + adapter-based storage (chosen).** App Router, `output: 'export'`, all pages prerendered shells that hydrate client-side from LocalStorage. Matches the mandated stack, deploys to GitHub Pages, and the async storage adapter makes the future REST swap a one-file change.
2. Vite SPA — rejected: spec mandates Next.js; SEO story (per-route metadata, sitemap) is weaker.
3. Next.js with a server runtime — rejected: GitHub Pages is static-only; nothing in MVP needs a server.

State: **zustand store (in-memory) + async `StorageAdapter`** rather than `zustand/persist` directly, because persist hard-couples the store to LocalStorage and would need refactoring for REST. The store loads via the adapter on mount and writes through it on every mutation. (Lesson from Slumpa: selectors must return stable references — select raw + `useMemo` for derived arrays.)

## 4. Architecture

```
src/
  app/                    # Next.js App Router (all static)
    layout.tsx            # shell: sidebar (desktop) / bottom tabs (mobile), metadata
    page.tsx              # Översikt (dashboard)
    tankning/page.tsx     # Ny/redigera tankning (?id= via useSearchParams + Suspense)
    tankningar/page.tsx   # Historik
    statistik/page.tsx    # Tabs: Översikt / Kostnader / Jämförelse
    bilar/page.tsx        # Fordonslista + detalj/form (client-side, no dynamic routes)
    installningar/page.tsx
    manifest.ts           # PWA manifest (force-static)
    sitemap.ts, robots.ts # force-static
  components/             # Reusable UI: StatCard, Gauge, ChartCard, EmptyState,
                          # RefuelingCard, VehicleCard, ConfirmDialog, forms, nav
  lib/
    types.ts              # Vehicle, Refueling, Settings, AppData
    calculations.ts       # PURE functions (unit-tested)
    storage/
      StorageAdapter.ts   # interface (async CRUD + import/export)
      LocalStorageAdapter.ts
    vehicle-info/
      VehicleInfoProvider.ts   # interface: lookup(regNr) -> Partial<Vehicle> | null
      ManualVehicleProvider.ts # MVP: always null (manual entry)
    export.ts             # JSON + CSV serialization / import validation
    format.ts             # sv-SE number/date/currency formatting
    asset.ts              # basePath prefix helper for images (next/image skips basePath)
  store/
    useAppStore.ts        # zustand: vehicles, refuelings, settings, hydration flag
  sw.js (public/)         # service worker, BASE from registration.scope, prod-only
```

### Data model

```ts
interface Vehicle {
  id: string;                // crypto.randomUUID()
  name: string;              // "Volkswagen Golf"
  registrationNumber?: string;
  fuelType: 'bensin' | 'diesel' | 'etanol' | 'el-hybrid' | 'annat';
  manufacturer?: string; model?: string; year?: number;
  tankSize?: number;         // liters
  wltpConsumption?: number;  // L/100 km (official)
  imageUrl?: string;
  createdAt: string;         // ISO
}

interface Refueling {
  id: string;
  vehicleId: string;
  date: string;              // ISO date
  liters: number;
  odometer: number;          // km (mätarställning)
  pricePerLiter?: number;
  notes?: string;
  createdAt: string;
}

interface Settings {
  currency: string;          // default 'SEK'
  theme: 'dark' | 'light';   // default 'dark'
  activeVehicleId?: string;
}
```

Derived values are **never stored** — computed from the refueling list per vehicle, sorted by odometer:

- `distance = odometer − previous.odometer` (first entry per vehicle = baseline, no distance/consumption)
- `consumption = liters / distance × 100` (L/100 km); `kmPerLiter = distance / liters`
- `cost = liters × pricePerLiter`; `costPerKm = cost / distance`; `costPer10Km = costPerKm × 10`
- Averages over a window (dashboard gauge = last 5 entries with consumption), totals, min/max, rolling average, monthly aggregates (cost, distance, avg consumption, avg price), WLTP diff: `(actual − official) / official × 100` — green when ≤ 0, red when > 0.

All in `calculations.ts` as pure functions with vitest unit tests (TDD).

### Storage abstraction

```ts
interface StorageAdapter {
  load(): Promise<AppData>;                 // { vehicles, refuelings, settings }
  saveVehicle(v: Vehicle): Promise<void>;
  deleteVehicle(id: string): Promise<void>; // cascades its refuelings
  saveRefueling(r: Refueling): Promise<void>;
  deleteRefueling(id: string): Promise<void>;
  saveSettings(s: Settings): Promise<void>;
  replaceAll(data: AppData): Promise<void>; // import / reset
}
```

`LocalStorageAdapter` keys: `tankkoll:v1` (single JSON document — simple, atomic, easy export). A future `RestAdapter` implements the same interface; the store never touches `localStorage` directly. SSR-safety: adapter only used inside `useEffect`, store exposes `hydrated` flag; pages render skeletons until hydrated (avoids hydration mismatch on static export).

### Vehicle info abstraction

`VehicleInfoProvider.lookup(regNr)` is called on registration-number blur in the vehicle form; a non-null result prefills manufacturer/model/year/fuelType. MVP ships `ManualVehicleProvider` (returns null). A future API provider slots in via one exported constant.

## 5. Screens (wireframe level, mockup-faithful)

- **Översikt `/`** — gauge card (avg of last 5 consumption values, needle + gradient arc, custom SVG), "Senaste tankningen" card (date, liters, km, L/100 km, kr/mil), "Denna månad" card (km, förbrukning, kostnad), consumption line chart (period select 3/6/12 mån), recent 5 refuelings (table on desktop, cards on mobile) with "Visa alla" → /tankningar, prominent "+ Ny tankning". Empty state (no refuelings): illustration + CTA. No vehicle at all → onboarding card "Lägg till din bil".
- **Ny tankning `/tankning`** — fields per spec: regnr (prefilled from active vehicle, optional), tankade liter, mätarställning, pris per liter (optional), datum (default today), anteckningar (optional). Live preview row: computed distance + consumption once liters+odometer entered. Validation: odometer must exceed previous (warning, not block — user may correct history later); liters > 0. Save → toast → back to Översikt. `?id=` = edit mode, same form.
- **Tankningar `/tankningar`** — full list, newest first, per mockup card layout (date, liters·km on the left; L/100 km, kr/mil right). Edit (→ `/tankning?id=`) and delete (confirm dialog) per row.
- **Statistik `/statistik`** — tabs: **Översikt** (tiles: snittförbrukning, lägsta, högsta, körda km, totalt bränsle, total kostnad; monthly avg-consumption bar chart 12 mån), **Kostnader** (tiles: snittpris/liter, kostnad/mil, kostnad/km; monthly cost bar chart; fuel-price line chart), **Jämförelse** (WLTP vs actual per vehicle: two figures + colored % diff, distance-per-month bar chart). Empty state when < 2 refuelings.
- **Bilar `/bilar`** — vehicle cards (name, regnr chip, year, fuel, WLTP comparison badge). Add/edit form (name, regnr → provider lookup, tillverkare, modell, år, drivmedel, tankvolym, WLTP, valfri bild-URL). Active vehicle selector (radio/"Aktiv" badge); delete with confirm (warns refuelings go too). Multi-vehicle: all stats/dashboard scoped to the **active** vehicle.
- **Inställningar `/installningar`** — valuta (SEK/EUR/NOK/DKK), tema (mörkt/ljust, dark default), export JSON, export CSV, import JSON (file picker + validation + confirm replace), återställ all data (double confirm). About/version.

**Navigation:** desktop ≥1024 px = fixed sidebar per mockup; below = bottom tab bar (Översikt, Tankningar, Statistik, Bilar, Mer→Inställningar) with the mockup's icon style. "+ Ny tankning" is a persistent primary action (header button desktop / prominent button in dashboard + FAB-style on list pages mobile).

## 6. Theme

Tailwind v4 tokens: bg `#0F172A`, card `#1E293B`, primary `#2563EB`, success `#22C55E`, warning `#F59E0B`, danger `#EF4444`, text slate-100/slate-400. Rounded-2xl cards, subtle shadows, large numerals for KPI values (per mockup), smooth transitions (CSS, no heavy animation lib). Light theme = inverted slate scale, toggle in settings + sidebar; `dark` class on `<html>`, default dark, persisted in Settings.

Charts follow the **dataviz skill** (load before chart code): Recharts, blue primary series, muted grid, accessible tooltips, sv-SE formatted axes.

## 7. Graphics (bildgen MCP)

Generated once, no regeneration (cost discipline). bildgen always writes to `assets/generated/` → optimized copies into `public/images/` via sharp script. Set: app icon 1024² (transparent, "die-cut sticker" style fuel-drop matching mockup logo), maskable icon variant, logo (icon + wordmark), splash 1024×1536, hero 1536×1024, empty-state illustrations ×2 (inga tankningar, ingen bil), OG/social 1536×1024 (cropped to 1200×630). Favicon + PWA icon sizes (192/512) derived from app icon with sharp.

## 8. PWA / SEO / Deploy

- **PWA:** `app/manifest.ts` with `export const dynamic = 'force-static'` (required with `output:'export'`); custom `public/sw.js` — cache-first for static assets, network-first fallback-to-cache for navigations, registered in production only, BASE derived from `registration.scope`. Installable on Android/iOS, works fully offline after first visit.
- **SEO:** per-route `metadata` (Swedish titles/descriptions), Open Graph + Twitter Card with `absoluteUrl()` helper (naked paths break under basePath), JSON-LD `WebApplication`, `app/sitemap.ts` + `app/robots.ts` (force-static). Semantic landmarks, skip-link, ARIA labels on nav/gauge/charts, visible focus rings, WCAG AA contrast.
- **Known GitHub Pages traps (from Östersjöns Fiskar / Slumpa):** `basePath` `/tankkoll` via `NEXT_PUBLIC_BASE_PATH` env in workflow; `next/image` does not apply basePath → use `<img>` + `asset()` helper (all images are local statics; no next/image needed); `public/.nojekyll`; CI must use `npm install` (Windows lockfiles break `npm ci` on Linux); if Next 16 writes RSC payloads as directories, add the flatten-rsc postbuild script; set basePath env via PowerShell locally, never Git Bash (MSYS path mangling).
- **Deploy:** repo `vindrosen/tankkoll`, GitHub Actions workflow → Pages artifact. Live at `vindrosen.github.io/tankkoll`; `erlandsson.online/tankkoll` resolves once the account-level custom domain applies (outside this repo's control — DNS/custom-domain setup is Robert's).

## 9. Error handling

- Corrupt/missing LocalStorage JSON → adapter returns empty AppData, logs warning; import validates schema (zod-free manual guards, keep bundle small) and rejects with a readable Swedish message.
- Odometer lower than previous → inline warning, entry allowed (history correction is legitimate), consumption for negative distances is excluded from stats.
- Refuelings with missing price simply drop out of cost aggregates (not treated as 0).
- Storage quota errors surface a toast ("Kunde inte spara — lagringen är full").

## 10. Testing

- **Unit (vitest):** every function in `calculations.ts` (incl. edge cases: single entry, unordered entries, missing price, negative distance), `export.ts` round-trip (JSON→import, CSV shape), `LocalStorageAdapter` against a mocked localStorage.
- **E2E (manual via Playwright MCP):** full walkthrough on the production static export — onboarding → add vehicle → 3 refuelings → verify computed figures on all screens → edit → delete → second vehicle → switch → export JSON/CSV → import → reset. Desktop 1280 and mobile 375 viewports, screenshots archived then cleaned.
- **Build gates:** `tsc --noEmit`, `next build` static export, Lighthouse-relevant checks (meta, contrast, tap targets) during Playwright pass.

## 11. Future-feature readiness (design only, no code)

REST sync & accounts → `StorageAdapter`. Vehicle API → `VehicleInfoProvider`. Reminders/service log → new entity + nav slot already in mockup. EV/hybrid → `fuelType` already extensible; consumption units would need a strategy field. Ads/premium → layout keeps an uncluttered footer region; no ad code in MVP.
