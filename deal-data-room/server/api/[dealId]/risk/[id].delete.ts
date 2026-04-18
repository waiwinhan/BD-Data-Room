export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')!
  const sb = useSupabase()

  const dbId = parseInt(id.replace(/\D/g, ''), 10)
  if (isNaN(dbId)) throw createError({ statusCode: 400, statusMessage: 'Invalid risk id' })

  const { error } = await sb.from('deal_risks').delete().eq('id', dbId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { success: true }
})
