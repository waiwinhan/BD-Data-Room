export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const sb = useSupabase()
  const { data, error } = await sb.from('deal_meta').select('data').eq('deal_id', dealId).single()
  if (error || !data) throw createError({ statusCode: 404, statusMessage: `Deal ${dealId} not found` })
  return data.data
})
