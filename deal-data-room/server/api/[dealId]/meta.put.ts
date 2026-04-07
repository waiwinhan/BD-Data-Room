import { readFileSync, writeFileSync, existsSync } from 'fs'
import { join } from 'path'

export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const config = useRuntimeConfig()
  const filePath = join(config.dataDir, dealId, 'meta.json')

  if (!existsSync(filePath)) {
    throw createError({ statusCode: 404, statusMessage: `Deal ${dealId} not found` })
  }

  const body = await readBody(event)
  writeFileSync(filePath, JSON.stringify(body, null, 2), 'utf-8')
  return { success: true }
})
