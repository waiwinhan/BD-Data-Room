export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const sb   = useSupabase()

  const { data } = await sb.from('settings').select('value').eq('key', 'app').single()
  const current  = data?.value ?? {
    roomName: 'Deal Data Room', logoDataUrl: '', defaultHurdleRate: 15,
  }

  // ── Migrate legacy single password → passwords array ─────────────────────
  if (!Array.isArray(current.passwords)) {
    current.passwords = [{ label: 'Admin', password: current.password ?? 'brdb2024' }]
    delete current.password
  }

  // ── Add a new password slot ───────────────────────────────────────────────
  if (body.addPassword !== undefined) {
    const { label, password: pwd } = body.addPassword
    if (!label?.trim())      throw createError({ statusCode: 400, statusMessage: 'Label is required' })
    if (!pwd || pwd.length < 6) throw createError({ statusCode: 400, statusMessage: 'Password must be at least 6 characters' })
    const duplicate = current.passwords.find((p: any) => p.label.toLowerCase() === label.trim().toLowerCase())
    if (duplicate)           throw createError({ statusCode: 409, statusMessage: 'A password with that label already exists' })
    current.passwords.push({ label: label.trim(), password: pwd })
  }

  // ── Remove a password slot ────────────────────────────────────────────────
  if (body.removePassword !== undefined) {
    if (current.passwords.length <= 1) throw createError({ statusCode: 400, statusMessage: 'Cannot remove the last password' })
    current.passwords = current.passwords.filter((p: any) => p.label !== body.removePassword)
  }

  // ── Update a password slot (label and/or password) ────────────────────────
  if (body.updatePassword !== undefined) {
    const { label, newLabel, newPassword } = body.updatePassword
    const slot = current.passwords.find((p: any) => p.label === label)
    if (!slot) throw createError({ statusCode: 404, statusMessage: 'Password slot not found' })
    if (newLabel?.trim())   slot.label    = newLabel.trim()
    if (newPassword)        slot.password = newPassword
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
