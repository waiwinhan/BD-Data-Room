export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const sb   = useSupabase()

  // ── Auto-generate ID ─────────────────────────────────────────────────────
  const prefix = (body.prefix ?? 'KL').toUpperCase()
  const year   = new Date().getFullYear()
  const base   = `${prefix}-${year}-`

  const { data: existing } = await sb.from('deals').select('id').like('id', `${base}%`)
  const nums = (existing ?? [])
    .map((d: any) => parseInt(d.id.replace(base, ''), 10))
    .filter((n: number) => !isNaN(n))
  const nextSeq = nums.length ? Math.max(...nums) + 1 : 1
  const dealId  = `${base}${String(nextSeq).padStart(2, '0')}`

  if (!body.name?.trim())     throw createError({ statusCode: 400, statusMessage: 'Deal name is required' })
  if (!body.location?.trim()) throw createError({ statusCode: 400, statusMessage: 'Location is required' })

  const today = new Date().toISOString().slice(0, 10)
  const gdv   = parseFloat(body.gdv) || 0
  const hurdleRate = parseFloat(body.hurdleRate) || 15

  // ── Insert into deals table ───────────────────────────────────────────────
  const { error: dealErr } = await sb.from('deals').insert({
    id:          dealId,
    name:        body.name.trim(),
    ref:         dealId,
    location:    body.location.trim(),
    stage:       body.stage || 'Active DD',
    restricted:  body.restricted ?? false,
    gdv,
    irr:         0,
    hurdle_rate: hurdleRate,
    land_acres:  parseFloat(body.landAcres) || 0,
    tenure:      body.tenure || 'Freehold',
    dd_progress: 0,
    updated_at:  today,
    stage_note:  body.stageNote?.trim() || '',
  })
  if (dealErr) throw createError({ statusCode: 500, statusMessage: dealErr.message })

  // ── Insert default meta ───────────────────────────────────────────────────
  const meta = {
    id:          dealId,
    name:        body.name.trim(),
    ref:         dealId,
    location:    body.location.trim(),
    coordinates: { lat: 3.1390, lng: 101.6869 },
    tenure:      body.tenure || 'Freehold',
    landArea:    parseFloat(body.landAcres) || 0,
    stage:       body.stage || 'Active DD',
    hurdleRate,
    proximities: [],
    milestones: [
      { label: 'Deal Identified',  date: today, status: 'done' },
      { label: 'Title Search',     date: '',    status: 'pending' },
      { label: 'Site Visit',       date: '',    status: 'pending' },
      { label: 'Valuation Report', date: '',    status: 'pending' },
      { label: 'Board Paper',      date: '',    status: 'pending' },
    ],
    devMix:      [],
    assumptions: [
      { label: 'Hurdle IRR', value: `${hurdleRate}%` },
      { label: 'Land Area',  value: `${body.landAcres || 0} ac` },
      { label: 'Tenure',     value: body.tenure || 'Freehold' },
    ],
    legalStatus: { titleType: '', encumbrance: 'TBC', zoning: 'TBC', bumiQuota: 'TBC' },
    team:       { internal: [], external: [] },
    accessLog:  [{ user: 'BD Team', action: 'created', timestamp: new Date().toISOString() }],
  }

  const { error: metaErr } = await sb.from('deal_meta').insert({ deal_id: dealId, data: meta })
  if (metaErr) throw createError({ statusCode: 500, statusMessage: metaErr.message })

  return { ok: true, dealId }
})
