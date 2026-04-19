export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const sb   = useSupabase()

  const { data } = await sb.from('settings').select('value').eq('key', 'app').single()
  const current = data?.value ?? { roomName: 'Deal Data Room', logoDataUrl: '', defaultHurdleRate: 15, password: 'brdb2024' }

  // ── Password change ───────────────────────────────────────────────────────
  if (body.newPassword !== undefined) {
    if (body.currentPassword !== current.password) {
      throw createError({ statusCode: 403, statusMessage: 'Current password is incorrect' })
    }
    if (!body.newPassword || body.newPassword.length < 6) {
      throw createError({ statusCode: 400, statusMessage: 'New password must be at least 6 characters' })
    }
    current.password = body.newPassword
  }

  // ── Branding ──────────────────────────────────────────────────────────────
  if (body.roomName !== undefined) {
    if (!body.roomName.trim()) throw createError({ statusCode: 400, statusMessage: 'Room name cannot be empty' })
    current.roomName = body.roomName.trim()
  }
  if (body.logoDataUrl       !== undefined) current.logoDataUrl       = body.logoDataUrl
  if (body.defaultHurdleRate !== undefined) {
    const rate = parseFloat(body.defaultHurdleRate)
    if (isNaN(rate) || rate < 0 || rate > 100) throw createError({ statusCode: 400, statusMessage: 'Hurdle rate must be 0–100' })
    current.defaultHurdleRate = rate
  }

  const { error } = await sb.from('settings').upsert({ key: 'app', value: current })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { ok: true }
})
