export default defineEventHandler(async () => {
  const sb = useSupabase()
  const { data, error } = await sb.from('deals').select('*').eq('trashed', false).order('created_at', { ascending: true })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  const deals = (data ?? []).map((d: any) => ({
    id:          d.id,
    name:        d.name,
    ref:         d.ref,
    location:    d.location,
    stage:       d.stage,
    gdv:         d.gdv,
    ndv:         d.ndv ?? Math.round((d.gdv ?? 0) * 0.9),
    ndpMargin:   d.ndp_margin ?? 0,
    irr:         d.irr,
    hurdleRate:  d.hurdle_rate,
    blendedPSF:  d.blended_psf ?? 0,
    landAcres:   d.land_acres,
    tenure:      d.tenure,
    ddProgress:  d.dd_progress,
    updatedAt:   d.updated_at,
    stageNote:   d.stage_note,
    restricted:  d.restricted,
  }))

  const activeDeals = deals.filter((d: any) => d.stage !== 'Rejected')
  const totalNDV    = activeDeals.reduce((s: number, d: any) => s + (d.ndv ?? 0), 0)
  const avgMargin   = activeDeals.length ? activeDeals.reduce((s: number, d: any) => s + (d.ndpMargin ?? 0), 0) / activeDeals.length : 0
  const totalAcres  = activeDeals.reduce((s: number, d: any) => s + (d.landAcres ?? 0), 0)

  return {
    deals,
    portfolio: {
      totalNDV:        Math.round(totalNDV),
      avgNDPMargin:    Math.round(avgMargin * 10) / 10,
      totalLandAcres:  Math.round(totalAcres * 10) / 10,
      activeCount:     activeDeals.length,
      pendingBoardCount: deals.filter((d: any) => d.stage === 'Active DD' || d.stage === 'KIV').length,
    },
  }
})
