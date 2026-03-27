"use client"

import { useEffect, useMemo, useState } from "react"
import * as topojson from "topojson-client"
import type { Topology } from "topojson-specification"
import type { FeatureCollection, MultiPolygon, Polygon } from "geojson"

import { getPropertyPortalsForUsCounty } from "@/lib/country-property-portals"
import { stateAbbrFromCountyFips } from "@/lib/constants"
import type {
  AdminClimateSource,
  ClimateRecord,
  FilterState,
  HousingRecord,
  PriceSourceKind,
  RegionFeatureCollection,
  RegionFeatureProps,
} from "@/lib/types"

function fipsFromFeatureId(id: string | number | undefined): string {
  if (id === undefined || id === null) return ""
  const digits = String(id).replace(/\D/g, "")
  if (!digits) return ""
  return digits.padStart(5, "0").slice(0, 5)
}

function parseAdmin1Base(
  fc: RegionFeatureCollection,
): RegionFeatureCollection["features"] {
  return fc.features.map((f) => {
    const p = f.properties as Record<string, unknown>
    return {
      ...f,
      type: "Feature" as const,
      properties: {
        regionKind: "admin1" as const,
        iso2: String(p.iso2 ?? ""),
        id: String(p.id ?? ""),
        name: String(p.name ?? ""),
        stateAbbr: String(p.stateAbbr ?? ""),
        adminName: String(p.adminName ?? ""),
        iso3166_2: String(p.iso3166_2 ?? ""),
        tmin: Number(p.tmin),
        tmax: Number(p.tmax),
        medianPrice: Number(p.medianPrice),
        activeListings: null,
        pricePerSqft: null,
        medianDom: null,
        priceSource: normalizePriceSource(p.priceSource),
        climateSource: normalizeClimateSource(p.climateSource),
        portalsJson: String(p.portalsJson ?? "[]"),
        matched: 0,
        priceNorm: null,
      } satisfies RegionFeatureProps,
    }
  })
}

function normalizePriceSource(v: unknown): PriceSourceKind {
  if (
    v === "admin1_national" ||
    v === "admin1_gni" ||
    v === "admin1_default" ||
    v === "realtor_county"
  ) {
    return v
  }
  return "admin1_default"
}

function normalizeClimateSource(v: unknown): AdminClimateSource | undefined {
  if (v === "worldclim_bio" || v === "latitude_estimate") return v
  return undefined
}

function buildUsCountyFeatures(
  topology: Topology,
  climate: Record<string, ClimateRecord>,
  housing: Record<string, HousingRecord>,
): RegionFeatureCollection["features"] {
  const fc = topojson.feature(
    topology,
    topology.objects["counties"],
  ) as FeatureCollection<Polygon | MultiPolygon>

  return fc.features.map((f) => {
    const fips = fipsFromFeatureId(f.id as string | number | undefined)
    const name = String(
      (f.properties as { name?: string } | null)?.name ?? "Unknown",
    )
    const stateAbbr = stateAbbrFromCountyFips(fips)
    const c = fips ? climate[fips] : undefined
    const h = fips ? housing[fips] : undefined
    const portals = getPropertyPortalsForUsCounty(name, stateAbbr)

    const props: RegionFeatureProps = {
      regionKind: "us_county",
      iso2: "US",
      id: fips,
      name,
      stateAbbr,
      adminName: "United States",
      iso3166_2: "",
      tmin: c?.tmin ?? null,
      tmax: c?.tmax ?? null,
      medianPrice: h?.medianListingPrice ?? null,
      activeListings: h?.activeListingCount ?? null,
      pricePerSqft: h?.medianListingPricePerSqft ?? null,
      medianDom: h?.medianDaysOnMarket ?? null,
      priceSource: "realtor_county",
      portalsJson: JSON.stringify(portals),
      matched: 0,
      priceNorm: null,
    }

    return {
      type: "Feature" as const,
      id: `us-${fips}`,
      geometry: f.geometry,
      properties: props,
    }
  })
}

function applyFilters(
  base: RegionFeatureCollection | null,
  filters: FilterState,
): { collection: RegionFeatureCollection; matchCount: number } {
  if (!base) {
    return {
      collection: { type: "FeatureCollection" as const, features: [] },
      matchCount: 0,
    }
  }

  const { tempMin, tempMax, priceMin, priceMax } = filters

  const pricedMatches: number[] = []
  for (const f of base.features) {
    const p = f.properties
    if (p.tmin === null || p.tmax === null) continue
    const mp = p.medianPrice
    const hasPrice = mp !== null && Number.isFinite(mp)
    const tempOk = p.tmin >= tempMin && p.tmax <= tempMax
    const priceOk = hasPrice && mp >= priceMin && mp <= priceMax
    if (tempOk && priceOk) pricedMatches.push(mp)
  }

  const pMin = pricedMatches.length > 0 ? Math.min(...pricedMatches) : 0
  const pMax = pricedMatches.length > 0 ? Math.max(...pricedMatches) : 1
  const pSpan = pMax - pMin || 1

  const features = base.features.map((f) => {
    const p = f.properties
    let matched: 0 | 1 = 0
    let priceNorm: number | null = null

    if (p.tmin !== null && p.tmax !== null) {
      const mp = p.medianPrice
      const hasPrice = mp !== null && Number.isFinite(mp)
      const tempOk = p.tmin >= tempMin && p.tmax <= tempMax
      const priceOk = hasPrice && mp >= priceMin && mp <= priceMax
      const ok = tempOk && priceOk
      matched = ok ? 1 : 0
      if (ok) {
        priceNorm = (mp - pMin) / pSpan
      }
    }

    return {
      ...f,
      type: "Feature" as const,
      properties: { ...p, matched, priceNorm },
    }
  })

  const matchCount = features.filter((f) => f.properties.matched === 1).length
  return {
    collection: { type: "FeatureCollection" as const, features },
    matchCount,
  }
}

export function useMapData(filters: FilterState) {
  const [base, setBase] = useState<RegionFeatureCollection | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError(null)

    ;(async () => {
      try {
        const [admin1Res, usTopoRes, usClimateRes, housingRes] =
          await Promise.all([
            fetch("/data/admin1-layer.json"),
            fetch("/data/counties-10m.json"),
            fetch("/data/climate.json"),
            fetch("/data/housing.json"),
          ])
        if (
          !admin1Res.ok ||
          !usTopoRes.ok ||
          !usClimateRes.ok ||
          !housingRes.ok
        ) {
          throw new Error("Failed to load map data files")
        }
        const admin1Raw =
          (await admin1Res.json()) as RegionFeatureCollection
        const usTopo = (await usTopoRes.json()) as Topology
        const usClimate = (await usClimateRes.json()) as Record<
          string,
          ClimateRecord
        >
        const housing = (await housingRes.json()) as Record<string, HousingRecord>

        if (cancelled) return

        const admin1Feats = parseAdmin1Base(admin1Raw)
        const countyFeats = buildUsCountyFeatures(usTopo, usClimate, housing)

        setBase({
          type: "FeatureCollection" as const,
          features: [...admin1Feats, ...countyFeats],
        })
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Load error")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [])

  const { collection, matchCount } = useMemo(
    () => applyFilters(base, filters),
    [base, filters],
  )

  return { collection, matchCount, loading, error }
}
