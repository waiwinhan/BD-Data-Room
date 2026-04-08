import { mkdirSync, writeFileSync } from 'fs'
import { join, dirname } from 'path'

export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const body   = await readBody(event)   // expects array of { id, label }
  const config = useRuntimeConfig()
  const catPath = join(config.dataDir, dealId, 'doc-categories.json')

  mkdirSync(dirname(catPath), { recursive: true })
  writeFileSync(catPath, JSON.stringify(body, null, 2))
  return { ok: true }
})
