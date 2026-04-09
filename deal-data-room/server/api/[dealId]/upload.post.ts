import { writeFileSync, mkdirSync, existsSync, copyFileSync } from 'fs'
import { join, extname, basename } from 'path'
import { readMultipartFormData } from 'h3'

const ALLOWED_EXT = new Set(['pdf', 'xlsx', 'xls', 'doc', 'docx', 'jpg', 'jpeg', 'png'])

function sanitize(name: string) {
  return name.replace(/[^a-zA-Z0-9._\- ]/g, '_').trim()
}

export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const config = useRuntimeConfig()
  const docsDir = join(config.dataDir, dealId, 'docs')

  if (!existsSync(docsDir)) mkdirSync(docsDir, { recursive: true })

  const parts = await readMultipartFormData(event)
  if (!parts || parts.length === 0) throw createError({ statusCode: 400, message: 'No file received' })

  const filePart = parts.find(p => p.name === 'file')
  if (!filePart || !filePart.filename) throw createError({ statusCode: 400, message: 'No file part' })

  const ext = extname(filePart.filename).toLowerCase().replace('.', '')
  if (!ALLOWED_EXT.has(ext)) throw createError({ statusCode: 400, message: `File type .${ext} not allowed` })

  const category = parts.find(p => p.name === 'category')?.data?.toString() ?? 'legal'

  const filename = sanitize(filePart.filename)
  const filePath = join(docsDir, filename)
  writeFileSync(filePath, filePart.data)

  // If xlsx, also copy as financials model
  if (ext === 'xlsx') {
    const finPath = join(config.dataDir, dealId, 'financials.xlsx')
    copyFileSync(filePath, finPath)
  }

  // Write sidecar meta
  const meta = {
    name: basename(filename, extname(filename)),
    category,
    status: 'New',
    uploader: '',
    date: new Date().toISOString().slice(0, 10),
  }
  writeFileSync(filePath + '.meta.json', JSON.stringify(meta, null, 2))

  return { success: true, filename }
})
