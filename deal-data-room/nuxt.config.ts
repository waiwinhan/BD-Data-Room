import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const projectRoot = dirname(fileURLToPath(import.meta.url))

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  experimental: { appManifest: false },
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    dataDir: join(projectRoot, 'data'),
    dealPassword: process.env.DEAL_PASSWORD || 'brdb2024',
    sessionPassword: process.env.NUXT_SESSION_PASSWORD || 'change-me-in-production-32chars!!',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
  },
})
