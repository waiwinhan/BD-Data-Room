/**
 * GET /api/chat/:threadId/messages — load all messages for a thread (must be owned by current user).
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
    .select('id, user_label, title, deal_id')
    .eq('id', threadId)
    .single()

  if (!thread || (thread as any).user_label !== userLabel) {
    throw createError({ statusCode: 404, statusMessage: 'Thread not found' })
  }

  const { data: messages, error } = await sb
    .from('chat_messages')
    .select('id, role, content, deal_id, created_at')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return {
    thread: { id: (thread as any).id, title: (thread as any).title, dealId: (thread as any).deal_id },
    messages: messages ?? [],
  }
})
