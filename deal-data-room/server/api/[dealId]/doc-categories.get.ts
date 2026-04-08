import { existsSync, readFileSync } from 'fs'
import { join } from 'path'

const DEFAULTS = [
  { id: 'legal',     label: 'Legal' },
  { id: 'financial', label: 'Financial' },
  { id: 'technical', label: 'Technical' },
]

export default defineEventHandler((event) => {
  const dealId = getRouterParam(event, 'dealId')!
  const config = useRuntimeConfig()
  const catPath = join(config.dataDir, dealId, 'doc-categories.json')

  if (!existsSync(catPath)) return DEFAULTS
  return JSON.parse(readFileSync(catPath, 'utf-8'))
})
