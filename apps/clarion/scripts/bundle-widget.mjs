#!/usr/bin/env node
// Copy the widget prototype's build into dist/widget, so Clarion serves it at
// /widget on the same origin and the two share a telemetry feed (@ir/telemetry).
// Turborepo builds the widget first (it's a devDependency of this app).
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const from = path.resolve(here, "../../clarion-widget/dist")
const to = path.resolve(here, "../dist/widget")

if (!fs.existsSync(path.join(from, "index.html"))) {
  console.error(`Widget build not found at ${from}. Build it first: npx turbo run build --filter=clarion (from the repo root).`)
  process.exit(1)
}
fs.rmSync(to, { recursive: true, force: true })
fs.cpSync(from, to, { recursive: true })
console.log(`Copied widget → dist/widget`)
