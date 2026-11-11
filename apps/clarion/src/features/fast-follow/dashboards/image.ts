// Export a dashboard as an image (PNG): what's on screen under the filter bar,
// with what it covers (period, scope, filters) and when it was exported in a
// footer, as in the PO's Reporting prototype. No library: the page is copied
// with its computed styles into an SVG foreignObject and drawn onto a canvas.

/** Copy every computed style onto the clone, so it looks the same outside the page's CSS. */
function inlineStyles(src: Element, dst: Element) {
  const cs = getComputedStyle(src)
  let css = ""
  for (let i = 0; i < cs.length; i++) { const p = cs[i]; css += `${p}:${cs.getPropertyValue(p)};` }
  dst.setAttribute("style", css)
  for (let i = 0; i < src.children.length; i++) inlineStyles(src.children[i], dst.children[i])
}

export async function downloadImage(root: HTMLElement, name: string, about: string[]) {
  const clone = root.cloneNode(true) as HTMLElement
  inlineStyles(root, clone)
  clone.querySelectorAll("[data-export-skip]").forEach((n) => n.remove())
  // its height was measured with the filter bar in; let it shrink to what's left
  clone.style.height = "auto"
  clone.style.minHeight = "0"

  const bg = getComputedStyle(document.body).backgroundColor || "#ffffff"
  const fg = getComputedStyle(root).color
  const wrap = document.createElement("div")
  wrap.setAttribute("xmlns", "http://www.w3.org/1999/xhtml")
  wrap.setAttribute("style", `width:${root.offsetWidth}px;padding:24px;box-sizing:content-box;background:${bg};display:flex;flex-direction:column;gap:16px;font-family:${getComputedStyle(root).fontFamily}`)
  wrap.appendChild(clone)
  const foot = document.createElement("div")
  foot.setAttribute("style", `font-size:12px;line-height:1.5;color:${fg};opacity:.7`)
  foot.textContent = [...about, `Exported ${new Date().toLocaleString("en-AU")}`, "Fast Follow preview - illustrative data, not the shipped product"].join(" · ")
  wrap.appendChild(foot)

  // measure off screen
  const holder = document.createElement("div")
  holder.setAttribute("style", "position:fixed;left:-100000px;top:0")
  holder.appendChild(wrap)
  document.body.appendChild(holder)
  const w = wrap.offsetWidth, h = wrap.offsetHeight
  holder.remove()

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><foreignObject width="100%" height="100%">${new XMLSerializer().serializeToString(wrap)}</foreignObject></svg>`
  const img = new Image()
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await img.decode()
  const scale = 2
  const canvas = document.createElement("canvas")
  canvas.width = w * scale; canvas.height = h * scale
  const ctx = canvas.getContext("2d")!
  ctx.scale(scale, scale)
  ctx.fillStyle = bg; ctx.fillRect(0, 0, w, h)
  ctx.drawImage(img, 0, 0)
  const blob = await new Promise<Blob | null>((r) => canvas.toBlob(r, "image/png"))
  if (!blob) throw new Error("image export failed")
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `Clarion_${name.replace(/[^\w-]+/g, "-")}.png`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
