export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const body   = await readBody(event)  // { internal: [...], external: [...] }
  const sb     = useSupabase()

  // Fetch existing meta and merge team update
  const { data, error: fetchErr } = await sb
    .from('deal_meta')
    .select('data')
    .eq('deal_id', dealId)
    .single()

  if (fetchErr || !data) throw createError({ statusCode: 404, statusMessage: 'Deal not found' })

  const updated = { ...data.data, team: { internal: body.internal ?? [], external: body.external ?? [] } }

  const { error } = await sb.from('deal_meta').upsert({ deal_id: dealId, data: updated })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  await logActivity(event, dealId, 'updated', 'team', 'Deal Team')

  return { success: true }
})
