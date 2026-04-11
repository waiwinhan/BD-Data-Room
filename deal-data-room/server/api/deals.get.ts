import { readFileSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(() => {
  const config = useRuntimeConfig()
  const filePath = join(config.dataDir, 'deals.json')
  const deals = JSON.parse(readFileSync(filePath, 'utf-8'))

  // Exclude rejected deals from pipeline metrics
  const activeDeals = deals.filter((d: any) => d.stage !== 'Rejected')

  const totalNDV = activeDeals.reduce((sum: number, d: any) => sum + d.ndv, 0)
  const avgNDPMargin = activeDeals.reduce((sum: number, d: any) => sum + d.ndpMargin, 0) / activeDeals.length
  const totalLandAcres = activeDeals.reduce((sum: number, d: any) => sum + d.landAcres, 0)
  const activeCount = activeDeals.length
  const pendingBoardCount = deals.filter((d: any) =>
    d.stage === 'Active DD' || d.stage === 'KIV'
  ).length

  return {
    deals,
    portfolio: {
      totalNDV: Math.round(totalNDV),
      avgNDPMargin: Math.round(avgNDPMargin * 10) / 10,
      totalLandAcres: Math.round(totalLandAcres * 10) / 10,
      activeCount,
      pendingBoardCount,
    },
  }
})

