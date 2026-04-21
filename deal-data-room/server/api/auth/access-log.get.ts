export default defineEventHandler(async () => {
  const sb = useSupabase()
  const { data, error } = await sb
    .from('access_log')
    .select('id, created_at, label, ip, user_agent, success')
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return data ?? []
})
