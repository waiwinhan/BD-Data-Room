export default defineEventHandler(async (event) => {
  const dealId   = getRouterParam(event, 'dealId')!
  const filename = getRouterParam(event, 'filename')!
  const body     = await readBody(event)
  const sb       = useSupabase()

  const update: Record<string, any> = {}
  if (body.name     !== undefined) update.name     = body.name
  if (body.category !== undefined) update.category = body.category
  if (body.status   !== undefined) update.status   = body.status

  if (Object.keys(update).length === 0) return { ok: true }

  const { error } = await sb
    .from('deal_documents')
    .update(update)
    .eq('deal_id', dealId)
    .eq('filename', filename)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { ok: true }
})
