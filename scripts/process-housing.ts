/**
 * Downloads Realtor.com Residential Data Library county inventory CSV (free, public)
 * and writes public/data/housing.json keyed by 5-digit county FIPS.
 */
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"
import Papa from "papaparse"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, "..")
const outDir = path.join(root, "public", "data")
const outFile = path.join(outDir, "housing.json")

const COUNTY_CSV_URL =
  "https://econdata.s3-us-west-2.amazonaws.com/Reports/Core/RDC_Inventory_Core_Metrics_County.csv"

type HousingRow = Record<string, string>

function pick(row: HousingRow, ...keys: string[]): string | undefined {
  for (const k of keys) {
    if (row[k] !== undefined && row[k] !== "") return row[k]
  }
  return undefined
}

function parseNumber(s: string | undefined): number | null {
  if (s === undefined || s === "") return null
  const n = Number(s)
  return Number.isFinite(n) ? n : null
}

async function main() {
  console.log("Fetching county housing CSV…")
  const res = await fetch(COUNTY_CSV_URL, { redirect: "follow" })
  if (!res.ok) {
    throw new Error(`Housing CSV fetch failed: ${res.status} ${res.statusText}`)
  }
  const text = await res.text()

  const parsed = Papa.parse<HousingRow>(text, {
    header: true,
    skipEmptyLines: true,
  })

  if (parsed.errors.length) {
    console.warn("CSV parse warnings:", parsed.errors.slice(0, 5))
  }

  let latestMonth = 0
  for (const row of parsed.data) {
    const m = pick(row, "month_date_yyyymm", "month_date_yyyy_mm", "Month")
    if (!m) continue
    const n = parseInt(m.replace(/\D/g, ""), 10)
    if (Number.isFinite(n) && n > latestMonth) latestMonth = n
  }

  if (latestMonth === 0) {
    throw new Error("Could not determine latest month from housing CSV")
  }

  console.log("Using latest month:", latestMonth)

  const byFips: Record<
    string,
    {
      medianListingPrice: number
      activeListingCount: number | null
      medianListingPricePerSqft: number | null
      medianDaysOnMarket: number | null
      monthYyyymm: number
    }
  > = {}

  for (const row of parsed.data) {
    const monthStr = pick(row, "month_date_yyyymm", "month_date_yyyy_mm", "Month")
    if (!monthStr) continue
    const month = parseInt(monthStr.replace(/\D/g, ""), 10)
    if (month !== latestMonth) continue

    const fipsRaw = pick(
      row,
      "county_fips",
      "County_FIPS",
      "county_fips_code",
      "FIPS",
    )
    if (!fipsRaw) continue
    const fips = fipsRaw.replace(/\D/g, "").padStart(5, "0")
    if (fips.length !== 5) continue

    const price = parseNumber(
      pick(row, "median_listing_price", "Median_Listing_Price", "median_listing_price_usd"),
    )
    if (price === null || price <= 0) continue

    const active = parseNumber(
      pick(row, "active_listing_count", "Active_Listing_Count"),
    )
    const ppsf = parseNumber(
      pick(
        row,
        "median_listing_price_per_sqft",
        "Median_Listing_Price_Per_Sqft",
        "median_listing_price_per_square_foot",
      ),
    )
    const dom = parseNumber(
      pick(row, "median_days_on_market", "Median_DOM", "median_dom"),
    )

    byFips[fips] = {
      medianListingPrice: price,
      activeListingCount: active,
      medianListingPricePerSqft: ppsf,
      medianDaysOnMarket: dom,
      monthYyyymm: latestMonth,
    }
  }

  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(outFile, JSON.stringify(byFips))
  console.log(`Wrote ${Object.keys(byFips).length} counties → ${outFile}`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
