import { extname } from 'path'

const MIME: Record<string, string> = {
  pdf:  'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls:  'application/vnd.ms-excel',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc:  'application/msword',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  ppt:  'application/vnd.ms-powerpoint',
  jpg:  'image/jpeg', jpeg: 'image/jpeg', png: 'image/png',
}
const INLINE_TYPES = new Set(['pdf', 'jpg', 'jpeg', 'png'])

export default defineEventHandler(async (event) => {
  const dealId   = getRouterParam(event, 'dealId')!
  const filename = getRouterParam(event, 'filename')!
  const forceDownload = getQuery(event).download === '1'

  const sb = useSupabase()
  const { data, error } = await sb.storage
    .from('deal-files')
    .download(`${dealId}/docs/${filename}`)

  if (error || !data) throw createError({ statusCode: 404, statusMessage: 'File not found' })

  const ext    = extname(filename).toLowerCase().replace('.', '')
  const mime   = MIME[ext] ?? 'application/octet-stream'
  const inline = INLINE_TYPES.has(ext) && !forceDownload

  setHeader(event, 'Content-Type', mime)
  setHeader(event, 'Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${filename}"`)

  appendAccessLog(useRuntimeConfig().dataDir, dealId, {
    user: 'You',
    action: forceDownload ? 'downloaded' : 'viewed',
    file: filename,
  })

  return Buffer.from(await data.arrayBuffer())
})
