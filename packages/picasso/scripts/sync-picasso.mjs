#!/usr/bin/env node
/**
 * sync-picasso — vendor Picasso (@ir/ui + @ir/tokens) into the prototype.
 *
 *   npm run sync:picasso                      # (from the monorepo root) reads ../picasso
 *   PICASSO_DIR=/path/to/picasso npm run sync:picasso
 *
 * Why a copy: Picasso isn't published yet and this prototype deploys to
 * Vercel, which can't see a sibling folder. Code imports from "@ir/ui" exactly
 * as a product would, so switching to the real package later is one alias.
 *
 * Why the CSS is rewritten: Picasso is only switched on for the Administration
 * experience (AdminApp sets <html data-picasso>). Its tokens, theme axes, base
 * styles and typography utilities are scoped to `:root[data-picasso]`, and every
 * Tailwind theme key Picasso changes (text sizes, radii, shadows…) is routed
 * through a variable that holds Tailwind's default everywhere else. The Fleet
 * dashboard therefore renders exactly as it did.
 *
 * Output (all generated — never edit by hand, re-run this script):
 *   packages/picasso/ui/**        @ir/ui source, minus stories and tests
 *   packages/picasso/picasso.css  scoped tokens + themes + Tailwind bridge
 *   packages/picasso/VERSION.json which Picasso commit this came from
 */
import { execSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"
import { fileURLToPath } from "node:url"

const here = path.dirname(fileURLToPath(import.meta.url))
// packages/picasso/scripts → the monorepo root (for node_modules/tailwindcss).
const root = path.resolve(here, "../../..")
// The Picasso repo sits next to this one (IR Design/Projects/picasso). Works
// wherever this monorepo lives: beside it, or one folder deeper.
const picasso = path.resolve(
  process.env.PICASSO_DIR ??
    [path.join(root, "../picasso"), path.join(root, "../../picasso")].find((p) => fs.existsSync(path.join(p, "packages/ui/src/index.ts"))) ??
    path.join(root, "../picasso"),
)
// Output lands in this package (@ir/ui), which every app imports.
const out = path.resolve(here, "..")
const SCOPE = ":root[data-picasso]"

if (!fs.existsSync(path.join(picasso, "packages/ui/src/index.ts"))) {
  console.error(`Picasso not found at ${picasso}. Set PICASSO_DIR.`)
  process.exit(1)
}

// ---- 1. Component source -------------------------------------------------------

const uiSrc = path.join(picasso, "packages/ui/src")
const uiOut = path.join(out, "ui")
try { fs.rmSync(uiOut, { recursive: true, force: true }) } catch { /* overwrite in place below */ }

const skip = (rel) =>
  /(^|\/)(stories|__tests__)(\/|$)/.test(rel) ||
  /\.(stories|test)\.[jt]sx?$/.test(rel) ||
  /\.mdx$/.test(rel) ||
  /guidance\.json$/.test(rel) ||
  /(^|\/)\.DS_Store$/.test(rel)

let fileCount = 0
function copyDir(from, rel = "") {
  for (const entry of fs.readdirSync(path.join(from, rel), { withFileTypes: true })) {
    const r = path.join(rel, entry.name)
    if (skip(r)) continue
    if (entry.isDirectory()) { copyDir(from, r); continue }
    const dest = path.join(uiOut, r)
    fs.mkdirSync(path.dirname(dest), { recursive: true })
    if (/\.(tsx?|jsx?)$/.test(entry.name)) {
      // Picasso's "@/lib/utils" alias would hit the prototype's own src/lib.
      const toUtils = path.relative(path.dirname(dest), path.join(uiOut, "lib/utils")).replace(/\\/g, "/")
      const src = fs.readFileSync(path.join(from, r), "utf8")
        .replace(/from "@\/lib\/utils"/g, `from "${toUtils.startsWith(".") ? toUtils : "./" + toUtils}"`)
      // Picasso is type-checked in its own repo, under its own tsconfig. Don't
      // re-check its source under the prototype's (different) strictness flags.
      // Its exported types still flow into the prototype unchanged.
      fs.writeFileSync(dest, `// @ts-nocheck — vendored from Picasso by scripts/sync-picasso.mjs; checked in the Picasso repo.\n${src}`)
    } else {
      fs.copyFileSync(path.join(from, r), dest)
    }
    fileCount++
  }
}
copyDir(uiSrc)

// ---- 2. CSS --------------------------------------------------------------------
// A small brace-aware parser: enough for the token files, which are plain CSS
// plus Tailwind at-rules.

function parse(css) {
  let i = 0
  function block() {
    const nodes = []
    let buf = ""
    while (i < css.length) {
      const c = css[i]
      if (c === "/" && css[i + 1] === "*") {
        const end = css.indexOf("*/", i + 2)
        const j = end === -1 ? css.length : end + 2
        if (buf.trim() === "") nodes.push({ type: "comment", text: css.slice(i, j) })
        else buf += css.slice(i, j)
        i = j
        continue
      }
      if (c === '"' || c === "'") {
        const j = css.indexOf(c, i + 1)
        buf += css.slice(i, j + 1); i = j + 1; continue
      }
      if (c === "{") {
        i++
        const prelude = buf.trim(); buf = ""
        nodes.push({ type: "block", prelude, children: block() })
        continue
      }
      if (c === "}") { i++; if (buf.trim()) nodes.push({ type: "decl", text: buf.trim() }); return nodes }
      if (c === ";") { i++; if (buf.trim()) nodes.push({ type: "decl", text: buf.trim() }); buf = ""; continue }
      buf += c; i++
    }
    if (buf.trim()) nodes.push({ type: "decl", text: buf.trim() })
    return nodes
  }
  return block()
}

function print(nodes, depth = 0) {
  const pad = "  ".repeat(depth)
  return nodes.map((n) => {
    if (n.type === "comment") return pad + n.text
    if (n.type === "decl") return `${pad}${n.text};`
    return `${pad}${n.prelude} {\n${print(n.children, depth + 1)}\n${pad}}`
  }).join("\n")
}

const splitSelectors = (s) => {
  const out = []; let depth = 0; let cur = ""
  for (const ch of s) {
    if (ch === "(" || ch === "[") depth++
    if (ch === ")" || ch === "]") depth--
    if (ch === "," && depth === 0) { out.push(cur.trim()); cur = ""; continue }
    cur += ch
  }
  if (cur.trim()) out.push(cur.trim())
  return out
}

/** Token/theme files: attach every selector to the root, keeping specificity order. */
function scopeRoot(sel) {
  return splitSelectors(sel).flatMap((s) => {
    if (s === ":root" || s === "html") return [SCOPE]
    if (s === ".dark") return [`${SCOPE}.dark`]
    if (s.startsWith(":root")) return [SCOPE + s.slice(5)]
    if (s.startsWith(".dark")) return [`${SCOPE}.dark${s.slice(5)}`]
    if (s.startsWith("[") || s.startsWith(":lang") || s.startsWith(".")) {
      return [`${SCOPE}${s}`, `${SCOPE} ${s}`]
    }
    return [`${SCOPE} ${s}`]
  }).join(",\n")
}

/** Base styles: the root itself, or anything inside it — at no extra specificity. */
function scopeBase(sel) {
  return splitSelectors(sel).flatMap((s) => {
    if (s === ":root" || s === "html") return [SCOPE]
    if (s === "body") return [`${SCOPE} body`]
    if (s === "*") return [`:where(${SCOPE}) *`]
    if (s.startsWith(":root")) return [SCOPE + s.slice(5)]
    if (s.startsWith("[") || s.startsWith(":lang")) return [`${SCOPE}${s}`, `:where(${SCOPE}) ${s}`]
    return [`:where(${SCOPE}) ${s}`]
  }).join(",\n")
}

const OPAQUE = /^@(theme|keyframes|font-face|property|custom-variant)\b/

/** Walk a stylesheet, scoping style rules and utilities. */
function scopeSheet(nodes, scopeFn) {
  for (const n of nodes) {
    if (n.type !== "block") continue
    if (n.prelude.startsWith("@utility")) {
      // A utility exists everywhere; its styles only apply inside Picasso.
      n.children = [{ type: "block", prelude: `:where(${SCOPE}) &`, children: n.children }]
      continue
    }
    if (OPAQUE.test(n.prelude)) continue
    if (n.prelude.startsWith("@")) { scopeSheet(n.children, scopeFn); continue } // @media, @layer, @supports
    n.prelude = scopeFn(n.prelude)
  }
  return nodes
}

// Tailwind's own defaults, so keys Picasso changes keep them outside Picasso.
const twTheme = new Map()
{
  const twCss = fs.readFileSync(path.join(root, "node_modules/tailwindcss/theme.css"), "utf8")
  for (const m of twCss.matchAll(/^\s*(--[a-z0-9-]+(?:--[a-z-]+)?)\s*:\s*([^;]+);/gim)) twTheme.set(m[1], m[2].trim())
}
const KEEP_LITERAL = /^--(breakpoint|container)-/ // used in media/container queries, where var() can't go
const globalDefaults = []
const scopedValues = []

function bridgeTheme(nodes) {
  for (const n of nodes) {
    if (n.type !== "block") continue
    if (n.prelude.startsWith("@custom-variant")) { n.drop = true; continue } // the prototype declares the same dark variant
    if (!n.prelude.startsWith("@theme")) {
      if (n.prelude.startsWith("@layer base")) scopeSheet(n.children, scopeBase)
      else if (n.prelude.startsWith("@utility")) scopeSheet([n], scopeBase)
      else if (!OPAQUE.test(n.prelude) && !n.prelude.startsWith("@")) n.prelude = scopeBase(n.prelude)
      continue
    }
    n.children = n.children.filter((d) => !(d.type === "decl" && /^--[a-z-]+-\*\s*:\s*initial$/.test(d.text)))
    for (const d of n.children) {
      if (d.type !== "decl") continue
      const m = d.text.match(/^(--[a-z0-9\\.-]+(?:--[a-z-]+)?)\s*:\s*([\s\S]+)$/i)
      if (!m) continue
      const [, key, value] = m
      // Named spacing steps take precedence over Tailwind's multiplier, so give
      // each one Tailwind's own result as a fallback for screens outside Picasso.
      const step = key.match(/^--spacing-(\d+(?:\\\.\d+)?)$/)
      if (step && !twTheme.has(key)) {
        const n = step[1].replace("\\.", ".")
        d.text = `${key}: ${value.replace(/var\((--space-[a-z0-9_-]+)\)/i, `var($1, calc(0.25rem * ${n}))`)}`
        continue
      }
      if (KEEP_LITERAL.test(key) || !twTheme.has(key)) continue
      const proxy = `--pk${key}`
      d.text = `${key}: var(${proxy})`
      globalDefaults.push(`  ${proxy}: ${twTheme.get(key)};`)
      scopedValues.push(`  ${proxy}: ${value.trim()};`)
    }
  }
  return nodes.filter((n) => !n.drop)
}

const tokensDir = path.join(picasso, "packages/tokens")
const tokensCss = fs.readFileSync(path.join(tokensDir, "dist/tokens.css"), "utf8")
const themesCss = fs.readFileSync(path.join(tokensDir, "themes.css"), "utf8")
const themeCss = fs.readFileSync(path.join(tokensDir, "theme.css"), "utf8")

const tokensOut = print(scopeSheet(parse(tokensCss), scopeRoot))
const themesOut = print(scopeSheet(parse(themesCss), scopeRoot))
const bridgeOut = print(bridgeTheme(parse(themeCss)))

const css = `/* GENERATED by scripts/sync-picasso.mjs — do not edit. Re-run \`npm run sync:picasso\`.
   Picasso's tokens, theme axes and Tailwind bridge, scoped to ${SCOPE}
   (the Administration experience). Outside it, Tailwind's defaults stand. */

/* ── Tailwind keys Picasso redefines: Tailwind's value by default … */
:root {
${globalDefaults.join("\n")}
}

/* ── @ir/tokens — tokens.css (scoped) */
${tokensOut}

/* ── @ir/tokens — themes.css (scoped) */
${themesOut}

/* ── … and Picasso's value inside the Administration experience. */
${SCOPE} {
${scopedValues.join("\n")}
}

/* ── @ir/tokens — theme.css (Tailwind bridge, scoped) */
${bridgeOut}
`
fs.mkdirSync(out, { recursive: true })
fs.writeFileSync(path.join(out, "picasso.css"), css)

// ---- 3. Provenance -------------------------------------------------------------

const git = (cmd) => { try { return execSync(`git -C "${picasso}" ${cmd}`, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim() } catch { return null } }
const version = {
  source: "picasso",
  package: JSON.parse(fs.readFileSync(path.join(picasso, "packages/ui/package.json"), "utf8")).version,
  commit: git("rev-parse --short HEAD"),
  uncommittedChanges: !!git("status --porcelain packages"),
  syncedAt: new Date().toISOString(),
}
fs.writeFileSync(path.join(out, "VERSION.json"), JSON.stringify(version, null, 2) + "\n")

console.log(`Picasso ${version.package} (${version.commit ?? "unknown"}${version.uncommittedChanges ? ", with uncommitted changes" : ""})`)
console.log(`  ${fileCount} component files → vendor/picasso/ui`)
console.log(`  ${globalDefaults.length} Tailwind keys scoped → vendor/picasso/picasso.css`)
