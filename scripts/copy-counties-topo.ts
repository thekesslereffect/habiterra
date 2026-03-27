import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const src = path.join(__dirname, "..", "node_modules", "us-atlas", "counties-10m.json")
const dest = path.join(__dirname, "..", "public", "data", "counties-10m.json")
fs.mkdirSync(path.dirname(dest), { recursive: true })
fs.copyFileSync(src, dest)
console.log("Copied counties TopoJSON → public/data/counties-10m.json")
