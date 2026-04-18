export default defineEventHandler(async (event) => {
  const id   = getRouterParam(event, 'id')!
  const body = await readBody(event)
  const sb   = useSupabase()

  // id may be "R01" format or raw numeric string
  const dbId = parseInt(id.replace(/\D/g, ''), 10)
  if (isNaN(dbId)) throw createError({ statusCode: 400, statusMessage: 'Invalid risk id' })

  const update: Record<string, any> = {}
  if (body.category    !== undefined) update.category    = body.category
  if (body.description !== undefined) update.description = body.description
  if (body.severity    !== undefined) update.severity    = body.severity
  if (body.mitigation  !== undefined) update.mitigation  = body.mitigation
  if (body.owner       !== undefined) update.owner       = body.owner

  const { data, error } = await sb.from('deal_risks').update(update).eq('id', dbId).select().single()
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })
  return { ...data, id: `R${String(data.id).padStart(2, '0')}` }
})
