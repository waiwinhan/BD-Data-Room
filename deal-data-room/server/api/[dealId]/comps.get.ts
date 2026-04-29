export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const sb = useSupabase()
  const { data, error } = await sb
    .from('deal_comps')
    .select('*')
    .eq('deal_id', dealId)
    .order('id', { ascending: true })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return (data ?? []).map(mapRow)
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
