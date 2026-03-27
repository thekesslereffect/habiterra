"use client"

import { ExternalLink } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatPrice } from "@/lib/constants"
import type { PropertyPortal } from "@/lib/country-property-portals"
import type { RegionFeatureProps } from "@/lib/types"

function parsePortals(json: string): PropertyPortal[] {
  try {
    const v = JSON.parse(json) as unknown
    if (!Array.isArray(v)) return []
    return v.filter(
      (x): x is PropertyPortal =>
        x &&
        typeof x === "object" &&
        typeof (x as PropertyPortal).label === "string" &&
        typeof (x as PropertyPortal).url === "string",
    )
  } catch {
    return []
  }
}

function priceSourceNote(source: RegionFeatureProps["priceSource"]): string {
  switch (source) {
    case "admin1_national":
      return "National median estimate for this country (not subdivision-specific)."
    case "admin1_gni":
      return "Estimated from national income data — indicative only."
    case "admin1_default":
      return "Default placeholder median — verify locally."
    case "realtor_county":
      return ""
    default:
      return ""
  }
}

export function RegionPopupContent({
  props: p,
  hideTitle = false,
}: {
  props: RegionFeatureProps
  /** Mobile sheet shows name in its header; keep subtitle + id only here. */
  hideTitle?: boolean
}) {
  const portals = parsePortals(p.portalsJson)
  const isCounty = p.regionKind === "us_county"
  const isAdmin1 = p.regionKind === "admin1"
  const adminLabel = isCounty && p.stateAbbr === "LA" ? "Parish" : "County"
  const title = isCounty ? `${p.name} ${adminLabel}` : p.name
  const subtitle = isCounty
    ? p.stateAbbr
    : p.adminName || p.iso2
  const idLine = isCounty
    ? `FIPS ${p.id}`
    : p.iso3166_2
      ? p.iso3166_2
      : `ISO ${p.iso2}`

  return (
    <div className="text-card-foreground min-w-0 max-w-full space-y-3 p-1 text-sm sm:min-w-[240px] sm:max-w-[280px]">
      {hideTitle ? (
        <div className="text-muted-foreground flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-xs">
          <span className="tracking-wide uppercase">{subtitle}</span>
          <span className="font-mono">{idLine}</span>
        </div>
      ) : (
        <div>
          <p className="text-muted-foreground text-xs tracking-wide uppercase">
            {subtitle}
          </p>
          <p className="text-base font-semibold">{title}</p>
          <p className="text-muted-foreground font-mono text-xs">{idLine}</p>
        </div>
      )}

      <Separator />

      <dl className="grid grid-cols-2 gap-x-2 gap-y-1.5 text-xs">
        <dt className="text-muted-foreground">Typical low</dt>
        <dd className="text-right font-medium tabular-nums">
          {p.tmin !== null ? `${Math.round(p.tmin)}°F` : "—"}
        </dd>
        <dt className="text-muted-foreground">Typical high</dt>
        <dd className="text-right font-medium tabular-nums">
          {p.tmax !== null ? `${Math.round(p.tmax)}°F` : "—"}
        </dd>
        {isCounty ? (
          <>
            <dt className="text-muted-foreground">Median list</dt>
            <dd className="text-right font-medium tabular-nums">
              {p.medianPrice !== null ? formatPrice(p.medianPrice) : "—"}
            </dd>
            <dt className="text-muted-foreground">Active listings</dt>
            <dd className="text-right font-medium tabular-nums">
              {p.activeListings !== null
                ? p.activeListings.toLocaleString()
                : "—"}
            </dd>
            <dt className="text-muted-foreground">Med. $/sqft</dt>
            <dd className="text-right font-medium tabular-nums">
              {p.pricePerSqft !== null ? `$${Math.round(p.pricePerSqft)}` : "—"}
            </dd>
            <dt className="text-muted-foreground">Med. DOM</dt>
            <dd className="text-right font-medium tabular-nums">
              {p.medianDom !== null ? `${Math.round(p.medianDom)} d` : "—"}
            </dd>
          </>
        ) : null}
        {isAdmin1 ? (
          <>
            <dt className="text-muted-foreground">Est. median</dt>
            <dd className="text-right font-medium tabular-nums">
              {p.medianPrice !== null ? formatPrice(p.medianPrice) : "—"}
            </dd>
          </>
        ) : null}
      </dl>
      {isAdmin1 ? (
        <p className="text-muted-foreground text-[0.65rem] leading-snug">
          {p.climateSource === "worldclim_bio" ? (
            <>
              Temperatures are °F, converted from WorldClim 2.1 bioclimatic
              normals (1970–2000): BIO6 = min temperature of coldest month, BIO5 =
              max of warmest month (~10′ grid; not local station data). CC BY 4.0
              (Fick & Hijmans 2017).{" "}
            </>
          ) : (
            <>
              Climate is °F from a latitude + region-span estimate when WorldClim
              rasters are unavailable — not station normals.{" "}
            </>
          )}
          {priceSourceNote(p.priceSource)}
        </p>
      ) : null}

      {p.matched !== 1 && (
        <p className="text-muted-foreground text-xs">
          This region is outside your current temperature or price filters.
        </p>
      )}

      <Separator />

      <div className="flex flex-col gap-2">
        {portals.map((portal) => (
          <Button
            key={`${portal.label}-${portal.url}`}
            variant={portal === portals[0] ? "default" : "outline"}
            size="sm"
            className="w-full"
            asChild
          >
            <a href={portal.url} target="_blank" rel="noopener noreferrer">
              {portal.label}
              <ExternalLink className="ml-1 inline size-3.5 opacity-70" />
            </a>
          </Button>
        ))}
      </div>

      <p className="text-muted-foreground text-[0.65rem] leading-snug">
        {isCounty
          ? "Housing stats are county aggregates from Realtor.com research data."
          : isAdmin1
            ? "Portal links point to common listing sites or search — verify in your market."
            : "Portal links are common regional listing sites or a web search fallback — verify in your market."}
      </p>
    </div>
  )
}
