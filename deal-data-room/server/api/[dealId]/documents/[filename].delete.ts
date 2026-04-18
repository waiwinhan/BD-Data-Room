export default defineEventHandler(async (event) => {
  const dealId   = getRouterParam(event, 'dealId')!
  const filename = getRouterParam(event, 'filename')!
  const sb = useSupabase()

  // Move to trash in Supabase Storage by updating DB flag (soft delete)
  const { error } = await sb
    .from('deal_documents')
    .update({ trashed: true })
    .eq('deal_id', dealId)
    .eq('filename', filename)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { ok: true }
})
