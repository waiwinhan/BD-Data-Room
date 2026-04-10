import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

export default defineEventHandler((event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const config = useRuntimeConfig()
  const riskPath = join(config.dataDir, dealId, 'risk.json')

  if (!existsSync(riskPath)) return []
  return JSON.parse(readFileSync(riskPath, 'utf-8'))
})
