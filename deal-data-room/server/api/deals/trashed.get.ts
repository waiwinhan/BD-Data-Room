export default defineEventHandler(async () => {
  const sb = useSupabase()
  const { data, error } = await sb.from('deals')
    .select('*')
    .eq('trashed', true)
    .order('trashed_at', { ascending: false })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  return (data ?? []).map((d: any) => ({
    id:         d.id,
    name:       d.name,
    ref:        d.ref,
    location:   d.location,
    stage:      d.stage,
    ndv:        d.ndv ?? 0,
    landAcres:  d.land_acres ?? 0,
    trashedAt:  d.trashed_at,
  }))
})
