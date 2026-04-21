import { extname, basename } from 'path'

const ALLOWED_EXT = new Set(['pdf', 'xlsx', 'xls', 'doc', 'docx', 'jpg', 'jpeg', 'png'])

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._\- ]/g, '_').trim()
}

export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  if (!/^[A-Za-z0-9_-]+$/.test(dealId)) throw createError({ statusCode: 400, statusMessage: 'Invalid dealId' })

  const parts = await readMultipartFormData(event)
  if (!parts?.length) throw createError({ statusCode: 400, statusMessage: 'No file received' })

  const filePart = parts.find(p => p.name === 'file')
  if (!filePart?.filename) throw createError({ statusCode: 400, statusMessage: 'No file part' })

  const ext = extname(filePart.filename).toLowerCase().replace('.', '')
  if (!ALLOWED_EXT.has(ext)) throw createError({ statusCode: 400, statusMessage: `File type .${ext} not allowed` })

  const category = parts.find(p => p.name === 'category')?.data?.toString() ?? 'legal'
  const filename  = sanitize(filePart.filename)
  const storagePath = `${dealId}/docs/${filename}`

  const sb = useSupabase()

  // Upload to Supabase Storage
  const { error: uploadErr } = await sb.storage
    .from('deal-files')
    .upload(storagePath, filePart.data, {
      contentType: filePart.type ?? 'application/octet-stream',
      upsert: true,
    })
  if (uploadErr) throw createError({ statusCode: 500, statusMessage: uploadErr.message })

  // If xlsx, also upload as financials model
  if (ext === 'xlsx') {
    await sb.storage.from('deal-files').upload(`${dealId}/financials.xlsx`, filePart.data, {
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      upsert: true,
    })
  }

  // Save metadata to deal_documents table
  await sb.from('deal_documents').upsert({
    deal_id:    dealId,
    filename,
    name:       basename(filename, extname(filename)),
    category,
    status:     'New',
    uploader:   '',
    file_date:  new Date().toISOString().slice(0, 10),
    size_bytes: filePart.data.length,
    trashed:    false,
  }, { onConflict: 'deal_id,filename' })

  // Log activity
  await logActivity(event, dealId, 'uploaded', 'document', filename)

  return { success: true, filename }
})
