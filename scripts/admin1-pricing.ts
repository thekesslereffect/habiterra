/**
 * National / indicative dwelling-price baselines (USD) and GNI-based estimates.
 * Used for non-US admin-1 regions (no global MLS feed). Curated ballparks where
 * possible; otherwise derived from World Bank GNI per capita.
 */

/** Natural Earth `adm0_a3` → indicative national median dwelling price (USD) */
export const NATIONAL_MEDIAN_USD: Record<string, number> = {
  AFG: 45_000,
  ALB: 95_000,
  DZA: 55_000,
  AND: 550_000,
  AGO: 75_000,
  ARG: 95_000,
  ARM: 85_000,
  AUS: 620_000,
  AUT: 480_000,
  AZE: 72_000,
  BHS: 380_000,
  BHR: 220_000,
  BGD: 35_000,
  BLR: 65_000,
  BEL: 360_000,
  BLZ: 120_000,
  BEN: 42_000,
  BOL: 58_000,
  BIH: 95_000,
  BWA: 85_000,
  BRA: 95_000,
  BRN: 280_000,
  BGR: 125_000,
  BFA: 28_000,
  KHM: 55_000,
  CMR: 48_000,
  CAN: 485_000,
  CPV: 95_000,
  CHL: 165_000,
  CHN: 145_000,
  COL: 72_000,
  CRI: 145_000,
  HRV: 165_000,
  CUB: 35_000,
  CYP: 310_000,
  CZE: 245_000,
  COD: 22_000,
  DNK: 385_000,
  DOM: 95_000,
  ECU: 85_000,
  EGY: 48_000,
  SLV: 72_000,
  EST: 195_000,
  ETH: 38_000,
  FJI: 95_000,
  FIN: 285_000,
  FRA: 310_000,
  GAB: 95_000,
  GEO: 72_000,
  DEU: 385_000,
  GHA: 55_000,
  GRC: 175_000,
  GTM: 72_000,
  GIN: 32_000,
  HTI: 28_000,
  HND: 58_000,
  HKG: 720_000,
  HUN: 145_000,
  ISL: 485_000,
  IND: 48_000,
  IDN: 58_000,
  IRN: 72_000,
  IRQ: 65_000,
  IRL: 365_000,
  ISR: 485_000,
  ITA: 265_000,
  CIV: 58_000,
  JAM: 125_000,
  JPN: 315_000,
  JOR: 95_000,
  KAZ: 95_000,
  KEN: 48_000,
  KWT: 285_000,
  KGZ: 48_000,
  LAO: 42_000,
  LVA: 125_000,
  LBN: 185_000,
  LBR: 28_000,
  LBY: 55_000,
  LTU: 165_000,
  LUX: 820_000,
  MKD: 95_000,
  MDG: 22_000,
  MWI: 28_000,
  MYS: 185_000,
  MDV: 220_000,
  MLI: 28_000,
  MLT: 385_000,
  MRT: 38_000,
  MUS: 185_000,
  MEX: 85_000,
  MDA: 72_000,
  MNG: 72_000,
  MNE: 165_000,
  MAR: 95_000,
  MOZ: 38_000,
  MMR: 42_000,
  NAM: 72_000,
  NPL: 38_000,
  NLD: 445_000,
  NZL: 585_000,
  NIC: 58_000,
  NER: 22_000,
  NGA: 42_000,
  NOR: 485_000,
  OMN: 185_000,
  PAK: 42_000,
  PAN: 145_000,
  PNG: 65_000,
  PRY: 72_000,
  PER: 95_000,
  PHL: 72_000,
  POL: 165_000,
  PRT: 285_000,
  QAT: 385_000,
  ROU: 125_000,
  RUS: 95_000,
  RWA: 48_000,
  SAU: 220_000,
  SEN: 48_000,
  SRB: 125_000,
  SLE: 28_000,
  SGP: 720_000,
  SVK: 185_000,
  SVN: 265_000,
  ZAF: 105_000,
  KOR: 385_000,
  SSD: 22_000,
  ESP: 265_000,
  LKA: 72_000,
  SDN: 32_000,
  SUR: 72_000,
  SWZ: 55_000,
  SWE: 385_000,
  CHE: 985_000,
  SYR: 28_000,
  TWN: 385_000,
  TJK: 42_000,
  TZA: 38_000,
  THA: 95_000,
  TLS: 48_000,
  TGO: 28_000,
  TTO: 165_000,
  TUN: 72_000,
  TUR: 125_000,
  TKM: 48_000,
  UGA: 38_000,
  UKR: 48_000,
  ARE: 385_000,
  GBR: 315_000,
  URY: 145_000,
  UZB: 58_000,
  VEN: 38_000,
  VNM: 85_000,
  YEM: 22_000,
  ZMB: 48_000,
  ZWE: 38_000,
}

export function medianFromGni(gniPerCapita: number): number {
  const g = Math.max(800, Math.min(gniPerCapita, 130_000))
  return Math.round(18_000 + 380 * Math.pow(g, 0.79))
}

export type PriceSource = "national_median" | "gni_estimate" | "default_estimate"

export function resolveAdmin1MedianUsd(
  adm0_a3: string,
  gniByIso3: Record<string, number>,
): { median: number; source: PriceSource } {
  const nat = NATIONAL_MEDIAN_USD[adm0_a3]
  if (nat !== undefined) {
    return { median: nat, source: "national_median" }
  }
  const gni = gniByIso3[adm0_a3]
  if (gni !== undefined && Number.isFinite(gni)) {
    return { median: medianFromGni(gni), source: "gni_estimate" }
  }
  return { median: 125_000, source: "default_estimate" }
}

type WbRow = {
  country?: { id?: string }
  countryiso3code?: string
  value: string | number | null
  date?: string
}

type WbMeta = { page: number; pages: number; per_page: number }

/** Latest GNI per capita (Atlas method, current US$) by ISO3 (`countryiso3code`) */
export async function fetchGniByIso3(): Promise<Record<string, number>> {
  const best: Record<string, { v: number; y: number }> = {}
  let page = 1
  let pages = 1

  do {
    const url = new URL(
      "https://api.worldbank.org/v2/country/all/indicator/NY.GNP.PCAP.CD",
    )
    url.searchParams.set("format", "json")
    url.searchParams.set("mrv", "1")
    url.searchParams.set("per_page", "500")
    url.searchParams.set("page", String(page))

    const res = await fetch(url.toString())
    if (!res.ok) throw new Error(`World Bank GNI fetch ${res.status}`)
    const data = (await res.json()) as [WbMeta, WbRow[]]
    const meta = data[0]
    const rows = data[1]
    pages = meta?.pages ?? 1

    if (Array.isArray(rows)) {
      for (const r of rows) {
        const iso3 = r.countryiso3code
        if (!iso3 || !/^[A-Z]{3}$/i.test(iso3)) continue
        const v = typeof r.value === "number" ? r.value : Number(r.value)
        if (!Number.isFinite(v)) continue
        const y = r.date ? parseInt(r.date, 10) : 0
        const key = iso3.toUpperCase()
        const cur = best[key]
        if (!cur || y >= cur.y) best[key] = { v, y }
      }
    }
    page++
  } while (page <= pages)

  const out: Record<string, number> = {}
  for (const [k, { v }] of Object.entries(best)) out[k] = v
  return out
}
