"use client"

import { useSyncExternalStore } from "react"

const QUERY = "(max-width: 639px)"

function subscribe(onChange: () => void) {
  const mq = window.matchMedia(QUERY)
  mq.addEventListener("change", onChange)
  return () => mq.removeEventListener("change", onChange)
}

function getSnapshot() {
  return window.matchMedia(QUERY).matches
}

function getServerSnapshot() {
  return false
}

/** True below Tailwind `sm` (640px) — mobile sheet vs desktop map popup. */
export function useIsNarrowScreen() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
