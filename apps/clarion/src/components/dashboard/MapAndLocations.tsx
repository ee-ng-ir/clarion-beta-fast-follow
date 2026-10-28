import { useState } from "react"
import { ArrowRight, ChevronRight, ArrowLeft } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { StatusDot, LegendItem } from "./primitives"
import { GeoMap } from "./GeoMap"
import {
  locationById, citiesInCountry, countryById, countriesWithStats,
  type Status,
} from "@/data/dashboard"
import { locationSeverity, locationIssueCount, countrySeverity } from "@/data/endpoints"

const statusVar: Record<Status, string> = {
  healthy: "var(--status-healthy)",
  warning: "var(--status-warning)",
  critical: "var(--status-critical)",
}

// Active = online endpoints (healthy + warning + critical); excludes offline.
const activeEndpoints = (x: { healthy: number; warning: number; critical: number }) =>
  x.healthy + x.warning + x.critical

const plural = (n: number, one: string, many: string) =>
  `${n.toLocaleString()} ${n === 1 ? one : many}`

/* Hover tooltip shown on a map pin: name + endpoint count, then the
   healthy / warning / critical breakdown by number. */
function PinTooltip({
  name, endpoints, healthy, warning, critical, show,
}: {
  name: string
  endpoints: number
  healthy: number
  warning: number
  critical: number
  /** controlled visibility: true = shown, false = hidden, undefined = CSS hover */
  show?: boolean
}) {
  const visibility =
    show === undefined
      ? "hidden group-hover:block group-focus-visible:block"
      : show ? "block" : "hidden"
  return (
    <span
      className={`pointer-events-none absolute bottom-full left-1/2 z-30 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md px-2.5 py-1.5 text-left ${visibility}`}
      style={{ background: "var(--bg-neutral-emphasis)", color: "var(--fg-on-neutral-emphasis)", boxShadow: "var(--shadow-md)" }}
    >
      <span className="block text-xs font-medium">
        {name} · {endpoints.toLocaleString()} endpoints
      </span>
      <span className="mt-1 flex items-center gap-2.5 font-mono text-[11px]">
        <span className="flex items-center gap-1"><span className="size-1.5 rounded-full" style={{ background: "var(--status-healthy)" }} />{healthy.toLocaleString()}</span>
        <span className="flex items-center gap-1"><span className="size-1.5 rounded-full" style={{ background: "var(--status-warning)" }} />{warning.toLocaleString()}</span>
        <span className="flex items-center gap-1"><span className="size-1.5 rounded-full" style={{ background: "var(--status-critical)" }} />{critical.toLocaleString()}</span>
      </span>
    </span>
  )
}

/* ---------------- Map ---------------- */
function MapPanel({
  country, onEnterCountry, selectedId, onSelect, onViewEndpoints,
}: {
  country: string | null
  onEnterCountry: (id: string) => void
  selectedId: string
  onSelect: (id: string) => void
  onViewEndpoints: (loc?: string | string[]) => void
}) {
  const cs = countriesWithStats()
  const ctry = country ? countryById(country) : null
  const cities = country ? citiesInCountry(country) : []
  const [hoveredCity, setHoveredCity] = useState<string | null>(null)
  // what the "home" view fits to: all countries, or the cities of the drilled-in country
  const fitPoints = country ? cities : cs

  return (
    <div className="flex w-full flex-col lg:min-w-0 lg:flex-1" style={{ borderRight: "1px solid var(--border-neutral-subtle)" }}>
      <div className="flex items-center justify-between p-4">
        <h2 className="flex items-center gap-1.5 text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>
          {ctry ? (
            <>Endpoints <span style={{ color: "var(--fg-neutral-muted)" }}>·</span> <span style={{ color: "var(--fg-link-default)" }}>{ctry.name}</span></>
          ) : (
            <>Endpoints <span style={{ color: "var(--fg-neutral-muted)" }}>· worldwide</span></>
          )}
        </h2>
        <Button variant="outline" size="sm" className="gap-1.5" onClick={() => {
          if (!country) { onViewEndpoints("all"); return }
          const cityIds = cities.map((c) => c.id)
          // a specific city selected → just that city; otherwise the whole country (all its cities)
          if (selectedId !== "all" && cityIds.includes(selectedId)) onViewEndpoints(selectedId)
          else onViewEndpoints(cityIds)
        }}>
          View all endpoints
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="flex flex-1 flex-col gap-2 px-4 pb-4">
        <GeoMap className="h-[300px] w-full rounded-md" points={fitPoints} fitKey={country ?? "world"}
          style={{ border: "1px solid var(--border-neutral-subtle)" }}>
          {(project) => (
            <>
              {/* world view: country clusters */}
              {!country && cs.map((c) => {
                const cSev = countrySeverity(c.id)
                const pos = project(c)
                return (
                  <button key={c.id} type="button" onClick={() => onEnterCountry(c.id)} aria-label={c.name}
                    className="group pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center hover:z-20 focus:z-20 focus:outline-none"
                    style={{ left: pos.x, top: pos.y }}>
                    <PinTooltip name={c.name} endpoints={activeEndpoints(c)} healthy={c.healthy} warning={c.warning} critical={c.critical} />
                    <span className="flex items-center gap-1.5 rounded-full px-2 py-1 shadow-md transition-transform hover:scale-105"
                      style={{ background: "var(--bg-card)", border: `2px solid ${statusVar[cSev]}` }}>
                      <span className="size-2 rounded-full" style={{ background: statusVar[cSev] }} />
                      <span className="font-mono text-xs font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{activeEndpoints(c).toLocaleString()}</span>
                    </span>
                  </button>
                )
              })}

              {/* country view: city markers (same pill style) */}
              {country && cities.map((m) => {
                const isActive = m.id === selectedId
                const mSev = locationSeverity(m.id)
                const pos = project(m)
                // selected pin's tooltip stays pinned, but hovering ANY other pin hides it
                const show = isActive ? hoveredCity === null || hoveredCity === m.id : hoveredCity === m.id
                return (
                  <button key={m.id} type="button" onClick={() => onSelect(m.id)} aria-label={m.name}
                    onMouseEnter={() => setHoveredCity(m.id)} onMouseLeave={() => setHoveredCity(null)}
                    className="group pointer-events-auto absolute flex -translate-x-1/2 -translate-y-1/2 flex-col items-center hover:z-20 focus:z-20 focus:outline-none"
                    style={{ left: pos.x, top: pos.y, zIndex: isActive ? 10 : undefined }}>
                    <PinTooltip name={`${m.name}, ${ctry?.name ?? ""}`} endpoints={activeEndpoints(m)} healthy={m.healthy} warning={m.warning} critical={m.critical} show={show} />
                    <span className="flex items-center gap-1.5 rounded-full px-2 py-1 transition-transform hover:scale-105"
                      style={{ background: "var(--bg-card)", border: `2px solid ${statusVar[mSev]}`, boxShadow: isActive ? "0 0 0 3px var(--border-focused), var(--shadow-md)" : "var(--shadow-md)" }}>
                      <span className="size-2 rounded-full" style={{ background: statusVar[mSev] }} />
                      <span className="font-mono text-xs font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>{activeEndpoints(m).toLocaleString()}</span>
                    </span>
                  </button>
                )
              })}
            </>
          )}
        </GeoMap>

        <div className="flex items-center gap-2">
          <LegendItem status="healthy" label="Healthy" />
          <LegendItem status="warning" label="Warning" />
          <LegendItem status="critical" label="Critical" />
          {!country && <span className="ml-auto text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>Select a region to drill in</span>}
        </div>
      </div>
    </div>
  )
}

/* ---------------- Locations / regions panel ---------------- */
function LocationsPanel({
  country, onEnterCountry, selectedId, onSelect, onViewEndpoints, onAllLocations,
}: {
  country: string | null
  onEnterCountry: (id: string) => void
  selectedId: string
  onSelect: (id: string) => void
  onViewEndpoints: (loc?: string | string[]) => void
  onAllLocations: () => void
}) {
  const cs = countriesWithStats()
  const cities = country ? citiesInCountry(country) : []
  const ctry = country ? countryById(country) : null

  return (
    <div className="flex w-full flex-col lg:w-[400px] lg:shrink-0">
      {/* header */}
      {ctry ? (
        <button type="button" onClick={onAllLocations}
          className="flex items-center gap-2 p-4 text-left transition-colors hover:bg-[var(--bg-neutral-subtle-hovered)]"
          style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
          <ArrowLeft className="size-4" style={{ color: "var(--fg-neutral-muted)" }} />
          <span className="text-sm font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>All locations</span>
          <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>· {ctry.name} · {plural(cities.length, "city", "cities")}</span>
        </button>
      ) : (
        <div className="flex items-baseline gap-1 p-4" style={{ borderBottom: "1px solid var(--border-neutral-subtle)" }}>
          <span className="text-base font-medium" style={{ color: "var(--fg-neutral-emphasis)" }}>Locations</span>
          <span className="text-sm" style={{ color: "var(--fg-neutral-muted)" }}>· {cs.length} regions</span>
        </div>
      )}

      {/* scrollable list */}
      <div className="flex max-h-[312px] flex-col overflow-y-auto">
        {!country
          ? cs.map((c) => (
              <button key={c.id} type="button" onClick={() => onEnterCountry(c.id)}
                className="group relative flex items-center justify-between gap-2 p-4 text-left transition-colors"
                style={{ borderBottom: "1px solid var(--border-neutral-subtle)", background: "var(--bg-card)" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "var(--bg-card)")}>
                <span className="flex min-w-px items-center gap-2">
                  <StatusDot status={countrySeverity(c.id)} />
                  <span className="truncate text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>{c.name}</span>
                  <span className="shrink-0 text-xs" style={{ color: "var(--fg-neutral-subtle)" }}>{plural(c.cityCount, "city", "cities")}</span>
                </span>
                <span className="flex shrink-0 items-center gap-2 whitespace-nowrap font-mono text-xs" style={{ color: "var(--fg-neutral-muted)" }}>
                  <span>{plural(activeEndpoints(c), "active endpoint", "active endpoints")}</span>
                  <ChevronRight className="size-4 opacity-40 transition-opacity group-hover:opacity-100" />
                </span>
              </button>
            ))
          : cities.map((loc) => {
              const isSelected = loc.id === selectedId
              return (
                <div key={loc.id} className="group relative flex items-stretch transition-colors"
                  style={{ borderBottom: "1px solid var(--border-neutral-subtle)", background: isSelected ? "var(--bg-neutral-subtle-hovered)" : "var(--bg-card)" }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = "var(--bg-neutral-subtle-hovered)")}
                  onMouseLeave={(e) => (e.currentTarget.style.background = isSelected ? "var(--bg-neutral-subtle-hovered)" : "var(--bg-card)")}>
                  {isSelected && <span className="absolute left-0 top-0 h-full w-0.5" style={{ background: "var(--border-focused)" }} />}
                  <button type="button" onClick={() => onSelect(loc.id)} className="flex min-w-px flex-1 items-center justify-between gap-2 py-4 pl-4 pr-2 text-left">
                    <span className="flex min-w-px items-center gap-2">
                      <StatusDot status={locationSeverity(loc.id)} />
                      <span className="truncate text-sm" style={{ color: "var(--fg-neutral-emphasis)" }}>{loc.name}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 whitespace-nowrap font-mono text-xs" style={{ color: isSelected ? "var(--fg-neutral-emphasis)" : "var(--fg-neutral-muted)" }}>
                      {(() => { const n = locationIssueCount(loc.id); return (<>
                        <span>{plural(activeEndpoints(loc), "active endpoint", "active endpoints")}</span>
                        <span>·</span>
                        <span>{n === 0 ? "No alerts" : `${n} alert${n === 1 ? "" : "s"}`}</span>
                      </>) })()}
                    </span>
                  </button>
                  <button type="button" aria-label={`View ${loc.name} endpoints`} onClick={() => onViewEndpoints(loc.id)}
                    className="flex w-10 shrink-0 items-center justify-center transition-colors hover:bg-[var(--bg-neutral-subtle-pressed)]">
                    <ChevronRight className="size-4 opacity-40 transition-opacity group-hover:opacity-100" style={{ color: "var(--fg-neutral-muted)" }} />
                  </button>
                </div>
              )
            })}
      </div>
    </div>
  )
}

export function MapAndLocations({
  selectedId,
  onSelect,
  country,
  onCountryChange,
  onViewEndpoints,
}: {
  selectedId: string
  onSelect: (id: string) => void
  country: string | null
  onCountryChange: (id: string | null) => void
  onViewEndpoints: (loc?: string | string[]) => void
}) {
  const handleSelectCity = (id: string) => {
    const loc = locationById(id)
    if (loc) onCountryChange(loc.countryId)
    onSelect(id)
  }
  // entering a country: auto-select only when it has a single city; otherwise
  // just drill in with nothing selected
  const handleEnterCountry = (id: string) => {
    const cities = citiesInCountry(id)
    if (cities.length === 1) {
      handleSelectCity(cities[0].id)
    } else {
      onCountryChange(id)
      onSelect("all")
    }
  }
  const handleAllLocations = () => {
    onCountryChange(null)
    onSelect("all")
  }

  return (
    <Card className="w-full gap-0 overflow-hidden rounded-xl p-0">
      <div className="flex flex-col lg:flex-row">
        <MapPanel country={country} onEnterCountry={handleEnterCountry} selectedId={selectedId} onSelect={handleSelectCity} onViewEndpoints={onViewEndpoints} />
        <LocationsPanel country={country} onEnterCountry={handleEnterCountry} selectedId={selectedId} onSelect={handleSelectCity} onViewEndpoints={onViewEndpoints} onAllLocations={handleAllLocations} />
      </div>
    </Card>
  )
}
