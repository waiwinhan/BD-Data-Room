import { existsSync, readFileSync } from 'node:fs'
import path from 'node:path'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const settingsPath = path.join(config.dataDir, 'settings.json')

  const defaults = { roomName: 'BRDB Berhad', logoDataUrl: '', defaultHurdleRate: 15 }

  if (!existsSync(settingsPath)) return defaults

  const s = JSON.parse(readFileSync(settingsPath, 'utf-8'))
  // Never expose password to client
  return {
    roomName:          s.roomName          ?? defaults.roomName,
    logoDataUrl:       s.logoDataUrl       ?? defaults.logoDataUrl,
    defaultHurdleRate: s.defaultHurdleRate ?? defaults.defaultHurdleRate,
  }
})
