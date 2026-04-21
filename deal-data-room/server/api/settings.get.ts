export default defineEventHandler(async () => {
  const sb = useSupabase()
  const { data } = await sb.from('settings').select('value').eq('key', 'app').single()
  const s = data?.value ?? {}

  // Migrate legacy single password → array shape (labels only returned to client)
  let passwordSlots: Array<{ label: string }> = []
  if (Array.isArray(s.passwords) && s.passwords.length) {
    passwordSlots = s.passwords.map((p: any) => ({ label: p.label }))
  } else {
    passwordSlots = [{ label: 'Admin' }]
  }

  return {
    roomName:          s.roomName          ?? 'Deal Data Room',
    logoDataUrl:       s.logoDataUrl       ?? '',
    defaultHurdleRate: s.defaultHurdleRate ?? 15,
    passwordSlots,   // labels only — actual passwords never sent to client
  }
})
