export default defineEventHandler(async () => {
  const sb = useSupabase()
  const { data } = await sb.from('settings').select('value').eq('key', 'app').single()
  const s = data?.value ?? {}
  return {
    roomName:          s.roomName          ?? 'BRDB Developments Sdn Bhd',
    logoDataUrl:       s.logoDataUrl       ?? '',
    defaultHurdleRate: s.defaultHurdleRate ?? 15,
  }
})
