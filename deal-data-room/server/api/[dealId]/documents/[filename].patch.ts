const STATUS_CYCLE = ['New', 'Reviewed', 'Pending']

export default defineEventHandler(async (event) => {
  const dealId   = getRouterParam(event, 'dealId')!
  const filename = getRouterParam(event, 'filename')!
  const body     = await readBody(event)
  const sb       = useSupabase()

  const { data: existing } = await sb
    .from('deal_documents')
    .select('status, name')
    .eq('deal_id', dealId)
    .eq('filename', filename)
    .single()

  let newStatus: string
  if (body.status) {
    newStatus = body.status
  } else {
    const current = existing?.status ?? 'New'
    const idx = STATUS_CYCLE.indexOf(current)
    newStatus = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
  }

  await sb.from('deal_documents')
    .update({ status: newStatus })
    .eq('deal_id', dealId)
    .eq('filename', filename)

  // Log status change
  const displayName = existing?.name || filename
  await logActivity(event, dealId, `status → ${newStatus}`, 'document', displayName)

  return { success: true, status: newStatus }
})
