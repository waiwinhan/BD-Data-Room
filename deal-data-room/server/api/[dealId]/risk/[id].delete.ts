import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export default defineEventHandler((event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const id     = getRouterParam(event, 'id')!
  const config = useRuntimeConfig()
  const riskPath = join(config.dataDir, dealId, 'risk.json')

  if (!existsSync(riskPath)) throw createError({ statusCode: 404, statusMessage: 'risk.json not found' })

  const risks = JSON.parse(readFileSync(riskPath, 'utf-8')) as any[]
  const filtered = risks.filter((r: any) => r.id !== id)
  if (filtered.length === risks.length) throw createError({ statusCode: 404, statusMessage: `Risk item ${id} not found` })

  writeFileSync(riskPath, JSON.stringify(filtered, null, 2))
  return { success: true }
})
