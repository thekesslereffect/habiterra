import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(__dirname, "..", "node_modules", "world-atlas", "countries-110m.json")
const dest = path.join(__dirname, "..", "public", "data", "countries-110m.json")
fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.copyFileSync(src, dest)
console.log("Copied world countries TopoJSON → public/data/countries-110m.json")
