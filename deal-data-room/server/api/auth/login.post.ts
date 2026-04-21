export default defineEventHandler(async (event) => {
  const { password } = await readBody(event)
  const sb = useSupabase()

  const ip        = getRequestHeader(event, 'x-forwarded-for')?.split(',')[0].trim()
               ?? getRequestHeader(event, 'x-real-ip')
               ?? 'unknown'
  const userAgent = getRequestHeader(event, 'user-agent') ?? ''

  // Read passwords array from Supabase; fall back to legacy single password
  const { data } = await sb.from('settings').select('value').eq('key', 'app').single()
  const s = data?.value ?? {}

  let passwords: Array<{ label: string; password: string }> = []
  if (Array.isArray(s.passwords) && s.passwords.length) {
    passwords = s.passwords
  } else {
    // Legacy single-password — auto-migrate shape for matching purposes
    const legacyPwd = s.password ?? useRuntimeConfig().dealPassword ?? ''
    passwords = [{ label: 'Admin', password: legacyPwd }]
  }

  const matched = passwords.find(p => p.password === password)

  // Always log the attempt
  await sb.from('access_log').insert({
    label:      matched?.label ?? '—',
    ip,
    user_agent: userAgent,
    success:    !!matched,
  })

  if (!matched) {
    throw createError({ statusCode: 401, message: 'Incorrect password. Please try again.' })
  }

  await setUserSession(event, {
    user: { role: 'authorized', label: matched.label },
    loggedInAt: new Date().toISOString(),
  })
  return { success: true }
})
