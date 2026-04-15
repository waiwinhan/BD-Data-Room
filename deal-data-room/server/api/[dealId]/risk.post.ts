import { existsSync, readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const body   = await readBody(event)
  const config = useRuntimeConfig()
  const riskPath = join(config.dataDir, dealId, 'risk.json')

  const risks: any[] = existsSync(riskPath)
    ? JSON.parse(readFileSync(riskPath, 'utf-8'))
    : []

  // Generate next ID: R01, R02, …
  const nums = risks.map((r: any) => parseInt(String(r.id).replace(/\D/g, ''), 10)).filter(Number.isFinite)
  const next = nums.length ? Math.max(...nums) + 1 : 1
  const newRisk = {
    id: `R${String(next).padStart(2, '0')}`,
    category: body.category ?? 'General',
    description: body.description ?? 'New risk item',
    severity: body.severity ?? 'amber',
    mitigation: body.mitigation ?? '',
    owner: body.owner ?? '',
  }

  risks.push(newRisk)
  writeFileSync(riskPath, JSON.stringify(risks, null, 2))
  return newRisk
})
