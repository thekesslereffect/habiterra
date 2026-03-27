"use client"

import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { PriceFilter } from "@/components/price-filter"
import { TemperatureFilter } from "@/components/temperature-filter"
import {
  PRICE_COLOR_HIGH,
  PRICE_COLOR_LOW,
} from "@/lib/constants"
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

  return (
    <Card className="border-border/60 bg-card/75 supports-[backdrop-filter]:bg-card/65 pointer-events-auto w-[min(100%,22rem)] shadow-lg backdrop-blur-md">
      <CardHeader className="space-y-1 pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold tracking-tight">
              Habiterra
            </CardTitle>
            <p className="text-muted-foreground text-xs">
              Global climate × regional listing portals
            </p>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="outline"
                size="icon-sm"
                className="shrink-0"
                onClick={() =>
                  setTheme(resolvedTheme === "dark" ? "light" : "dark")
                }
                aria-label="Toggle theme"
              >
                <Sun className="dark:hidden size-4" />
                <Moon className="hidden size-4 dark:inline" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Toggle light / dark map</TooltipContent>
          </Tooltip>
        </div>
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <Badge variant="outline" className="font-mono text-xs">
            {loading ? "Loading…" : `${matchCount.toLocaleString()} regions`}
          </Badge>
          {error ? (
            <Badge variant="destructive" className="max-w-full text-xs">
              {error}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-0">
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
        <div className="space-y-1.5">
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
