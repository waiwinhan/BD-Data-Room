/**
 * DELETE /api/chat/:threadId — delete a thread (cascade deletes its messages).
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  const userLabel = (session as any)?.user?.label
  if (!userLabel) throw createError({ statusCode: 401, statusMessage: 'Not authenticated' })

  const threadId = getRouterParam(event, 'threadId')
  if (!threadId) throw createError({ statusCode: 400, statusMessage: 'threadId required' })

  const sb = useSupabase()
  const { data: thread } = await sb
    .from('chat_threads')
    .select('id, user_label')
    .eq('id', threadId)
    .single()

  if (!thread || (thread as any).user_label !== userLabel) {
    throw createError({ statusCode: 404, statusMessage: 'Thread not found' })
  }

  const { error } = await sb.from('chat_threads').delete().eq('id', threadId)
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return { success: true }
})
