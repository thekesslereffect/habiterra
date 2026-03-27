/** Pre-download WorldClim BIO5/BIO6 GeoTIFFs into data/worldclim/ (optional). */
import { ensureWorldClimBioSampler } from "./worldclim-bio-rasters"

await ensureWorldClimBioSampler()
console.log("WorldClim BIO5/BIO6 ready in data/worldclim/")
