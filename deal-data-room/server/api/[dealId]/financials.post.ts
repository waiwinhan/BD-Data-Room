import { parseFinancials } from '../../utils/parseFinancials'

export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')
  if (!dealId) throw createError({ statusCode: 400, statusMessage: 'Missing dealId' })
  if (!/^[A-Za-z0-9_-]+$/.test(dealId)) throw createError({ statusCode: 400, statusMessage: 'Invalid dealId' })

  const formData = await readMultipartFormData(event)
  if (!formData?.length) throw createError({ statusCode: 400, statusMessage: 'No file received' })

  const file = formData.find(f => f.name === 'file')
  if (!file?.data) throw createError({ statusCode: 400, statusMessage: 'Missing file field' })
  if (!file.filename?.toLowerCase().endsWith('.xlsx')) {
    throw createError({ statusCode: 400, statusMessage: 'Only .xlsx files are accepted' })
  }

  const sb = useSupabase()
  const contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'

  // Save as the active financials model
  const { error } = await sb.storage
    .from('deal-files')
    .upload(`${dealId}/financials.xlsx`, file.data, { contentType, upsert: true })
  if (error) throw createError({ statusCode: 500, statusMessage: error.message })

  // Also save a copy to Documents under the Financial category
  const rawName    = file.filename!
  const docFilename = rawName.replace(/[^a-zA-Z0-9._\- ]/g, '_').trim()

  await sb.storage
    .from('deal-files')
    .upload(`${dealId}/docs/${docFilename}`, file.data, { contentType, upsert: true })

  const { error: docErr } = await sb.from('deal_documents').upsert({
    deal_id:    dealId,
    filename:   docFilename,
    name:       docFilename.replace(/\.xlsx$/i, ''),
    category:   'financial',
    status:     'New',
    uploader:   '',
    file_date:  new Date().toISOString().slice(0, 10),
    size_bytes: file.data.length,
    trashed:    false,
  }, { onConflict: 'deal_id,filename' })

  if (docErr) console.error('[financials.post] doc upsert failed:', docErr.message)

  // Parse financials and sync key KPIs to the deal record so the deal card updates
  try {
    const fin = await parseFinancials(Buffer.from(file.data))
    const dealUpdate: Record<string, any> = { updated_at: new Date().toISOString() }
    if (fin.ndv > 0)        dealUpdate.ndv        = fin.ndv
    if (fin.gdv > 0)        dealUpdate.gdv        = fin.gdv
    if (fin.ndpMargin)      dealUpdate.ndp_margin = fin.ndpMargin
    if (fin.blendedPSF)     dealUpdate.blended_psf = fin.blendedPSF
    if (fin.landAcres > 0)  dealUpdate.land_acres  = fin.landAcres
    await sb.from('deals').update(dealUpdate).eq('id', dealId)
  } catch {
    // Parsing failed (e.g. template only) — upload still succeeded, just skip KPI sync
  }

  return { ok: true, filename: file.filename, bytes: file.data.length }
})
