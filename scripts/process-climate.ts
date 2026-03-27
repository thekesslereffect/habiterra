/**
 * Builds county-level typical annual temperature range (°F) from NOAA
 * U.S. Climate Normals 1991–2020 (monthly station normals via NCEI Data Service v1).
 * Assigns each county the normals of the nearest GHCN HCN station (free, no API key).
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import centroid from "@turf/centroid"
import distance from "@turf/distance"
import { point } from "@turf/helpers"
import * as topojson from "topojson-client"
import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson"
import type { Topology } from "topojson-specification"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const outDir = path.join(root, "public", "data")
const outFile = path.join(outDir, "climate.json")

const STATIONS_URL =
  "https://www.ncei.noaa.gov/pub/data/ghcn/daily/ghcnd-stations.txt"
const NCEI_DATA_V1 = "https://www.ncei.noaa.gov/access/services/data/v1"

const BATCH = 18
const REQUEST_DELAY_MS = 350

type Station = { id: string; lat: number; lon: number }

type NceiRow = Record<string, string | number | undefined> & {
  STATION?: string
  DATE?: string
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

function parseGhcnStations(text: string): Station[] {
  const out: Station[] = []
  for (const line of text.split("\n")) {
    if (line.length < 80) continue
    const id = line.slice(0, 11).trim()
    const lat = parseFloat(line.slice(12, 20))
    const lon = parseFloat(line.slice(21, 30))
    const state = line.slice(38, 40).trim()
    // HCN / CRN flag columns 77–79 (1-based) → 0-based slice 76,79
    const hcn = line.slice(76, 79).trim()
    if (!/^[A-Z]{2}$/.test(state)) continue
    if (!hcn.includes("HCN") && !hcn.includes("CRN")) continue
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue
    out.push({ id, lat, lon })
  }
  return out
}

function normalizeTempValue(v: number): number {
  // NCEI often returns tenths of °F as integers (e.g. 523 → 52.3°F)
  if (Math.abs(v) > 200) return v / 10
  return v
}

async function fetchNormalsBatch(ids: string[]): Promise<Map<string, { tmin: number; tmax: number }>> {
  const url = new URL(NCEI_DATA_V1)
  url.searchParams.set("dataset", "normals-monthly-1991-2020")
  url.searchParams.set("stations", ids.join(","))
  url.searchParams.set("dataTypes", "MLY-TMAX-NORMAL,MLY-TMIN-NORMAL")
  url.searchParams.set("startDate", "1991-01-01")
  url.searchParams.set("endDate", "2020-12-31")
  url.searchParams.set("units", "standard")
  url.searchParams.set("format", "json")

  const res = await fetch(url.toString())
  if (!res.ok) {
    const t = await res.text()
    throw new Error(`NCEI ${res.status}: ${t.slice(0, 500)}`)
  }
  const data = (await res.json()) as NceiRow[] | { results?: NceiRow[] }
  const rows: NceiRow[] = Array.isArray(data) ? data : data.results ?? []

  const byStation = new Map<string, { tmins: number[]; tmaxs: number[] }>()
  for (const row of rows) {
    const sid = row.STATION
    if (!sid) continue
    const rawMin = row["MLY-TMIN-NORMAL"]
    const rawMax = row["MLY-TMAX-NORMAL"]
    let tminVal =
      typeof rawMin === "number" ? rawMin : parseFloat(String(rawMin ?? ""))
    let tmaxVal =
      typeof rawMax === "number" ? rawMax : parseFloat(String(rawMax ?? ""))
    if (!Number.isFinite(tminVal) || !Number.isFinite(tmaxVal)) continue
    tminVal = normalizeTempValue(tminVal)
    tmaxVal = normalizeTempValue(tmaxVal)
    if (!byStation.has(sid)) byStation.set(sid, { tmins: [], tmaxs: [] })
    const b = byStation.get(sid)!
    b.tmins.push(tminVal)
    b.tmaxs.push(tmaxVal)
  }

  const result = new Map<string, { tmin: number; tmax: number }>()
  for (const [sid, { tmins, tmaxs }] of byStation) {
    if (tmins.length === 0 || tmaxs.length === 0) continue
    result.set(sid, {
      tmin: Math.min(...tmins),
      tmax: Math.max(...tmaxs),
    })
  }
  return result
}

/** Rough lat-based fallback (°F) when NCEI is unavailable */
function latFallback(lat: number): { tmin: number; tmax: number } {
  const tmin = Math.round(Math.max(-50, Math.min(70, 75 - Math.abs(lat - 35) * 1.4)))
  const tmax = Math.round(Math.min(120, tmin + 28 + Math.abs(lat - 25) * 0.15))
  return { tmin, tmax }
}

async function main() {
  fs.mkdirSync(outDir, { recursive: true })

  const topoPath = path.join(root, "node_modules", "us-atlas", "counties-10m.json")
  const topology = JSON.parse(fs.readFileSync(topoPath, "utf8")) as Topology
  const counties = topojson.feature(
    topology,
    topology.objects["counties"],
  ) as FeatureCollection<Polygon | MultiPolygon>

  console.log("Fetching GHCN station inventory…")
  const stationText = await fetch(STATIONS_URL).then((r) => {
    if (!r.ok) throw new Error(`Stations fetch ${r.status}`)
    return r.text()
  })
  const stations = parseGhcnStations(stationText)
  console.log(`HCN/CRN stations: ${stations.length}`)

  const stationTemps = new Map<string, { tmin: number; tmax: number }>()
  let useFallback = false

  for (let i = 0; i < stations.length; i += BATCH) {
    const chunk = stations.slice(i, i + BATCH).map((s) => s.id)
    process.stdout.write(`\rNCEI normals ${i + chunk.length}/${stations.length}…`)
    try {
      const batchMap = await fetchNormalsBatch(chunk)
      for (const [id, t] of batchMap) stationTemps.set(id, t)
    } catch (e) {
      console.error("\nNCEI batch failed, using lat fallback for remaining:", e)
      useFallback = true
      break
    }
    await sleep(REQUEST_DELAY_MS)
  }
  console.log("")

  if (stationTemps.size === 0) {
    console.warn("No station normals retrieved — using latitude fallback for all counties.")
    useFallback = true
  } else {
    console.log(`Station normals loaded: ${stationTemps.size}`)
  }

  const byFips: Record<string, { tmin: number; tmax: number }> = {}

  for (const f of counties.features) {
    const fid = String((f as Feature).id ?? "").padStart(5, "0")
    if (fid.length !== 5) continue

    const c = centroid(f as Feature<Polygon | MultiPolygon>)
    const [lon, lat] = c.geometry.coordinates

    if (useFallback || stationTemps.size === 0) {
      byFips[fid] = latFallback(lat)
      continue
    }

    let bestId: string | null = null
    let bestD = Infinity
    for (const s of stations) {
      if (!stationTemps.has(s.id)) continue
      const d = distance(point([lon, lat]), point([s.lon, s.lat]), { units: "kilometers" })
      if (d < bestD) {
        bestD = d
        bestId = s.id
      }
    }

    if (bestId) {
      byFips[fid] = { ...stationTemps.get(bestId)! }
    } else {
      byFips[fid] = latFallback(lat)
    }
  }

  fs.writeFileSync(outFile, JSON.stringify(byFips))
  console.log(`Wrote ${Object.keys(byFips).length} counties → ${outFile}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
