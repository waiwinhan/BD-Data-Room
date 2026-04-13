export default defineEventHandler(async (event) => {
  const { password } = await readBody(event)
  const config = useRuntimeConfig()

  if (!password || password !== config.dealPassword) {
    throw createError({ statusCode: 401, message: 'Incorrect password. Please try again.' })
  }

  await setUserSession(event, { user: { role: 'authorized' }, loggedInAt: new Date().toISOString() })
  return { success: true }
})
