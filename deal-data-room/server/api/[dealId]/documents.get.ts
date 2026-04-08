import { readdirSync, existsSync, readFileSync, statSync } from 'fs'
import { join, extname, basename } from 'path'

export default defineEventHandler((event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const config = useRuntimeConfig()
  const docsDir = join(config.dataDir, dealId, 'docs')

  if (!existsSync(docsDir)) return { legal: [], financial: [], technical: [] }

  const files = readdirSync(docsDir).filter(f => !f.endsWith('.meta.json') && !f.startsWith('.'))

  const docs = files.map(filename => {
    const filePath = join(docsDir, filename)
    const metaPath = join(docsDir, filename + '.meta.json')
    const stat = statSync(filePath)

    const meta = existsSync(metaPath)
      ? JSON.parse(readFileSync(metaPath, 'utf-8'))
      : {}

    const ext = extname(filename).toLowerCase().replace('.', '')
    const typeMap: Record<string, string> = {
      pdf: 'PDF', xlsx: 'XLS', xls: 'XLS',
      doc: 'DOC', docx: 'DOC', jpg: 'IMG', jpeg: 'IMG', png: 'IMG',
    }

    return {
      filename,
      name:     meta.name     ?? basename(filename, extname(filename)),
      type:     typeMap[ext]  ?? ext.toUpperCase(),
      category: meta.category ?? 'legal',   // 'legal' | 'financial' | 'technical'
      status:   meta.status   ?? 'New',     // 'New' | 'Reviewed' | 'Pending'
      uploader: meta.uploader ?? '',
      date:     meta.date     ?? stat.mtime.toISOString().slice(0, 10),
      sizeKB:   Math.round(stat.size / 1024),
    }
  })

  // Group by whatever categories exist
  const result: Record<string, typeof docs> = {}
  for (const doc of docs) {
    const cat = doc.category ?? 'legal'
    if (!result[cat]) result[cat] = []
    result[cat].push(doc)
  }
  return result
})
