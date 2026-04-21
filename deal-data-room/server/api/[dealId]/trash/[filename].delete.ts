export default defineEventHandler(async (event) => {
  const dealId   = getRouterParam(event, 'dealId')!
  const filename = getRouterParam(event, 'filename')!
  const sb = useSupabase()

  // Remove from Supabase Storage
  await sb.storage
    .from('deal-files')
    .remove([`${dealId}/docs/${filename}`])

  // Remove from database
  const { error } = await sb
    .from('deal_documents')
    .delete()
    .eq('deal_id', dealId)
    .eq('filename', filename)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  await logActivity(event, dealId, 'permanently deleted', 'document', filename)

  return { ok: true }
})
