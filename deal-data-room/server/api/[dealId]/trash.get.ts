import { readdirSync, existsSync, readFileSync, statSync } from 'fs'
import { join, extname, basename } from 'path'

export default defineEventHandler((event) => {
  const dealId   = getRouterParam(event, 'dealId')!
  const config   = useRuntimeConfig()
  const trashDir = join(config.dataDir, dealId, 'docs', '.trash')

  if (!existsSync(trashDir)) return { docs: [], categories: [] }

  const files = readdirSync(trashDir).filter(f => !f.endsWith('.meta.json') && !f.startsWith('.'))

  const typeMap: Record<string, string> = {
    pdf: 'PDF', xlsx: 'XLS', xls: 'XLS',
    doc: 'DOC', docx: 'DOC', jpg: 'IMG', jpeg: 'IMG', png: 'IMG',
  }

  const docs = files.map(filename => {
    const metaPath = join(trashDir, filename + '.meta.json')
    const stat     = statSync(join(trashDir, filename))
    const meta     = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf-8')) : {}
    const ext      = extname(filename).toLowerCase().replace('.', '')
    return {
      filename,
      name:      meta.name     ?? basename(filename, extname(filename)),
      type:      typeMap[ext]  ?? ext.toUpperCase(),
      category:  meta.category ?? 'legal',
      deletedAt: stat.mtime.toISOString(),
    }
  })

  // Load trashed categories
  const catTrashPath = join(config.dataDir, dealId, 'doc-categories-trash.json')
  const categories   = existsSync(catTrashPath)
    ? JSON.parse(readFileSync(catTrashPath, 'utf-8'))
    : []

  return { docs, categories }
})
