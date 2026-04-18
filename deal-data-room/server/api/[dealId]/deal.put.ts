export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const body   = await readBody(event)
  const sb     = useSupabase()

  // Map camelCase body fields → snake_case columns
  const update: Record<string, any> = {}
  if (body.name        !== undefined) update.name        = body.name
  if (body.location    !== undefined) update.location    = body.location
  if (body.stage       !== undefined) update.stage       = body.stage
  if (body.gdv         !== undefined) update.gdv         = body.gdv
  if (body.ndv         !== undefined) update.ndv         = body.ndv
  if (body.irr         !== undefined) update.irr         = body.irr
  if (body.hurdleRate  !== undefined) update.hurdle_rate = body.hurdleRate
  if (body.landAcres   !== undefined) update.land_acres  = body.landAcres
  if (body.tenure      !== undefined) update.tenure      = body.tenure
  if (body.ddProgress  !== undefined) update.dd_progress = body.ddProgress
  if (body.updatedAt   !== undefined) update.updated_at  = body.updatedAt
  if (body.stageNote   !== undefined) update.stage_note  = body.stageNote
  if (body.restricted  !== undefined) update.restricted  = body.restricted
  if (body.blendedPSF  !== undefined) update.blended_psf = body.blendedPSF
  if (body.ndpMargin   !== undefined) update.ndp_margin  = body.ndpMargin

  const { error } = await sb.from('deals').update(update).eq('id', dealId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { success: true }
})
