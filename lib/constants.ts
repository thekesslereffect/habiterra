import type { FilterState } from "@/lib/types"

/** Initial map view: whole world */
export const WORLD_VIEW = {
  longitude: 12,
  latitude: 24,
  zoom: 1.35,
  minZoom: 1,
  maxZoom: 12,
} as const

/** Carto GL basemaps (no API key) */
export const MAP_STYLES = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
} as const

export const DEFAULT_FILTERS: FilterState = {
  tempMin: 10,
  tempMax: 75,
  priceMin: 100_000,
  priceMax: 1_000_000,
}

/** Slider domain (°F) */
export const TEMP_SLIDER_DOMAIN: [number, number] = [-30, 120]

/** Slider domain (USD) */
export const PRICE_SLIDER_DOMAIN: [number, number] = [0, 2_000_000]

/** Choropleth: green (lower price) → red (higher) within visible matches */
export const PRICE_COLOR_LOW = "#22c55e"
export const PRICE_COLOR_HIGH = "#ef4444"

/** First two digits of county FIPS → USPS state abbreviation */
export const STATE_FIPS_TO_ABBR: Record<string, string> = {
  "01": "AL",
  "02": "AK",
  "04": "AZ",
  "05": "AR",
  "06": "CA",
  "08": "CO",
  "09": "CT",
  "10": "DE",
  "11": "DC",
  "12": "FL",
  "13": "GA",
  "15": "HI",
  "16": "ID",
  "17": "IL",
  "18": "IN",
  "19": "IA",
  "20": "KS",
  "21": "KY",
  "22": "LA",
  "23": "ME",
  "24": "MD",
  "25": "MA",
  "26": "MI",
  "27": "MN",
  "28": "MS",
  "29": "MO",
  "30": "MT",
  "31": "NE",
  "32": "NV",
  "33": "NH",
  "34": "NJ",
  "35": "NM",
  "36": "NY",
  "37": "NC",
  "38": "ND",
  "39": "OH",
  "40": "OK",
  "41": "OR",
  "42": "PA",
  "44": "RI",
  "45": "SC",
  "46": "SD",
  "47": "TN",
  "48": "TX",
  "49": "UT",
  "50": "VT",
  "51": "VA",
  "53": "WA",
  "54": "WV",
  "55": "WI",
  "56": "WY",
  "60": "AS",
  "66": "GU",
  "69": "MP",
  "72": "PR",
  "78": "VI",
}

export function stateAbbrFromCountyFips(fips: string): string {
  const prefix = fips.slice(0, 2)
  return STATE_FIPS_TO_ABBR[prefix] ?? "US"
}

/** Realtor.com search URL for a county (public research site pattern) */
export function realtorCountySearchUrl(countyName: string, stateAbbr: string): string {
  const base = countyName.replace(/\s+County$/i, "").trim()
  const slug = `${base.replace(/\s+/g, "-")}-County_${stateAbbr}`
  return `https://www.realtor.com/realestateandhomes-search/${slug}`
}

/** Zillow county browse pattern */
export function zillowCountyUrl(countyName: string, stateAbbr: string): string {
  const base = countyName.replace(/\s+County$/i, "").trim()
  const slug = `${base.replace(/\s+/g, "-").toLowerCase()}-county-${stateAbbr.toLowerCase()}`
  return `https://www.zillow.com/${slug}/`
}

export function formatPrice(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(n % 1_000_000 === 0 ? 0 : 1)}M`
  if (n >= 1000) return `$${Math.round(n / 1000)}k`
  return `$${n}`
}
