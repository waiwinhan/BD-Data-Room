import { readFileSync, existsSync } from 'fs'
import { join } from 'path'

export default defineEventHandler((event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const config = useRuntimeConfig()
  const filePath = join(config.dataDir, dealId, 'meta.json')

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, statusMessage: `Deal ${dealId} not found` })
  }

  return JSON.parse(readFileSync(filePath, 'utf-8'))
})
