# TankKoll

**Håll koll på din bränsleförbrukning.** TankKoll är en gratis PWA som loggar dina
tankningar, räknar ut bilens verkliga förbrukning (l/100 km, km/l, kr/mil) och
jämför den mot fabriksuppgiften (WLTP). All data sparas lokalt i webbläsaren –
inga konton, ingen server.

**Live:** https://erlandsson.online/tankkoll ·
https://vindrosen.github.io/tankkoll/

![TankKoll](public/images/og.jpg)

## Funktioner

- Översikt med förbrukningsmätare, månadssammanfattning och graf
- Ny tankning på under 15 sekunder – körsträcka och förbrukning räknas ut automatiskt
- Historik med redigering och borttagning
- Statistik: snitt/lägsta/högsta förbrukning, kostnader, månadsgrafer, prisutveckling
- Flera bilar med WLTP-jämförelse (grönt under fabriksuppgift, rött över)
- Export/import (JSON + CSV), valutaval, mörkt/ljust tema
- Installerbar PWA med offline-stöd

## Teknik

Next.js 16 (App Router, statisk export) · React 19 · TypeScript · Tailwind v4 ·
Recharts · zustand · vitest

```bash
npm install
npm run dev        # dev-server
npm test           # enhetstester (kalkyler, lagring, export)
npm run build      # statisk export till out/ (kör flatten-rsc postbuild)
npm run images:optimize  # regenerera public/-bilder från assets/generated/
```

## Arkitektur

- `src/lib/calculations.ts` – rena, enhetstestade beräkningar; härledda värden
  lagras aldrig.
- `src/lib/storage/` – `StorageAdapter`-interface; `LocalStorageAdapter` är enda
  implementationen. Ett framtida REST-API byts in via singletonen i
  `src/store/useAppStore.ts` utan övrig refaktorering.
- `src/lib/vehicle-info/` – `VehicleInfoProvider`-interface för framtida
  regnr-uppslag; formuläret anropar redan `lookup()` vid blur.
- `src/views/` – klientvyer; `src/app/` – tunna serverwrappers med metadata.

## Bilder

Original genereras med bildgen-MCP till `assets/generated/` (versionshanterade
masterfiler – **generera aldrig om i onödan**, varje bild är ett API-anrop).
`scripts/optimize-images.mjs` skapar webp/ikoner/OG-bild i `public/`.

## Deploy

Push till `main` bygger och publicerar via GitHub Actions (`deploy.yml`) med
`NEXT_PUBLIC_BASE_PATH=/tankkoll`. Fallgropar som redan är hanterade:
`npm install` i stället för `npm ci` (Windows-låsfil), `.nojekyll`,
`asset()`-helper för bildsökvägar (basePath), RSC-payload-utplattning
(`scripts/flatten-rsc-payloads.mjs`), `manifest.ts` med `force-static`.
