import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode, type CSSProperties } from "react"
import { geoMercator, geoPath, type GeoProjection } from "d3-geo"
import { zoom as d3zoom, zoomIdentity, type ZoomBehavior, type ZoomTransform } from "d3-zoom"
import { select } from "d3-selection"
import "d3-transition" // side-effect: adds selection.transition()
import { feature, mesh } from "topojson-client"
import type { Topology, GeometryCollection } from "topojson-specification"
import { Home, Plus, Minus } from "lucide-react"

/* Custom offline world map. Natural Earth 1:50m country shapes (public domain, bundled
   in /public) drawn once into an SVG with a Mercator projection sized to fill the box —
   no tiles, no wrapping, no network. Pan/zoom is clamped to the land so you can never
   drag off the edge of the world. Pins are rendered by the caller as React nodes: we
   hand back a `project` function and re-render on every pan/zoom so they track the map. */

export interface GeoPoint { lat: number; lng: number }

const WORLD_URL = `${import.meta.env.BASE_URL}world-countries-50m.json`
const OCEAN = "#b8d5e6"
const LAND = "#f7f4ef"
const BORDER = "#c6ccd4"
const ANTARCTICA = "010"
/** latitude range the base view covers (drops the empty polar regions) */
const LAT_MAX = 78, LAT_MIN = -56
const PAD = 56            // px kept clear around fitted pins (room for pills + tooltips)
const MAX_K = 28          // max zoom factor over the world-filling base view
const SINGLE_K = 10       // zoom used when there is exactly one point

interface World { land: GeoJSON.FeatureCollection; borders: GeoJSON.MultiLineString }
let worldPromise: Promise<World> | null = null
const loadWorld = () => {
  worldPromise ??= fetch(WORLD_URL).then((r) => r.json()).then((topo: Topology) => {
    const countries = topo.objects.countries as GeometryCollection
    const geoms = { ...countries, geometries: countries.geometries.filter((g) => String(g.id) !== ANTARCTICA) }
    return {
      land: feature(topo, geoms) as GeoJSON.FeatureCollection,
      borders: mesh(topo, geoms, (a, b) => a !== b),
    }
  })
  return worldPromise
}

/** Base projection: the world (LAT_MIN..LAT_MAX) spans the full width; vertically centred. */
function baseProjection(w: number, h: number): GeoProjection {
  const p = geoMercator().scale(w / (2 * Math.PI)).translate([w / 2, 0]).center([0, 0])
  const yTop = p([0, LAT_MAX])![1], yBot = p([0, LAT_MIN])![1]
  const y = h / 2 - (yTop + yBot) / 2
  return p.translate([w / 2, y])
}

export function GeoMap({
  points, fitKey, className, style, children,
}: {
  /** points the "home" view fits to */
  points: GeoPoint[]
  /** change this to re-fit (e.g. when switching world ↔ country) */
  fitKey: string
  className?: string
  style?: CSSProperties
  children: (project: (p: GeoPoint) => { x: number; y: number }) => ReactNode
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const zoomRef = useRef<ZoomBehavior<SVGSVGElement, unknown> | null>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })
  const [world, setWorld] = useState<World | null>(null)
  const [t, setT] = useState<ZoomTransform>(zoomIdentity)

  useEffect(() => { let on = true; loadWorld().then((w) => { if (on) setWorld(w) }); return () => { on = false } }, [])

  // track container size
  useLayoutEffect(() => {
    const el = hostRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  const { w, h } = size
  const proj = useMemo(() => (w && h ? baseProjection(w, h) : null), [w, h])
  const paths = useMemo(() => {
    if (!proj || !world) return null
    const path = geoPath(proj)
    return { land: path(world.land) ?? "", borders: path(world.borders) ?? "" }
  }, [proj, world])

  // zoom behaviour, clamped to the drawn world
  useEffect(() => {
    if (!proj || !svgRef.current) return
    const yTop = proj([0, LAT_MAX])![1], yBot = proj([0, LAT_MIN])![1]
    const z = d3zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, MAX_K])
      .translateExtent([[0, yTop], [w, yBot]])
      .extent([[0, 0], [w, h]])
      .filter((ev: Event) => !(ev as WheelEvent).type.startsWith("wheel") && !(ev as MouseEvent).button)
      .on("zoom", (ev) => setT(ev.transform))
    const sel = select(svgRef.current)
    sel.call(z)
    zoomRef.current = z
    return () => { sel.on(".zoom", null) }
  }, [proj, w, h])

  // transform that fits the current points
  const fitTransform = () => {
    if (!proj || points.length === 0) return zoomIdentity
    const pts = points.map((p) => proj([p.lng, p.lat]) as [number, number])
    if (pts.length === 1) {
      const [x, y] = pts[0]
      return zoomIdentity.translate(w / 2 - SINGLE_K * x, h / 2 - SINGLE_K * y).scale(SINGLE_K)
    }
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1])
    const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys)
    const k = Math.min(MAX_K, (w - 2 * PAD) / Math.max(x1 - x0, 1), (h - 2 * PAD) / Math.max(y1 - y0, 1))
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2
    return zoomIdentity.translate(w / 2 - k * cx, h / 2 - k * cy).scale(k)
  }
  const home = (animate = true) => {
    if (!zoomRef.current || !svgRef.current) return
    const sel = select(svgRef.current)
    if (animate) zoomRef.current.transform(sel.transition().duration(350), fitTransform())
    else zoomRef.current.transform(sel, fitTransform())
  }
  const zoomBy = (f: number) => {
    if (!zoomRef.current || !svgRef.current) return
    zoomRef.current.scaleBy(select(svgRef.current).transition().duration(200), f)
  }
  // re-fit when scope or size changes
  useEffect(() => { home(false) /* eslint-disable-line react-hooks/exhaustive-deps */ }, [fitKey, proj])

  const project = (p: GeoPoint) => {
    if (!proj) return { x: -9999, y: -9999 }
    const [x, y] = t.apply(proj([p.lng, p.lat]) as [number, number])
    return { x, y }
  }

  const ctl = "flex size-8 items-center justify-center transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
  const card = { background: "var(--bg-card)", border: "1px solid var(--border-neutral-subtle)", boxShadow: "var(--shadow-sm)", color: "var(--fg-neutral-emphasis)" }
  return (
    <div ref={hostRef} className={`geo-map relative overflow-hidden ${className ?? ""}`} style={{ background: OCEAN, ...style }}>
      <svg ref={svgRef} width={w} height={h} className="absolute inset-0" aria-hidden>
        {paths && (
          <g transform={t.toString()}>
            <path d={paths.land} fill={LAND} stroke={BORDER} strokeWidth={0.6} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
            <path d={paths.borders} fill="none" stroke={BORDER} strokeWidth={0.8} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </g>
        )}
      </svg>
      {/* pin overlay: ignores pointer events so the map still drags; pins opt back in */}
      <div className="pointer-events-none absolute inset-0">
        {proj && children(project)}
      </div>
      <div className="absolute right-3 top-3 flex flex-col gap-2">
        <button type="button" onClick={() => home()} aria-label="Reset view" className={`${ctl} rounded-md`} style={card}><Home className="size-4" /></button>
        <div className="flex flex-col overflow-hidden rounded-md" style={card}>
          <button type="button" onClick={() => zoomBy(2)} aria-label="Zoom in" className={ctl}><Plus className="size-4" /></button>
          <button type="button" onClick={() => zoomBy(0.5)} aria-label="Zoom out" className={ctl} style={{ borderTop: "1px solid var(--border-neutral-subtle)" }}><Minus className="size-4" /></button>
        </div>
      </div>
      <span className="pointer-events-none absolute bottom-1 right-2 text-[10px]" style={{ color: "var(--fg-neutral-subtle)" }}>Natural Earth</span>
    </div>
  )
}
