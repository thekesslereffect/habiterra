"use client"

import { useState } from "react"
import { useTheme } from "next-themes"

import { ClimateMap, type RegionPick } from "@/components/climate-map"
import { FilterPanel } from "@/components/filter-panel"
import { DEFAULT_FILTERS } from "@/lib/constants"
import type { FilterState } from "@/lib/types"
import { useMapData } from "@/hooks/use-map-data"

export default function HomePage() {
  const { resolvedTheme } = useTheme()
  const isDark = resolvedTheme === "dark"

  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS)
  const [popup, setPopup] = useState<RegionPick | null>(null)

  const { collection, matchCount, loading, error } = useMapData(filters)

  return (
    <main className="relative h-dvh w-full overflow-hidden">
      <div className="absolute inset-0 z-0">
        {collection.features.length > 0 ? (
          <ClimateMap
            data={collection}
            isDark={isDark}
            popup={popup}
            onRegionPick={setPopup}
          />
        ) : (
          <div className="bg-muted text-muted-foreground flex h-full items-center justify-center text-sm">
            {loading ? "Loading map data…" : error ?? "No map data"}
          </div>
        )}
      </div>

      <div className="pointer-events-none absolute top-3 left-3 z-10 max-w-[calc(100vw-1.5rem)] sm:top-4 sm:left-4">
        <FilterPanel
          filters={filters}
          onFiltersChange={setFilters}
          matchCount={matchCount}
          loading={loading}
          error={error}
        />
      </div>
    </main>
  )
}
