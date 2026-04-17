import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const { password } = await readBody(event)
  const config = useRuntimeConfig()

  // Read password from settings.json if it exists, fall back to env var
  const settingsPath = path.join(config.dataDir, 'settings.json')
  let expectedPassword = config.dealPassword as string
  if (existsSync(settingsPath)) {
    const s = JSON.parse(readFileSync(settingsPath, 'utf-8'))
    if (s.password) expectedPassword = s.password
  }

  if (!password || password !== expectedPassword) {
    throw createError({ statusCode: 401, message: 'Incorrect password. Please try again.' })
  }

  await setUserSession(event, { user: { role: 'authorized' }, loggedInAt: new Date().toISOString() })
  return { success: true }
})
