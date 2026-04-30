export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const id     = Number(getRouterParam(event, 'id'))
  const b      = await readBody(event)
  const sb     = useSupabase()

  const { error } = await sb.from('deal_comps').update({
    project_name:   b.projectName,
    developer:      b.developer,
    architect:      b.architect,
    location:       b.location,
    lat:            b.lat           ?? null,
    lng:            b.lng           ?? null,
    project_status: b.projectStatus,
    completion:     b.completion    ?? null,
    units:          b.units         ?? null,
    blocks:         b.blocks        ?? null,
    storeys:        b.storeys       ?? null,
    size_min:       b.sizeMin       ?? null,
    size_max:       b.sizeMax       ?? null,
    avg_psf:        b.avgPSF        ?? null,
    tenure:         b.tenure,
    sales_status:   b.salesStatus,
    maintenance_fee:b.maintenanceFee,
    furnishing:     b.furnishing,
    ac_system:      b.acSystem,
    has_bathtub:    b.hasBathtub    ?? false,
    secure_building:b.secureBuilding ?? false,
    green_building: b.greenBuilding  ?? false,
    take_up_rate:   b.takeUpRate    ?? null,
    facilities:     b.facilities    ?? [],
    image_url:      b.imageUrl,
    notes:          b.notes,
  }).eq('id', id).eq('deal_id', dealId)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { success: true }
})
