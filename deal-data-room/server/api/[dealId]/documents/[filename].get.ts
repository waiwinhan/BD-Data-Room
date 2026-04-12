import { existsSync, readFileSync } from 'fs'
import { join, extname, basename } from 'path'

const MIME: Record<string, string> = {
  pdf:  'application/pdf',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  xls:  'application/vnd.ms-excel',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  doc:  'application/msword',
  jpg:  'image/jpeg',
  jpeg: 'image/jpeg',
  png:  'image/png',
}

// Types that browsers can display inline
const INLINE_TYPES = new Set(['pdf', 'jpg', 'jpeg', 'png'])

export default defineEventHandler((event) => {
  const dealId   = getRouterParam(event, 'dealId')!
  const filename = getRouterParam(event, 'filename')!
  const query    = getQuery(event)
  const forceDownload = query.download === '1'

  const config  = useRuntimeConfig()
  const filePath = join(config.dataDir, dealId, 'docs', filename)

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, statusMessage: 'File not found' })
  }

  const ext  = extname(filename).toLowerCase().replace('.', '')
  const mime = MIME[ext] ?? 'application/octet-stream'
  const inline = INLINE_TYPES.has(ext) && !forceDownload

  setHeader(event, 'Content-Type', mime)
  setHeader(event, 'Content-Disposition',
    `${inline ? 'inline' : 'attachment'}; filename="${filename}"`)

  const metaPath = join(config.dataDir, dealId, 'docs', filename + '.meta.json')
  const docName = existsSync(metaPath)
    ? (JSON.parse(readFileSync(metaPath, 'utf-8')).name ?? basename(filename, extname(filename)))
    : basename(filename, extname(filename))
  appendAccessLog(config.dataDir, dealId, {
    user: 'You',
    action: forceDownload ? 'downloaded' : 'viewed',
    file: docName,
  })

  return readFileSync(filePath)
})
