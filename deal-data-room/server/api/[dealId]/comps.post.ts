export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const b = await readBody(event)
  const sb = useSupabase()

  const { data, error } = await sb.from('deal_comps').insert({
    deal_id:        dealId,
    project_name:   b.projectName   ?? '',
    developer:      b.developer     ?? '',
    architect:      b.architect     ?? '',
    location:       b.location      ?? '',
    lat:            b.lat           ?? null,
    lng:            b.lng           ?? null,
    project_status: b.projectStatus ?? 'Ongoing',
    completion:     b.completion    ?? null,
    units:          b.units         ?? null,
    blocks:         b.blocks        ?? null,
    storeys:        b.storeys       ?? null,
    size_min:       b.sizeMin       ?? null,
    size_max:       b.sizeMax       ?? null,
    avg_psf:        b.avgPSF        ?? null,
    tenure:         b.tenure        ?? 'Freehold',
    sales_status:   b.salesStatus   ?? 'Primary Market',
    maintenance_fee:b.maintenanceFee ?? '',
    furnishing:     b.furnishing    ?? 'Semi-Furnished',
    ac_system:      b.acSystem      ?? 'Split Unit',
    has_bathtub:    b.hasBathtub    ?? false,
    secure_building:b.secureBuilding ?? false,
    green_building: b.greenBuilding  ?? false,
    take_up_rate:   b.takeUpRate    ?? null,
    facilities:     b.facilities    ?? [],
    image_url:      b.imageUrl      ?? '',
    notes:          b.notes         ?? '',
  }).select().single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return mapRow(data)
})

function mapRow(r: any) {
  return {
    id:             r.id,
    projectName:    r.project_name,
    developer:      r.developer,
    architect:      r.architect,
    location:       r.location,
    lat:            r.lat,
    lng:            r.lng,
    projectStatus:  r.project_status,
    completion:     r.completion,
    units:          r.units,
    blocks:         r.blocks,
    storeys:        r.storeys,
    sizeMin:        r.size_min,
    sizeMax:        r.size_max,
    avgPSF:         r.avg_psf,
    tenure:         r.tenure,
    salesStatus:    r.sales_status,
    maintenanceFee: r.maintenance_fee,
    furnishing:     r.furnishing,
    acSystem:       r.ac_system,
    hasBathtub:     r.has_bathtub,
    secureBuilding: r.secure_building,
    greenBuilding:  r.green_building,
    takeUpRate:     r.take_up_rate,
    facilities:     r.facilities ?? [],
    imageUrl:       r.image_url,
    notes:          r.notes,
  }
}
