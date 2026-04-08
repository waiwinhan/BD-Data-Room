import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const dealId   = getRouterParam(event, 'dealId')!
  const filename = getRouterParam(event, 'filename')!
  const body     = await readBody(event)

  const config   = useRuntimeConfig()
  const metaPath = join(config.dataDir, dealId, 'docs', filename + '.meta.json')

  const existing = existsSync(metaPath)
    ? JSON.parse(readFileSync(metaPath, 'utf-8'))
    : {}

  const updated = { ...existing, ...body }
  writeFileSync(metaPath, JSON.stringify(updated, null, 2))

  return { ok: true }
})
