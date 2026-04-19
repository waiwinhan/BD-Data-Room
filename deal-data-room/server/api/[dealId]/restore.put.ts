export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const sb = useSupabase()
  const { error } = await sb.from('deals')
    .update({ trashed: false, trashed_at: null })
    .eq('id', dealId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { success: true }
})
