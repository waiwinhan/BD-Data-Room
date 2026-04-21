export default defineEventHandler(async (event) => {
  const dealId   = getRouterParam(event, 'dealId')!
  const filename = getRouterParam(event, 'filename')!
  const sb = useSupabase()

  const { error } = await sb
    .from('deal_documents')
    .update({ trashed: true })
    .eq('deal_id', dealId)
    .eq('filename', filename)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  await logActivity(event, dealId, 'deleted', 'document', filename)

  return { ok: true }
})
