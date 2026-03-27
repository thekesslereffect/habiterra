"use client"

import { useEffect, useState } from "react"
import { ChevronDown, Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { PriceFilter } from "@/components/price-filter"
import { TemperatureFilter } from "@/components/temperature-filter"
import { PRICE_COLOR_HIGH, PRICE_COLOR_LOW } from "@/lib/constants"
import { cn } from "@/lib/utils"
import type { FilterState } from "@/lib/types"

type FilterPanelProps = {
  filters: FilterState
  onFiltersChange: (next: FilterState) => void
  matchCount: number
  loading: boolean
  error: string | null
}

export function FilterPanel({
  filters,
  onFiltersChange,
  matchCount,
  loading,
  error,
}: FilterPanelProps) {
  const { resolvedTheme, setTheme } = useTheme()
  const [mobileOpen, setMobileOpen] = useState(true)

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 640px)")
    const sync = () => {
      if (mq.matches) setMobileOpen(true)
    }
    sync()
    mq.addEventListener("change", sync)
    return () => mq.removeEventListener("change", sync)
  }, [])

  return (
    <Card
      className={cn(
        "border-border/60 bg-card/80 supports-[backdrop-filter]:bg-card/70 pointer-events-auto relative z-10 w-full touch-manipulation shadow-lg backdrop-blur-md sm:max-w-[22rem]",
        "rounded-xl sm:rounded-lg",
      )}
    >
      <CardHeader className="space-y-1">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <CardTitle className="text-base font-semibold tracking-tight">
              Habiterra
            </CardTitle>
            <p className="text-muted-foreground text-xs leading-snug">
              Global climate × regional listing portals
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="touch-manipulation sm:hidden"
              aria-expanded={mobileOpen}
              aria-controls="filter-panel-body"
              aria-label={mobileOpen ? "Collapse filters" : "Expand filters"}
              onClick={() => setMobileOpen((o) => !o)}
            >
              <ChevronDown
                className={cn(
                  "size-5 transition-transform duration-200",
                  mobileOpen ? "rotate-180" : "",
                )}
              />
            </Button>
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="shrink-0 touch-manipulation"
              onClick={() =>
                setTheme(resolvedTheme === "dark" ? "light" : "dark")
              }
              aria-label="Toggle light or dark map theme"
            >
              <Sun className="dark:hidden size-4" />
              <Moon className="hidden size-4 dark:inline" />
            </Button>
          </div>
        </div>

      </CardHeader>
      <CardContent
        id="filter-panel-body"
        className={cn(
          "space-y-4 pt-0",
          "max-sm:max-h-[min(52dvh,calc(100dvh-env(safe-area-inset-top)-8.5rem))] max-sm:overflow-y-auto max-sm:overscroll-y-contain max-sm:pr-0.5",
          !mobileOpen && "max-sm:hidden",
        )}
      >
        <TemperatureFilter
          tempMin={filters.tempMin}
          tempMax={filters.tempMax}
          onChange={(t) => onFiltersChange({ ...filters, ...t })}
        />
        <Separator />
        <PriceFilter
          priceMin={filters.priceMin}
          priceMax={filters.priceMax}
          onChange={(p) => onFiltersChange({ ...filters, ...p })}
        />
        <Separator />
        <div className="space-y-1.5 pb-1">
          <p className="text-muted-foreground text-xs font-medium">
            Match color (median price)
          </p>
          <div
            className="h-2 w-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${PRICE_COLOR_LOW}, ${PRICE_COLOR_HIGH})`,
            }}
          />
          <div className="text-muted-foreground flex justify-between text-[0.65rem]">
            <span>Lower</span>
            <span>Higher</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
