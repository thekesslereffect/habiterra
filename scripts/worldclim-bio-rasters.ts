/**
 * WorldClim 2.1 bioclimatic rasters (Fick & Hijmans 2017, CC BY 4.0).
 * BIO5 = max temperature of warmest month (°C), BIO6 = min of coldest month (°C),
 * 1970–2000 normals — much closer to “typical high / low” than latitude guesses.
 *
 * Cache: data/worldclim/ (gitignored .tif / .zip).
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { unzipSync } from "fflate"
import { fromArrayBuffer } from "geotiff"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
export const DEFAULT_WORLDCLIM_DIR = path.join(__dirname, "..", "data", "worldclim")

const ZIP_URL =
  "https://geodata.ucdavis.edu/climate/worldclim/2_1/base/wc2.1_10m_bio.zip"

const BIO5_NAME = "wc2.1_10m_bio_5.tif"
const BIO6_NAME = "wc2.1_10m_bio_6.tif"

export type BioSampler = {
  sample: (lon: number, lat: number) => { b5: number; b6: number } | null
}

function findZipEntry(entries: Record<string, Uint8Array>, re: RegExp): Uint8Array | null {
  for (const [name, data] of Object.entries(entries)) {
    const base = name.split("/").pop() ?? name
    if (re.test(base)) return data
  }
  return null
}

function celsiusFromRaw(v: number): number {
  if (!Number.isFinite(v)) return NaN
  if (v < -200 || v > 85) return NaN
  return v
}

async function loadGridAsync(buf: Uint8Array): Promise<{
  w: number
  h: number
  bbox: readonly [number, number, number, number]
  get: (px: number, py: number) => number
}> {
  const ab = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength,
  ) as ArrayBuffer
  const tiff = await fromArrayBuffer(ab)
  const image = await tiff.getImage()
  const w = image.getWidth()
  const h = image.getHeight()
  const bbox = image.getBoundingBox() as [number, number, number, number]
  const rasters = await image.readRasters({ interleave: false })
  const band = rasters[0] as
    | Int8Array
    | Uint8Array
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Float32Array
    | Float64Array

  const get = (px: number, py: number): number => {
    const x = Math.min(w - 1, Math.max(0, px))
    const y = Math.min(h - 1, Math.max(0, py))
    return Number(band[y * w + x])
  }

  return { w, h, bbox, get }
}

function makeSampler(
  g5: { w: number; h: number; bbox: readonly [number, number, number, number]; get: (px: number, py: number) => number },
  g6: { w: number; h: number; bbox: readonly [number, number, number, number]; get: (px: number, py: number) => number },
): BioSampler {
  const [west, south, east, north] = g5.bbox
  if (g5.w !== g6.w || g5.h !== g6.h) {
    throw new Error("WorldClim BIO5/BIO6 grid size mismatch")
  }
  const { w, h } = g5

  return {
    sample(lon: number, lat: number) {
      if (lon < west || lon > east || lat < south || lat > north) return null
      const px = Math.min(
        w - 1,
        Math.max(0, Math.floor(((lon - west) / (east - west)) * w)),
      )
      const py = Math.min(
        h - 1,
        Math.max(0, Math.floor(((north - lat) / (north - south)) * h)),
      )
      const b5 = celsiusFromRaw(g5.get(px, py))
      const b6 = celsiusFromRaw(g6.get(px, py))
      if (!Number.isFinite(b5) || !Number.isFinite(b6)) return null
      return { b5, b6 }
    },
  }
}

export async function ensureWorldClimBioSampler(
  cacheDir: string = DEFAULT_WORLDCLIM_DIR,
): Promise<BioSampler | null> {
  if (process.env.SKIP_WORLDCLIM === "1") {
    console.warn("SKIP_WORLDCLIM=1 — using latitude estimates for admin-1 climate")
    return null
  }

  fs.mkdirSync(cacheDir, { recursive: true })
  const p5 = path.join(cacheDir, BIO5_NAME)
  const p6 = path.join(cacheDir, BIO6_NAME)

  if (!fs.existsSync(p5) || !fs.existsSync(p6)) {
    console.log("Downloading WorldClim 2.1 10m bioclim zip (~48 MB)…")
    const res = await fetch(ZIP_URL)
    if (!res.ok) throw new Error(`WorldClim zip failed: ${res.status}`)
    const zipBuf = new Uint8Array(await res.arrayBuffer())
    const entries = unzipSync(zipBuf)
    const d5 = findZipEntry(entries, /^wc2\.1_10m_bio_5\.tif$/i)
    const d6 = findZipEntry(entries, /^wc2\.1_10m_bio_6\.tif$/i)
    if (!d5?.length || !d6?.length) {
      throw new Error("WorldClim zip missing wc2.1_10m_bio_5.tif or bio_6.tif")
    }
    fs.writeFileSync(p5, d5)
    fs.writeFileSync(p6, d6)
    console.log("Extracted BIO5/BIO6 GeoTIFFs to data/worldclim/")
  }

  const [buf5, buf6] = await Promise.all([
    fs.promises.readFile(p5),
    fs.promises.readFile(p6),
  ])

  const [g5, g6] = await Promise.all([
    loadGridAsync(new Uint8Array(buf5)),
    loadGridAsync(new Uint8Array(buf6)),
  ])

  return makeSampler(g5, g6)
}
