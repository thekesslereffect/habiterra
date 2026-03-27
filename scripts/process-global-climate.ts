/**
 * One country centroid → Open-Meteo Archive (2015–2024 daily min/max, °F),
 * aggregated to “typical coldest month low / hottest month high” (like US normals).
 * Deduplicates by ISO alpha-2. Skips US (county-level NOAA used in app).
 * Falls back to latitude-based estimate if the API fails.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import centroid from "@turf/centroid"
import countries from "i18n-iso-countries"
import { climateFromLat } from "../lib/latitude-climate"
import * as topojson from "topojson-client"
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson"
import type { Topology } from "topojson-specification"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const outFile = path.join(root, "public", "data", "global-climate.json")

/** Pause between Open-Meteo calls to reduce rate limiting (increase if many fallbacks). */
const DELAY_MS = 450

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms))
}

type Daily = {
  time: string[]
  temperature_2m_max: (number | null)[]
  temperature_2m_min: (number | null)[]
}

function aggregateFromDaily(daily: Daily): { tmin: number; tmax: number } {
  const monthMins: number[][] = Array.from({ length: 12 }, () => [])
  const monthMaxs: number[][] = Array.from({ length: 12 }, () => [])

  for (let i = 0; i < daily.time.length; i++) {
    const tmin = daily.temperature_2m_min[i]
    const tmax = daily.temperature_2m_max[i]
    if (tmin == null || tmax == null) continue
    const m = new Date(daily.time[i] + "T12:00:00Z").getUTCMonth()
    monthMins[m].push(tmin)
    monthMaxs[m].push(tmax)
  }

  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : NaN
  const avgLows = monthMins.map(avg)
  const avgHighs = monthMaxs.map(avg)
  const finiteLows = avgLows.filter(Number.isFinite)
  const finiteHighs = avgHighs.filter(Number.isFinite)
  if (finiteLows.length === 0 || finiteHighs.length === 0) {
    throw new Error("empty monthly aggregates")
  }
  return {
    tmin: Math.round(Math.min(...finiteLows)),
    tmax: Math.round(Math.max(...finiteHighs)),
  }
}

async function fetchClimate(lat: number, lon: number): Promise<{ tmin: number; tmax: number }> {
  const url = new URL("https://archive-api.open-meteo.com/v1/archive")
  url.searchParams.set("latitude", String(lat))
  url.searchParams.set("longitude", String(lon))
  url.searchParams.set("start_date", "2015-01-01")
  url.searchParams.set("end_date", "2024-12-31")
  url.searchParams.set("daily", "temperature_2m_max,temperature_2m_min")
  url.searchParams.set("timezone", "GMT")
  url.searchParams.set("temperature_unit", "fahrenheit")

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const j = (await res.json()) as { daily?: Daily }
  if (!j.daily?.time?.length) throw new Error("no daily series")
  return aggregateFromDaily(j.daily)
}

async function main() {
  const topoPath = path.join(root, "node_modules", "world-atlas", "countries-110m.json")
  const topology = JSON.parse(fs.readFileSync(topoPath, "utf8")) as Topology
  const fc = topojson.feature(
    topology,
    topology.objects.countries,
  ) as FeatureCollection<Polygon | MultiPolygon>

  const byIso: Record<string, { tmin: number; tmax: number }> = {}
  const seen = new Set<string>()
  let apiOk = 0
  let fallback = 0

  for (const f of fc.features) {
    const numId = String(f.id ?? "").padStart(3, "0")
    const iso2 = countries.numericToAlpha2(numId)
    if (!iso2 || iso2 === "US") continue
    if (seen.has(iso2)) continue
    seen.add(iso2)

    const c = centroid(f)
    const [lon, lat] = c.geometry.coordinates

    try {
      byIso[iso2] = await fetchClimate(lat, lon)
      apiOk++
    } catch {
      byIso[iso2] = climateFromLat(lat)
      fallback++
    }

    process.stdout.write(`\r${iso2} (${apiOk} API / ${fallback} est)…`)
    await sleep(DELAY_MS)
  }

  console.log("")
  fs.mkdirSync(path.dirname(outFile), { recursive: true })
  fs.writeFileSync(outFile, JSON.stringify(byIso))
  console.log(
    `Wrote ${Object.keys(byIso).length} countries → ${outFile} (${apiOk} Open-Meteo, ${fallback} lat estimate)`,
  )
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
