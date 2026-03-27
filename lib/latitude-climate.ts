/**
 * Coarse latitude-only climate placeholders in **Fahrenheit** when real normals
 * (e.g. NOAA, Open-Meteo) are not available.
 *
 * - **tmin**: cool-season typical night low (very rough).
 * - **tmax**: warm-season typical afternoon high — must not read like an annual
 *   average (the old `tmin + 24` curve topped out ~60°F at mid-latitudes).
 */
export function climateFromLat(lat: number): { tmin: number; tmax: number } {
  const a = Math.abs(lat)
  const tmin = Math.round(Math.max(-55, Math.min(78, 70 - a * 1.08)))
  let tmax = Math.round(92 - a * 0.36)
  tmax = Math.min(118, Math.max(tmax, tmin + 20))
  return { tmin, tmax }
}
