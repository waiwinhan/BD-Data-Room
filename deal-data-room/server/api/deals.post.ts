import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const config = useRuntimeConfig()
  const dataDir = config.dataDir as string

  const dealsPath = path.join(dataDir, 'deals.json')
  const deals: any[] = JSON.parse(readFileSync(dealsPath, 'utf-8'))

  // ── Auto-generate ID: {PREFIX}-{YEAR}-{SEQ} ──────────────────────────────
  const prefix = (body.prefix ?? 'KL').toUpperCase()
  const year   = new Date().getFullYear()
  const base   = `${prefix}-${year}-`

  const existing = deals
    .map((d: any) => d.id)
    .filter((id: string) => id.startsWith(base))
    .map((id: string) => parseInt(id.replace(base, ''), 10))
    .filter((n: number) => !isNaN(n))

  const nextSeq  = existing.length ? Math.max(...existing) + 1 : 1
  const dealId   = `${base}${String(nextSeq).padStart(2, '0')}`

  // ── Validate required fields ──────────────────────────────────────────────
  if (!body.name?.trim())     throw createError({ statusCode: 400, statusMessage: 'Deal name is required' })
  if (!body.location?.trim()) throw createError({ statusCode: 400, statusMessage: 'Location is required' })

  // ── Build deals.json entry ────────────────────────────────────────────────
  const today = new Date().toISOString().slice(0, 10)
  const gdv       = parseFloat(body.gdv)      || 0
  const landCost  = parseFloat(body.landCost) || 0
  const landAcres = parseFloat(body.landAcres)|| 0

  const newDeal: any = {
    id:               dealId,
    name:             body.name.trim(),
    ref:              dealId,
    location:         body.location.trim(),
    lat:              parseFloat(body.lat)  || 3.1390,
    lng:              parseFloat(body.lng)  || 101.6869,
    stage:            body.stage            || 'Active DD',
    restricted:       body.restricted       ?? false,
    gdv,
    ndv:              Math.round(gdv * 0.90),
    blendedPSF:       parseFloat(body.blendedPSF) || 0,
    landCost,
    landCostPSF:      0,
    constructionCost: Math.round(gdv * 0.40),
    ndp:              0,
    ndpMargin:        0,
    irr:              0,
    hurdleRate:       parseFloat(body.hurdleRate) || 15,
    landAcres,
    tenure:           body.tenure           || 'Freehold',
    ddProgress:       0,
    updatedAt:        today,
    stageNote:        body.stageNote?.trim() || '',
  }

  deals.push(newDeal)
  writeFileSync(dealsPath, JSON.stringify(deals, null, 2))

  // ── Create deal folder + meta.json + risk.json ────────────────────────────
  const dealDir = path.join(dataDir, dealId)
  if (!existsSync(dealDir)) mkdirSync(dealDir, { recursive: true })

  const meta = {
    id:          dealId,
    name:        newDeal.name,
    ref:         dealId,
    location:    newDeal.location,
    coordinates: { lat: newDeal.lat, lng: newDeal.lng },
    tenure:      newDeal.tenure,
    landArea:    landAcres,
    stage:       newDeal.stage,
    hurdleRate:  newDeal.hurdleRate,
    proximities: [],
    milestones:  [
      { label: 'Deal Identified',  date: today,  status: 'done' },
      { label: 'Title Search',     date: '',     status: 'pending' },
      { label: 'Site Visit',       date: '',     status: 'pending' },
      { label: 'Valuation Report', date: '',     status: 'pending' },
      { label: 'Board Paper',      date: '',     status: 'pending' },
    ],
    devMix:      [],
    assumptions: [
      { label: 'Hurdle IRR',    value: `${newDeal.hurdleRate}%` },
      { label: 'Land Area',     value: `${landAcres} ac` },
      { label: 'Tenure',        value: newDeal.tenure },
    ],
    legalStatus: {
      titleType:    '',
      titleLandUse: { value: '', status: 'pending' },
      encumbrance:  'TBC',
      zoning:       'TBC',
      bumiQuota:    'TBC',
    },
    team: { internal: [], external: [] },
    accessLog: [{ user: 'BD Team', action: 'created', timestamp: new Date().toISOString() }],
  }

  writeFileSync(path.join(dealDir, 'meta.json'), JSON.stringify(meta, null, 2))
  writeFileSync(path.join(dealDir, 'risk.json'), '[]')

  return { ok: true, dealId }
})
