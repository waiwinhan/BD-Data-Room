import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const id     = getRouterParam(event, 'id')!
  const body   = await readBody(event)   // partial risk fields to merge
  const config = useRuntimeConfig()
  const riskPath = join(config.dataDir, dealId, 'risk.json')

  if (!existsSync(riskPath)) throw createError({ statusCode: 404, statusMessage: 'risk.json not found' })

  const risks = JSON.parse(readFileSync(riskPath, 'utf-8')) as any[]
  const idx   = risks.findIndex((r: any) => r.id === id)
  if (idx === -1) throw createError({ statusCode: 404, statusMessage: `Risk item ${id} not found` })

  risks[idx] = { ...risks[idx], ...body }
  writeFileSync(riskPath, JSON.stringify(risks, null, 2))
  return risks[idx]
})
