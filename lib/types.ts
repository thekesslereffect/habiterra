import type { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson"

export type FilterState = {
  tempMin: number
  tempMax: number
  priceMin: number
  priceMax: number
}

export type ClimateRecord = {
  tmin: number
  tmax: number
}

export type HousingRecord = {
  medianListingPrice: number
  activeListingCount: number | null
  medianListingPricePerSqft: number | null
  medianDaysOnMarket: number | null
  monthYyyymm: number
}

export type PriceSourceKind =
  | "admin1_national"
  | "admin1_gni"
  | "admin1_default"
  | "realtor_county"

/** Admin-1 temperature provenance (US counties use NOAA in climate.json). */
export type AdminClimateSource = "worldclim_bio" | "latitude_estimate"

/** Map feature: global admin-1 (state/province) or US county */
export type RegionFeatureProps = {
  regionKind: "admin1" | "us_county"
  iso2: string
  /** adm1_code (admin-1) or county FIPS */
  id: string
  name: string
  stateAbbr: string
  /** Sovereign / country display name (admin-1); US counties: "United States" */
  adminName: string
  /** ISO 3166-2 subdivision code when known */
  iso3166_2: string
  tmin: number | null
  tmax: number | null
  medianPrice: number | null
  activeListings: number | null
  pricePerSqft: number | null
  medianDom: number | null
  /** How medianPrice was derived (for UI disclaimer) */
  priceSource: PriceSourceKind
  /** Admin-1: WorldClim 2.1 BIO6/BIO5 vs latitude fallback */
  climateSource?: AdminClimateSource
  portalsJson: string
  matched: 0 | 1
  priceNorm: number | null
}

export type RegionFeature = Feature<Polygon | MultiPolygon, RegionFeatureProps>

export type RegionFeatureCollection = FeatureCollection<
  Polygon | MultiPolygon,
  RegionFeatureProps
>

/** @deprecated */
export type CountyFeatureProps = RegionFeatureProps

/** @deprecated */
export type CountyFeatureCollection = RegionFeatureCollection
