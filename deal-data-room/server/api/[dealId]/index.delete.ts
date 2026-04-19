export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const sb = useSupabase()

  // Delete all related data first
  await sb.from('deal_documents').delete().eq('deal_id', dealId)
  await sb.from('deal_meta').delete().eq('deal_id', dealId)
  await sb.from('deal_risk').delete().eq('deal_id', dealId)

  const { error } = await sb.from('deals').delete().eq('id', dealId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { success: true }
})
