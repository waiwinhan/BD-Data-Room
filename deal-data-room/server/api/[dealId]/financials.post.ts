import { existsSync, mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

export default defineEventHandler(async (event) => {
  const dealId = getRouterParam(event, 'dealId')
  if (!dealId) throw createError({ statusCode: 400, statusMessage: 'Missing dealId' })

  // Guard against path traversal
  if (!/^[A-Za-z0-9_-]+$/.test(dealId)) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid dealId' })
  }

  const formData = await readMultipartFormData(event)
  if (!formData?.length) throw createError({ statusCode: 400, statusMessage: 'No file received' })

  const file = formData.find(f => f.name === 'file')
  if (!file?.data) throw createError({ statusCode: 400, statusMessage: 'Missing file field' })

  if (!file.filename?.toLowerCase().endsWith('.xlsx')) {
    throw createError({ statusCode: 400, statusMessage: 'Only .xlsx files are accepted' })
  }

  const config = useRuntimeConfig()
  const dealDir = path.join(config.dataDir, dealId)

  if (!existsSync(dealDir)) {
    mkdirSync(dealDir, { recursive: true })
  }

  const destPath = path.join(dealDir, 'financials.xlsx')
  writeFileSync(destPath, file.data)

  return { ok: true, filename: file.filename, bytes: file.data.length }
})
