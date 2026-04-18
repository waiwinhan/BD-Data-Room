export default defineEventHandler(async (event) => {
  const { password } = await readBody(event)
  const sb = useSupabase()

  // Read password from Supabase settings table, fall back to env var
  const { data } = await sb.from('settings').select('value').eq('key', 'app').single()
  const expectedPassword = data?.value?.password ?? useRuntimeConfig().dealPassword

  if (!password || password !== expectedPassword) {
    throw createError({ statusCode: 401, message: 'Incorrect password. Please try again.' })
  }

  await setUserSession(event, { user: { role: 'authorized' }, loggedInAt: new Date().toISOString() })
  return { success: true }
})
