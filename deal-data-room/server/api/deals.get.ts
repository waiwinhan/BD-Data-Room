import { readFileSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  const filePath = join(config.dataDir, 'deals.json')
  const deals = JSON.parse(readFileSync(filePath, 'utf-8'))

  const totalGDV = deals.reduce((sum: number, d: any) => sum + d.gdv, 0)
  const avgIRR = deals.reduce((sum: number, d: any) => sum + d.irr, 0) / deals.length
  const totalLandAcres = deals.reduce((sum: number, d: any) => sum + d.landAcres, 0)
  const pendingBoardCount = deals.filter((d: any) =>
    d.stage === 'Active DD' || d.stage === 'KIV'
  ).length

  return {
    deals,
    portfolio: {
      totalGDV: Math.round(totalGDV),
      avgIRR: Math.round(avgIRR * 10) / 10,
      totalLandAcres: Math.round(totalLandAcres * 10) / 10,
      pendingBoardCount,
    },
  }
})
