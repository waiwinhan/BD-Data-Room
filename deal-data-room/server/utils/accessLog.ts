import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export function appendAccessLog(dataDir: string, dealId: string, entry: {
  user: string
  action: 'viewed' | 'uploaded' | 'downloaded'
  file: string
}) {
  const metaPath = join(dataDir, dealId, 'meta.json')
  if (!existsSync(metaPath)) return

  const meta = JSON.parse(readFileSync(metaPath, 'utf-8'))
  if (!Array.isArray(meta.accessLog)) meta.accessLog = []

  meta.accessLog.unshift({
    user: entry.user,
    action: entry.action,
    file: entry.file,
    timestamp: new Date().toISOString(),
  })

  // Keep log to last 100 entries
  if (meta.accessLog.length > 100) meta.accessLog = meta.accessLog.slice(0, 100)

  writeFileSync(metaPath, JSON.stringify(meta, null, 2))
}
