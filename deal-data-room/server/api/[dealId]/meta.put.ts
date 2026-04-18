export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const body   = await readBody(event)
  const sb     = useSupabase()
  const { error } = await sb.from('deal_meta').upsert({ deal_id: dealId, data: body })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { success: true }
})
