export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const sb = useSupabase()
  const { data, error } = await sb.from('deal_risks').select('*').eq('deal_id', dealId).order('id', { ascending: true })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return (data ?? []).map((r: any) => ({
    id:          `R${String(r.id).padStart(2, '0')}`,
    _dbId:       r.id,
    category:    r.category,
    description: r.description,
    severity:    r.severity,
    mitigation:  r.mitigation,
    owner:       r.owner,
  }))
})
