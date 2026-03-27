# Habiterra

Fullscreen **climate comfort × housing** explorer. Pick a temperature band (°F) and, for the US, a median listing price range. Matching **countries** (worldwide) and **US counties** (zoom ≥ 4) highlight on the map. Click a region for temperature notes and **links to major listing portals** for that market (curated by country; US counties still use Realtor.com / Zillow-style search URLs).

## Data (free / open)

| Layer | Source |
|--------|--------|
| Country boundaries | [world-atlas](https://github.com/topojson/world-atlas) / Natural Earth 110m (TopoJSON) |
| US county boundaries | [us-atlas](https://github.com/topojson/us-atlas) (Census cartographic boundaries) |
| US county temperature | [NOAA NCEI](https://www.ncei.noaa.gov/) U.S. Climate Normals 1991–2020 → nearest GHCN HCN/CRN station (`scripts/process-climate.ts`) |
| Non-US country temperature | [Open-Meteo Archive](https://open-meteo.com/) (2015–2024 daily min/max at one centroid per ISO country), with **latitude-based fallback** if the API errors or rate-limits (`scripts/process-global-climate.ts`) |
| US median list price & inventory | [Realtor.com Research Data Library](https://www.realtor.com/research/data/) county CSV |
| Listing portals | Curated in [`lib/country-property-portals.ts`](lib/country-property-portals.ts); unknown countries get a generic web search link |
| Basemap | [CARTO basemaps](https://carto.com/basemaps/) (no API key) |

Country climate is **one representative point per country** (not uniform for large countries). US county stats are **aggregates**, not individual MLS rows.

## Scripts

```bash
# Full refresh: US + world TopoJSON, housing CSV, US climate, global climate (~2+ min; global step calls Open-Meteo per country)
npm run data:all
```

Steps: `data:topo`, `data:world-topo`, `data:housing`, `data:climate`, `data:global-climate`.

## Develop

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Press **`d`** to toggle light/dark (map style follows).

## Stack

Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, shadcn/ui, MapLibre GL + react-map-gl.
