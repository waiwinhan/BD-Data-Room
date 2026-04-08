import { existsSync, renameSync } from 'fs'
import { join } from 'path'

// Restore a document from trash back to docs/
export default defineEventHandler((event) => {
  const dealId   = getRouterParam(event, 'dealId')!
  const filename = getRouterParam(event, 'filename')!
  const config   = useRuntimeConfig()

  const trashDir = join(config.dataDir, dealId, 'docs', '.trash')
  const docsDir  = join(config.dataDir, dealId, 'docs')

  const srcFile = join(trashDir, filename)
  const srcMeta = join(trashDir, filename + '.meta.json')
  if (!existsSync(srcFile)) throw createError({ statusCode: 404, statusMessage: 'File not in trash' })

  renameSync(srcFile, join(docsDir, filename))
  if (existsSync(srcMeta)) renameSync(srcMeta, join(docsDir, filename + '.meta.json'))

  return { ok: true }
})
