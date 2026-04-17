import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()
  const settingsPath = path.join(config.dataDir, 'settings.json')

  const current = existsSync(settingsPath)
    ? JSON.parse(readFileSync(settingsPath, 'utf-8'))
    : { roomName: 'BRDB Berhad', logoDataUrl: '', defaultHurdleRate: 15, password: config.dealPassword }

  // ── Password change ────────────────────────────────────────────────────────
  if (body.newPassword !== undefined) {
    // Verify current password before allowing change
    const currentPassword = current.password ?? config.dealPassword
    if (body.currentPassword !== currentPassword) {
      throw createError({ statusCode: 403, statusMessage: 'Current password is incorrect' })
    }
    if (!body.newPassword || body.newPassword.length < 6) {
      throw createError({ statusCode: 400, statusMessage: 'New password must be at least 6 characters' })
    }
    current.password = body.newPassword
  }

  // ── Branding ───────────────────────────────────────────────────────────────
  if (body.roomName !== undefined) {
    if (!body.roomName.trim()) throw createError({ statusCode: 400, statusMessage: 'Room name cannot be empty' })
    current.roomName = body.roomName.trim()
  }
  if (body.logoDataUrl !== undefined) current.logoDataUrl = body.logoDataUrl
  if (body.defaultHurdleRate !== undefined) {
    const rate = parseFloat(body.defaultHurdleRate)
    if (isNaN(rate) || rate < 0 || rate > 100) throw createError({ statusCode: 400, statusMessage: 'Hurdle rate must be 0–100' })
    current.defaultHurdleRate = rate
  }

  writeFileSync(settingsPath, JSON.stringify(current, null, 2))
  return { ok: true }
})
