/**
 * Builds public/data/admin1-layer.json: Natural Earth admin-1 (state/province)
 * polygons outside the US, simplified, with WorldClim 2.1 BIO5/BIO6 normals
 * (fallback: lat-span estimate) + median price
 * (national table / GNI / default). US remains county-level in the app.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import bbox from "@turf/bbox"
import centroid from "@turf/centroid"
import simplify from "@turf/simplify"
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson"

import { getPropertyPortalsForCountry } from "../lib/country-property-portals"
import { climateFromLat } from "../lib/latitude-climate"
import { fetchGniByIso3, resolveAdmin1MedianUsd } from "./admin1-pricing"
import {
  ensureWorldClimBioSampler,
  type BioSampler,
} from "./worldclim-bio-rasters"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outPath = path.join(__dirname, "..", "public", "data", "admin1-layer.json")

const NE_URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_admin_1_states_provinces.geojson"

/** Default Douglas–Peucker tolerance (degrees). Lower = sharper internal borders. */
const SIMPLIFY_TOLERANCE = 0.012

/**
 * Large countries where default simplification collapses province boundaries into
 * a few visual blobs (e.g. Canada’s multipolygon landmass).
 */
const STRICT_SIMPLIFY_ISO2 = new Set(["AU", "CA"])
const STRICT_SIMPLIFY_TOLERANCE = 0.0035

type NeProps = {
  adm1_code?: string
  name?: string
  admin?: string
  iso_a2?: string
  iso_3166_2?: string
  adm0_a3?: string
}

/**
 * Centroid-only latitude fails for tall admin-1 units (e.g. Western Australia,
 * Queensland): one midpoint misrepresents both tropics and temperate south.
 * Sample along the north–south extent of the (simplified) polygon bbox.
 */
function climateFromGeometry(geometry: Polygon | MultiPolygon): {
  tmin: number
  tmax: number
} {
  const [, south, , north] = bbox({
    type: "Feature",
    properties: {},
    geometry,
  })
  const latSpan = Math.abs(north - south)
  if (!Number.isFinite(latSpan) || latSpan < 2.2) {
    const lat = (south + north) / 2
    return climateFromLat(lat)
  }
  const steps =
    latSpan > 16 ? 7 : latSpan > 10 ? 5 : latSpan > 5 ? 4 : 3
  let tminAgg = Infinity
  let tmaxAgg = -Infinity
  for (let i = 0; i < steps; i++) {
    const lat = south + ((north - south) * i) / (steps - 1)
    const c = climateFromLat(lat)
    tminAgg = Math.min(tminAgg, c.tmin)
    tmaxAgg = Math.max(tmaxAgg, c.tmax)
  }
  return {
    tmin: Math.round(tminAgg),
    tmax: Math.round(tmaxAgg),
  }
}

function northSouthSampleLats(south: number, north: number): number[] {
  const latSpan = Math.abs(north - south)
  if (!Number.isFinite(latSpan) || latSpan < 2.2) {
    return [(south + north) / 2]
  }
  const steps =
    latSpan > 16 ? 7 : latSpan > 10 ? 5 : latSpan > 5 ? 4 : 3
  return Array.from({ length: steps }, (_, i) => {
    return south + ((north - south) * i) / (steps - 1)
  })
}

function cToF(c: number): number {
  return Math.round((c * 9) / 5 + 32)
}

function climateForAdmin1(
  geometry: Polygon | MultiPolygon,
  worldclim: BioSampler | null,
): {
  tmin: number
  tmax: number
  climateSource: "worldclim_bio" | "latitude_estimate"
} {
  const latEst = () => {
    const { tmin, tmax } = climateFromGeometry(geometry)
    return { tmin, tmax, climateSource: "latitude_estimate" as const }
  }

  if (!worldclim) return latEst()

  const b = bbox({
    type: "Feature",
    properties: {},
    geometry,
  })
  const west = b[0]
  const south = b[1]
  const east = b[2]
  const north = b[3]
  if (west > east) return latEst()

  const midLon = (west + east) / 2
  const lats = northSouthSampleLats(south, north)
  let minCold = Infinity
  let maxWarm = -Infinity
  let hits = 0
  for (const lat of lats) {
    const s = worldclim.sample(midLon, lat)
    if (!s) continue
    if (s.b6 > s.b5 + 3) continue
    minCold = Math.min(minCold, s.b6)
    maxWarm = Math.max(maxWarm, s.b5)
    hits++
  }
  if (hits > 0 && Number.isFinite(minCold) && Number.isFinite(maxWarm)) {
    return {
      tmin: cToF(minCold),
      tmax: cToF(maxWarm),
      climateSource: "worldclim_bio",
    }
  }

  const c = centroid({ type: "Feature", properties: {}, geometry })
  const [lon, lat] = c.geometry.coordinates
  const s = worldclim.sample(lon, lat)
  if (s && s.b6 <= s.b5 + 3) {
    return {
      tmin: cToF(s.b6),
      tmax: cToF(s.b5),
      climateSource: "worldclim_bio",
    }
  }

  return latEst()
}

function validIso2(s: string | undefined): s is string {
  return !!s && s.length === 2 && /^[A-Z]{2}$/i.test(s) && s.toUpperCase() !== "US"
}

async function main() {
  console.log("Fetching Natural Earth admin-1 GeoJSON…")
  const res = await fetch(NE_URL)
  if (!res.ok) throw new Error(`Natural Earth fetch failed: ${res.status}`)
  const fc = (await res.json()) as FeatureCollection<Polygon | MultiPolygon>

  console.log("Fetching World Bank GNI per capita…")
  let gniByIso3: Record<string, number> = {}
  try {
    gniByIso3 = await fetchGniByIso3()
    console.log(`GNI rows: ${Object.keys(gniByIso3).length}`)
  } catch (e) {
    console.warn("World Bank GNI unavailable, using national/default pricing only:", e)
  }

  const worldclim = await ensureWorldClimBioSampler()
  console.log(
    worldclim
      ? "WorldClim 2.1 BIO5/BIO6 loaded (1970–2000 normals, ~10′ grid)"
      : "Admin-1 climate: latitude estimate fallback (WorldClim unavailable or SKIP_WORLDCLIM=1)",
  )

  const features: Feature<Polygon | MultiPolygon, Record<string, unknown>>[] = []
  let skipped = 0

  for (const raw of fc.features) {
    const p = (raw.properties ?? {}) as NeProps
    const iso2 = p.iso_a2?.toUpperCase()
    if (!validIso2(iso2)) {
      skipped++
      continue
    }
    const adm0 = String(p.adm0_a3 ?? "")
    const adm1 = String(p.adm1_code ?? `${adm0}-${p.name ?? "x"}`)
    const admin = String(p.admin ?? "")
    const name = String(p.name ?? "Unknown")
    const iso3166 = String(p.iso_3166_2 ?? "")

    const geom = raw.geometry
    if (!geom) continue

    const strict = STRICT_SIMPLIFY_ISO2.has(iso2)
    const tolerance = strict ? STRICT_SIMPLIFY_TOLERANCE : SIMPLIFY_TOLERANCE
    const simp = simplify(
      { type: "Feature", properties: {}, geometry: geom },
      { tolerance, highQuality: strict },
    )
    const { tmin, tmax, climateSource } = climateForAdmin1(
      simp.geometry,
      worldclim,
    )
    const { median, source } = resolveAdmin1MedianUsd(adm0, gniByIso3)
    const portals = getPropertyPortalsForCountry(iso2, admin || name)

    const priceSource =
      source === "national_median"
        ? "admin1_national"
        : source === "gni_estimate"
          ? "admin1_gni"
          : "admin1_default"

    features.push({
      type: "Feature",
      id: `a1-${adm1}`,
      geometry: simp.geometry,
      properties: {
        regionKind: "admin1",
        iso2,
        id: adm1,
        name,
        stateAbbr: "",
        adminName: admin,
        iso3166_2: iso3166,
        tmin,
        tmax,
        climateSource,
        medianPrice: median,
        activeListings: null,
        pricePerSqft: null,
        medianDom: null,
        priceSource,
        portalsJson: JSON.stringify(portals),
        matched: 0,
        priceNorm: null,
      },
    })
  }

  const out: FeatureCollection = { type: "FeatureCollection", features }
  fs.mkdirSync(path.dirname(outPath), { recursive: true })
  fs.writeFileSync(outPath, JSON.stringify(out))

  const stat = fs.statSync(outPath)
  console.log(
    `Wrote ${features.length} admin-1 features (${(stat.size / 1e6).toFixed(2)} MB); skipped ${skipped} (US / invalid ISO2)`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
