// Supabase-backed proximity suggester

// Haversine formula — no external library needed
function distanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${km.toFixed(1)} km`
}

function assignColor(tags: Record<string, string>): string {
  if (tags.railway || tags.amenity === 'bus_station' || tags.amenity === 'ferry_terminal')
    return 'green'
  if (
    tags.shop === 'mall' ||
    tags.amenity === 'hospital' ||
    tags.barrier === 'border_control' ||
    tags.amenity === 'customs'
  ) return 'blue'
  if (tags.amenity === 'university' || tags.tourism || tags.amenity === 'college')
    return 'amber'
  return 'grey'
}

// Only accept specific, meaningful OSM tag combinations
function isRelevant(tags: Record<string, string>): boolean {
  if (tags.railway === 'station' || tags.railway === 'halt' || tags.railway === 'tram_stop') return true
  if (tags.amenity === 'bus_station') return true
  if (tags.amenity === 'ferry_terminal') return true
  if (tags.shop === 'mall') return true
  if (tags.amenity === 'hospital') return true
  if (tags.amenity === 'university' || tags.amenity === 'college') return true
  if (tags.tourism === 'theme_park') return true  // theme_park only — NOT attraction (too broad)
  if (tags.barrier === 'border_control' || tags.amenity === 'customs') return true
  return false
}

// Require a clean, human-readable name — majority Latin characters
function getLabel(tags: Record<string, string>): string | null {
  const name = tags['name:en'] || tags.name || tags.official_name
  if (!name) return null
  const trimmed = name.trim()
  if (trimmed.toLowerCase().includes('unnamed')) return null
  if (trimmed.length < 4) return null
  // Require at least 40% Latin characters (filters out mostly-CJK names like "JB 美乐 面线")
  const latinChars = (trimmed.match(/[a-zA-Z]/g) || []).length
  if (latinChars / trimmed.length < 0.40) return null
  return trimmed
}

export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const sb = useSupabase()

  const { data: metaRow, error } = await sb.from('deal_meta').select('data').eq('deal_id', dealId).single()
  if (error || !metaRow) throw createError({ statusCode: 404, statusMessage: `Deal ${dealId} not found` })

  const meta = metaRow.data
  const { lat, lng } = meta.coordinates

  // Targeted query — only fetch meaningful POI categories
  const query = `
[out:json][timeout:15];
(
  node["railway"~"^(station|halt|tram_stop)$"](around:12000,${lat},${lng});
  node["amenity"="bus_station"](around:10000,${lat},${lng});
  node["amenity"="ferry_terminal"](around:15000,${lat},${lng});
  way["shop"="mall"](around:10000,${lat},${lng});
  node["shop"="mall"](around:10000,${lat},${lng});
  node["amenity"="hospital"](around:10000,${lat},${lng});
  node["amenity"~"^(university|college)$"](around:10000,${lat},${lng});
  node["tourism"="theme_park"](around:15000,${lat},${lng});
  node["barrier"="border_control"](around:25000,${lat},${lng});
  node["amenity"="customs"](around:25000,${lat},${lng});
);
out center 40;
`

  let data: any
  try {
    // Overpass API requires form-encoded `data=` parameter
    const body = 'data=' + encodeURIComponent(query)
    const res = await fetch('https://overpass-api.de/api/interpreter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
      signal: AbortSignal.timeout(20000),
    })
    if (!res.ok) throw new Error(`Overpass HTTP ${res.status}`)
    data = await res.json()
  } catch {
    throw createError({ statusCode: 503, statusMessage: 'Could not reach map service. Add manually.' })
  }

  const elements: any[] = data?.elements ?? []

  const seen = new Set<string>()
  const results = elements
    .map((el) => {
      const elLat = el.lat ?? el.center?.lat
      const elLng = el.lon ?? el.center?.lon
      if (!elLat || !elLng) return null

      const tags: Record<string, string> = el.tags ?? {}

      // Must pass relevance gate (exact tag match, not just any OSM node)
      if (!isRelevant(tags)) return null

      const label = getLabel(tags)
      if (!label) return null

      const km = distanceKm(lat, lng, elLat, elLng)
      const color = assignColor(tags)
      return { label, distance: formatDistance(km), color, _km: km }
    })
    .filter((x): x is NonNullable<typeof x> => x !== null)
    .sort((a, b) => a._km - b._km)
    .filter((item) => {
      if (seen.has(item.label.toLowerCase())) return false
      seen.add(item.label.toLowerCase())
      return true
    })
    .slice(0, 6)
    .map(({ label, distance, color }) => ({ label, distance, color }))

  return results
})
