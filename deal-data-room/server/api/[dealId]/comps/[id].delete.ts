export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const id     = Number(getRouterParam(event, 'id'))
  const sb     = useSupabase()

  const { error } = await sb.from('deal_comps').delete().eq('id', id).eq('deal_id', dealId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { success: true }
})
