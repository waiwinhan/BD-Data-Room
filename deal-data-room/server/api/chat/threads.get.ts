/**
 * GET /api/chat/threads — list current user's chat threads, newest first.
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userLabel = (session as any)?.user?.label
  if (!userLabel) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

  const sb = useSupabase()
  const { data, error } = await sb
    .from('chat_threads')
    .select('id, title, deal_id, created_at, updated_at')
    .eq('user_label', userLabel)
    .order('updated_at', { ascending: false })
    .limit(50)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data ?? []
})
