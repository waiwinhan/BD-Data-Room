import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

const STATUS_CYCLE = ['New', 'Reviewed', 'Pending']

export default defineEventHandler(async (event) => {
  const dealId   = getRouterParam(event, 'dealId')!
  const filename = getRouterParam(event, 'filename')!
  const config   = useRuntimeConfig()
  const metaPath = join(config.dataDir, dealId, 'docs', filename + '.meta.json')

  const body = await readBody(event)

  const meta = existsSync(metaPath) ? JSON.parse(readFileSync(metaPath, 'utf-8')) : {}

  if (body.status) {
    meta.status = body.status
  } else {
    // Cycle: New → Reviewed → Pending → New
    const current = meta.status ?? 'New'
    const idx = STATUS_CYCLE.indexOf(current)
    meta.status = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
  }

  writeFileSync(metaPath, JSON.stringify(meta, null, 2))
  return { success: true, status: meta.status }
})
