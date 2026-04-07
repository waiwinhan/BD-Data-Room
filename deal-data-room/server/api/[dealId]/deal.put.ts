import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const config = useRuntimeConfig()
  const filePath = join(config.dataDir, 'deals.json')

  const deals = JSON.parse(readFileSync(filePath, 'utf-8'))
  const body = await readBody(event)

  const idx = deals.findIndex((d: any) => d.id === dealId)
  if (idx === -1) {
    throw createError({ statusCode: 404, statusMessage: `Deal ${dealId} not found` })
  }

  deals[idx] = { ...deals[idx], ...body }
  writeFileSync(filePath, JSON.stringify(deals, null, 2), 'utf-8')
  return { success: true }
})
