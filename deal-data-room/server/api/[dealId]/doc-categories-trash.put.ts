import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'

export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const body   = await readBody(event)   // array of { id, label }
  const config = useRuntimeConfig()
  const path   = join(config.dataDir, dealId, 'doc-categories-trash.json')

  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, JSON.stringify(body, null, 2))
  return { ok: true }
})
