"use client"

import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { TEMP_SLIDER_DOMAIN } from "@/lib/constants"

type TemperatureFilterProps = {
  tempMin: number
  tempMax: number
  onChange: (next: { tempMin: number; tempMax: number }) => void
}

export function TemperatureFilter({
  tempMin,
  tempMax,
  onChange,
}: TemperatureFilterProps) {
  return (
    <div className="space-y-3 sm:space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-medium">Comfort range (°F)</span>
        <div className="flex flex-wrap items-stretch gap-1.5 sm:items-center sm:justify-end">
          <Badge variant="secondary" className="font-mono text-xs tabular-nums">
            low ≥ {Math.round(tempMin)}°F
          </Badge>
          <Badge variant="secondary" className="font-mono text-xs tabular-nums">
            high ≤ {Math.round(tempMax)}°F
          </Badge>
        </div>
      </div>
      <Slider
        min={TEMP_SLIDER_DOMAIN[0]}
        max={TEMP_SLIDER_DOMAIN[1]}
        step={1}
        value={[tempMin, tempMax]}
        onValueChange={(v) => {
          const [a, b] = v
          onChange({ tempMin: Math.min(a, b), tempMax: Math.max(a, b) })
        }}
        className="py-2 sm:py-1"
      />
      <p className="text-muted-foreground text-[0.65rem] leading-snug">
        Regions match when typical annual low ≥ your minimum and typical high
        ≤ your maximum. US counties use NOAA normals; other countries use
        Open-Meteo (2015–2024) at a representative point or a latitude
        fallback.
      </p>
    </div>
  )
}
