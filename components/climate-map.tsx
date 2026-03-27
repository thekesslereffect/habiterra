"use client"

import { useCallback, useMemo } from "react"
import Map, {
  Layer,
  Popup,
  Source,
  type MapLayerMouseEvent,
} from "react-map-gl/maplibre"

import { RegionPopupContent } from "@/components/region-popup"
import {
  MAP_STYLES,
  PRICE_COLOR_HIGH,
  PRICE_COLOR_LOW,
  TEMP_COLOR_HIGH,
  TEMP_COLOR_LOW,
  WORLD_VIEW,
} from "@/lib/constants"
import type {
  AdminClimateSource,
  MatchGradientMode,
  RegionFeatureCollection,
  RegionFeatureProps,
  RegionPick,
} from "@/lib/types"

import "maplibre-gl/dist/maplibre-gl.css"

export type { RegionPick } from "@/lib/types"

type ClimateMapProps = {
  data: RegionFeatureCollection
  isDark: boolean
  popup: RegionPick | null
  onRegionPick: (pick: RegionPick | null) => void
  /** Choropleth for matched regions: price vs mean typical temperature. */
  matchGradientMode?: MatchGradientMode
  /** When false, parent renders mobile UI (e.g. bottom sheet) instead of MapLibre Popup. */
  mapPopup?: boolean
}

function parseProps(raw: Record<string, unknown>): RegionFeatureProps {
  const num = (v: unknown) =>
    v === null || v === undefined || v === "" ? null : Number(v)
  const matchedRaw = raw.matched
  const matched: 0 | 1 =
    matchedRaw === 1 || matchedRaw === true || matchedRaw === "1" ? 1 : 0
  const rk =
    raw.regionKind === "us_county" ? "us_county" : "admin1"

  const ps = raw.priceSource
  const priceSource =
    ps === "admin1_national" ||
    ps === "admin1_gni" ||
    ps === "admin1_default" ||
    ps === "realtor_county"
      ? ps
      : rk === "us_county"
        ? "realtor_county"
        : "admin1_default"

  const cs = raw.climateSource
  const climateSource: AdminClimateSource | undefined =
    cs === "worldclim_bio" || cs === "latitude_estimate" ? cs : undefined

  return {
    regionKind: rk,
    iso2: String(raw.iso2 ?? ""),
    id: String(raw.id ?? ""),
    name: String(raw.name ?? ""),
    stateAbbr: String(raw.stateAbbr ?? ""),
    adminName: String(raw.adminName ?? ""),
    iso3166_2: String(raw.iso3166_2 ?? ""),
    tmin: num(raw.tmin),
    tmax: num(raw.tmax),
    medianPrice: num(raw.medianPrice),
    activeListings: num(raw.activeListings),
    pricePerSqft: num(raw.pricePerSqft),
    medianDom: num(raw.medianDom),
    priceSource,
    climateSource: rk === "admin1" ? climateSource : undefined,
    portalsJson: String(raw.portalsJson ?? "[]"),
    matched,
    priceNorm: num(raw.priceNorm),
    tempNorm: num(raw.tempNorm),
  }
}

const ADMIN1_FILL_FILTER = [
  "==",
  ["get", "regionKind"],
  "admin1",
] as const

const US_COUNTY_FILL_FILTER = [
  "==",
  ["get", "regionKind"],
  "us_county",
] as const

export function ClimateMap({
  data,
  isDark,
  popup,
  onRegionPick,
  matchGradientMode = "price",
  mapPopup = true,
}: ClimateMapProps) {
  const mapStyle = isDark ? MAP_STYLES.dark : MAP_STYLES.light

  const fillPaint = useMemo(() => {
    const normKey =
      matchGradientMode === "temperature" ? "tempNorm" : "priceNorm"
    const low =
      matchGradientMode === "temperature" ? TEMP_COLOR_LOW : PRICE_COLOR_LOW
    const high =
      matchGradientMode === "temperature" ? TEMP_COLOR_HIGH : PRICE_COLOR_HIGH
    return {
      "fill-color": [
        "case",
        ["==", ["get", "matched"], 1],
        [
          "interpolate",
          ["linear"],
          ["coalesce", ["get", normKey], 0],
          0,
          low,
          1,
          high,
        ],
        "rgba(0,0,0,0)",
      ],
      "fill-opacity": 0.72,
    }
  }, [matchGradientMode])

  /** Admin-1 borders stay readable at world zoom (unmatched were nearly invisible). */
  const admin1LinePaint = useMemo(
    () => ({
      "line-color": [
        "case",
        ["==", ["get", "matched"], 1],
        "rgba(255,255,255,0.42)",
        isDark ? "rgba(255,255,255,0.22)" : "rgba(0,0,0,0.28)",
      ],
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        1.8,
        [
          "case",
          ["==", ["get", "matched"], 1],
          0.85,
          0.45,
        ],
        5,
        [
          "case",
          ["==", ["get", "matched"], 1],
          1.2,
          0.85,
        ],
      ],
    }),
    [isDark],
  )

  const countyLinePaint = useMemo(
    () => ({
      "line-color": [
        "case",
        ["==", ["get", "matched"], 1],
        "rgba(255,255,255,0.42)",
        isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.08)",
      ],
      "line-width": ["case", ["==", ["get", "matched"], 1], 1.15, 0.35],
    }),
    [isDark],
  )

  const selectionFilter = useMemo(() => {
    if (!popup) return null
    return [
      "all",
      ["==", ["to-string", ["get", "id"]], popup.props.id],
      ["==", ["get", "regionKind"], popup.props.regionKind],
    ] as const
  }, [popup])

  const selectionOutlinePaint = useMemo(
    () => ({
      "line-color": isDark ? "#ffffff" : "#0a0a0a",
      "line-width": [
        "interpolate",
        ["linear"],
        ["zoom"],
        1.5,
        3.5,
        4,
        6,
        8,
        9,
        14,
        12,
      ],
      "line-opacity": 1,
    }),
    [isDark],
  )

  const handleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const countyHit = e.features?.find((x) => x.layer.id === "us-counties-fill")
      const admin1Hit = e.features?.find((x) => x.layer.id === "admin1-fill")
      const f = countyHit ?? admin1Hit
      if (f?.properties) {
        onRegionPick({
          props: parseProps(f.properties as Record<string, unknown>),
          lng: e.lngLat.lng,
          lat: e.lngLat.lat,
        })
        return
      }
      onRegionPick(null)
    },
    [onRegionPick],
  )

  return (
    <Map
      initialViewState={WORLD_VIEW}
      mapStyle={mapStyle}
      style={{ width: "100%", height: "100%" }}
      interactiveLayerIds={["us-counties-fill", "admin1-fill"]}
      cursor="grab"
      onClick={handleClick}
    >
      <Source id="regions" type="geojson" data={data}>
        <Layer
          id="admin1-fill"
          type="fill"
          filter={ADMIN1_FILL_FILTER as never}
          paint={fillPaint as Record<string, unknown>}
        />
        <Layer
          id="admin1-line"
          type="line"
          filter={ADMIN1_FILL_FILTER as never}
          paint={admin1LinePaint as Record<string, unknown>}
        />
        <Layer
          id="us-counties-fill"
          type="fill"
          filter={US_COUNTY_FILL_FILTER as never}
          paint={fillPaint as Record<string, unknown>}
        />
        <Layer
          id="us-counties-line"
          type="line"
          filter={US_COUNTY_FILL_FILTER as never}
          paint={countyLinePaint as Record<string, unknown>}
        />
        {selectionFilter ? (
          <Layer
            id="selection-highlight-outline"
            type="line"
            filter={selectionFilter as never}
            paint={selectionOutlinePaint as Record<string, unknown>}
          />
        ) : null}
      </Source>
      {popup && mapPopup ? (
        <Popup
          longitude={popup.lng}
          latitude={popup.lat}
          anchor="bottom"
          offset={14}
          onClose={() => onRegionPick(null)}
          closeButton
          closeOnClick={false}
          maxWidth="min(100vw - 1.5rem, 22rem)"
          className="max-sm:[&_.maplibregl-popup-close-button]:size-9 max-sm:[&_.maplibregl-popup-close-button]:text-lg [&_.maplibregl-popup-content]:max-h-[min(70dvh,32rem)] [&_.maplibregl-popup-content]:overflow-y-auto [&_.maplibregl-popup-content]:p-3 sm:[&_.maplibregl-popup-content]:max-h-none sm:[&_.maplibregl-popup-content]:overflow-visible"
        >
          <RegionPopupContent props={popup.props} />
        </Popup>
      ) : null}
    </Map>
  )
}

/** @deprecated */
export type CountyPick = RegionPick
