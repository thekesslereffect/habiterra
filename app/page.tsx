"use client"

import { useState } from "react"
import { useTheme } from "next-themes"

import { ClimateMap } from "@/components/climate-map"
import { FilterPanel } from "@/components/filter-panel"
import { RegionBottomSheet } from "@/components/region-bottom-sheet"
import { useIsNarrowScreen } from "@/hooks/use-is-narrow-screen"
import type { RegionPick } from "@/lib/types"
import { DEFAULT_FILTERS } from "@/lib/constants"
import type { FilterState } from "@/lib/types"
import { useMapData } from "@/hooks/use-map-data"

export default function HomePage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [popup, setPopup] = useState<RegionPick | null>(null)

  const { collection, matchCount, loading, error } = useMapData(filters)
  const narrowScreen = useIsNarrowScreen()

  return (
    <main className="relative h-dvh min-h-dvh w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        {collection.features.length > 0 ? (
          <ClimateMap
            data={collection}
            isDark={isDark}
            popup={popup}
            mapPopup={!narrowScreen}
            onRegionPick={setPopup}
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex h-full items-center justify-center text-sm">
            {loading ? "Loading map data…" : error ?? "No map data"}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 sm:inset-x-auto sm:left-4 sm:right-auto sm:top-4 sm:w-auto">
        <div className="filter-map-overlay-pad pointer-events-auto mx-auto w-full max-w-full sm:mx-0 sm:max-w-[min(100vw-2rem,22rem)]">
          <FilterPanel
            filters={filters}
            onFiltersChange={setFilters}
            matchCount={matchCount}
            loading={loading}
            error={error}
          />
        </div>
      </div>

      <RegionBottomSheet pick={narrowScreen ? popup : null} onClose={() => setPopup(null)} />
    </main>
  )
}
