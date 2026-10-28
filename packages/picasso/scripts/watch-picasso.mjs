#!/usr/bin/env node
/**
 * watch-picasso — keep @ir/ui in step with your local Picasso while you work.
 *
 * Runs sync-picasso.mjs once, then again whenever Picasso's component source or
 * token CSS changes. Vite in each app picks up the copied files and hot-reloads.
 * Started for you by `npm run dev` (it's this package's `dev` script).
 *
 * Token JSON edits need Picasso's own token build first (it writes
 * packages/tokens/dist/tokens.css); this watches that output.
 *
 * No Picasso folder next to this repo (a teammate, CI)? It says so and does
 * nothing: the committed copy in packages/picasso is used as-is.
 */
import { spawn } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
const root = path.resolve(here, "../../..")
const picasso = path.resolve(
  process.env.PICASSO_DIR ??
    [path.join(root, "../picasso"), path.join(root, "../../picasso")].find((p) => fs.existsSync(path.join(p, "packages/ui/src/index.ts"))) ??
    path.join(root, "../picasso"),
)

if (!fs.existsSync(path.join(picasso, "packages/ui/src/index.ts"))) {
  console.log(`[picasso] No Picasso repo found next to this one (looked in ${picasso}). Using the committed copy.`)
  process.exit(0)
}

let running = false
let again = false
function sync(reason) {
  if (running) { again = true; return }
  running = true
  const t = Date.now()
  const child = spawn(process.execPath, [path.join(here, "sync-picasso.mjs")], { stdio: ["ignore", "pipe", "inherit"], env: { ...process.env, PICASSO_DIR: picasso } })
  let outText = ""
  child.stdout.on("data", (d) => { outText += d })
  child.on("exit", (code) => {
    running = false
    const changed = outText.match(/\((\d+) changed, (\d+) removed\)/)
    if (code !== 0) console.log(`[picasso] sync failed (${reason}) — fix it in Picasso and save again.`)
    else if (!changed || changed[1] !== "0" || changed[2] !== "0" || reason === "start") {
      console.log(`[picasso] synced (${reason}) in ${Date.now() - t} ms — ${changed ? `${changed[1]} changed, ${changed[2]} removed` : "done"}`)
    }
    if (again) { again = false; sync("more changes") }
  })
}

let timer = null
const queue = (reason) => { clearTimeout(timer); timer = setTimeout(() => sync(reason), 250) }

sync("start")
const targets = [
  path.join(picasso, "packages/ui/src"),
  path.join(picasso, "packages/tokens"),
]
for (const dir of targets) {
  if (!fs.existsSync(dir)) continue
  fs.watch(dir, { recursive: true }, (_event, file) => {
    if (!file) return
    const f = String(file)
    if (/node_modules|\.DS_Store|\.(stories|test)\./.test(f)) return
    if (dir.endsWith("tokens") && !/(dist\/tokens\.css|themes\.css|theme\.css)$/.test(f)) return
    queue(path.relative(picasso, path.join(dir, f)))
  })
}
console.log(`[picasso] watching ${picasso} — edits there show up in the prototypes.`)
