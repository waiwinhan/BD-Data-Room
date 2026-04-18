export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const body   = await readBody(event)
  const sb     = useSupabase()

  const { data, error } = await sb.from('deal_risks').insert({
    deal_id:     dealId,
    category:    body.category    ?? 'General',
    description: body.description ?? 'New risk item',
    severity:    body.severity    ?? 'amber',
    mitigation:  body.mitigation  ?? '',
    owner:       body.owner       ?? '',
  }).select().single()

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return {
    id:          `R${String(data.id).padStart(2, '0')}`,
    _dbId:       data.id,
    category:    data.category,
    description: data.description,
    severity:    data.severity,
    mitigation:  data.mitigation,
    owner:       data.owner,
  }
})
