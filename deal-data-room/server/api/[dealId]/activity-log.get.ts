export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const sb = useSupabase()

  const { data, error } = await sb
    .from('deal_activity_log')
    .select('id, created_at, user_label, action, target_type, target_name')
    .eq('deal_id', dealId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data ?? []
})
