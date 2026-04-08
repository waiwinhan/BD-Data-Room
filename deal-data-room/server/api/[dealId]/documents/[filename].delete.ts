import { existsSync, mkdirSync, renameSync } from 'fs'
import { join } from 'path'

export default defineEventHandler((event) => {
  const dealId   = getRouterParam(event, 'dealId')!
  const filename = getRouterParam(event, 'filename')!
  const config   = useRuntimeConfig()

  const docsDir  = join(config.dataDir, dealId, 'docs')
  const trashDir = join(docsDir, '.trash')
  mkdirSync(trashDir, { recursive: true })

  const srcFile = join(docsDir, filename)
  const srcMeta = join(docsDir, filename + '.meta.json')
  if (!existsSync(srcFile)) throw createError({ statusCode: 404, statusMessage: 'File not found' })

  renameSync(srcFile, join(trashDir, filename))
  if (existsSync(srcMeta)) renameSync(srcMeta, join(trashDir, filename + '.meta.json'))

  return { ok: true }
})
