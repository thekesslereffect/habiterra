"use client"

import { Badge } from "@/components/ui/badge"
import { Slider } from "@/components/ui/slider"
import { PRICE_SLIDER_DOMAIN, formatPrice } from "@/lib/constants"

type PriceFilterProps = {
  priceMin: number
  priceMax: number
  onChange: (next: { priceMin: number; priceMax: number }) => void
}

export function PriceFilter({
  priceMin,
  priceMax,
  onChange,
}: PriceFilterProps) {
  return (
    <div className="space-y-3 sm:space-y-2">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <span className="text-xs font-medium">Median list price</span>
        <div className="flex flex-wrap items-stretch gap-1.5 sm:items-center sm:justify-end">
          <Badge variant="secondary" className="font-mono text-xs tabular-nums">
            {formatPrice(priceMin)}
          </Badge>
          <Badge variant="secondary" className="font-mono text-xs tabular-nums">
            {formatPrice(priceMax)}
          </Badge>
        </div>
      </div>
      <Slider
        min={PRICE_SLIDER_DOMAIN[0]}
        max={PRICE_SLIDER_DOMAIN[1]}
        step={10_000}
        value={[priceMin, priceMax]}
        onValueChange={(v) => {
          const [a, b] = v
          onChange({ priceMin: Math.min(a, b), priceMax: Math.max(a, b) })
        }}
        className="py-2 sm:py-1"
      />
      <p className="text-muted-foreground text-[0.65rem] leading-snug">
        Median listing price applies to US counties only (Realtor.com research
        CSV). Other countries match on temperature only; color uses a mid tone
        when there is no price.
      </p>
    </div>
  )
}
