"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { X } from "lucide-react"

import { RegionPopupContent } from "@/components/region-popup"
import { Button } from "@/components/ui/button"
import type { RegionPick } from "@/lib/types"

/** Dismiss if pulled down at least this far (px). */
const DISMISS_PX = 100
/** Or fast flick: px per ms (≈0.35 → ~350 px/s). */
const FLICK_VELOCITY = 0.35

type RegionBottomSheetProps = {
  pick: RegionPick | null
  onClose: () => void
}

export function RegionBottomSheet({ pick, onClose }: RegionBottomSheetProps) {
  const [offsetY, setOffsetY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const startYRef = useRef(0)
  const startTRef = useRef(0)
  const offsetRef = useRef(0)
  const activeRef = useRef(false)

  useEffect(() => {
    if (!pick) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [pick, onClose])

  useEffect(() => {
    if (!pick) {
      setOffsetY(0)
      offsetRef.current = 0
      setDragging(false)
      activeRef.current = false
    }
  }, [pick])

  const finishDrag = useCallback(() => {
    activeRef.current = false
    setDragging(false)

    const d = offsetRef.current
    const dt = Math.max(12, performance.now() - startTRef.current)
    const velocity = d / dt
    const shouldClose =
      d >= DISMISS_PX || (d >= 56 && velocity >= FLICK_VELOCITY)

    if (shouldClose) {
      setOffsetY(0)
      offsetRef.current = 0
      onClose()
    } else {
      setOffsetY(0)
      offsetRef.current = 0
    }
  }, [onClose])

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    if (e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    activeRef.current = true
    setDragging(true)
    startYRef.current = e.clientY
    startTRef.current = performance.now()
    offsetRef.current = 0
    setOffsetY(0)
  }, [])

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!activeRef.current) return
    const dy = e.clientY - startYRef.current
    if (dy < 0) {
      offsetRef.current = 0
      setOffsetY(0)
      return
    }
    offsetRef.current = dy
    setOffsetY(dy)
  }, [])

  const onPointerUp = useCallback(
    (e: React.PointerEvent) => {
      if (!activeRef.current) return
      try {
        if (e.currentTarget.hasPointerCapture(e.pointerId)) {
          e.currentTarget.releasePointerCapture(e.pointerId)
        }
      } catch {
        /* */
      }
      finishDrag()
    },
    [finishDrag],
  )

  const onPointerCancel = useCallback(() => {
    activeRef.current = false
    setDragging(false)
    setOffsetY(0)
    offsetRef.current = 0
  }, [])

  if (!pick) return null

  const p = pick.props
  const adminLabel = p.regionKind === "us_county" && p.stateAbbr === "LA" ? "Parish" : "County"
  const headerTitle =
    p.regionKind === "us_county" ? `${p.name} ${adminLabel}` : p.name

  const backdropOpacity = Math.max(0.22, 0.5 - offsetY / 520)

  return (
    <div
      className="animate-in fade-in fixed inset-0 z-50 flex flex-col justify-end duration-200 sm:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="region-sheet-title"
    >
      <button
        type="button"
        className="animate-in fade-in absolute inset-0 duration-200"
        style={{ backgroundColor: `rgba(0,0,0,${backdropOpacity})` }}
        aria-label="Dismiss region details"
        onClick={onClose}
      />
      <div
        className="relative flex max-h-[min(72dvh,560px)] flex-col rounded-t-2xl border border-border/80 bg-card text-card-foreground shadow-2xl"
        style={{
          paddingBottom: "max(0.75rem, env(safe-area-inset-bottom, 0px))",
          transform: `translateY(${offsetY}px)`,
          transition: dragging
            ? "none"
            : "transform 0.22s cubic-bezier(0.32, 0.72, 0, 1)",
        }}
      >
        <div
          className="touch-none flex shrink-0 cursor-grab select-none flex-col active:cursor-grabbing"
          aria-label="Drag down to close"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
        >
          <div className="flex flex-col items-center py-2.5 pb-1">
            <div
              className="h-1.5 w-14 shrink-0 rounded-full bg-muted-foreground/45"
              aria-hidden
            />
            <span className="sr-only">Drag down to close this panel</span>
          </div>
          <div className="flex shrink-0 items-center justify-between gap-2 border-border/60 border-b px-2 pb-2 pl-3">
            <span id="region-sheet-title" className="truncate text-sm font-semibold">
              {headerTitle}
            </span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0 touch-manipulation"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                onClose()
              }}
              aria-label="Close region details"
            >
              <X className="size-5" />
            </Button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-3 pt-2 touch-pan-y">
          <RegionPopupContent props={pick.props} hideTitle />
        </div>
      </div>
    </div>
  )
}
