import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const projectRoot = dirname(fileURLToPath(import.meta.url))
const isNetlify = process.env.NETLIFY === 'true'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: !isNetlify },
  experimental: { appManifest: false },
  modules: ['@nuxtjs/tailwindcss', 'nuxt-auth-utils'],
  nitro: {
    preset: isNetlify ? 'netlify' : 'node-server',
    // Keep heavy server-only packages as external so they aren't inlined
    // into the Nitro bundle (avoids CJS/ESM conflicts on Netlify)
    externals: {
      external: ['exceljs', 'pdf-parse'],
    },
  },
  runtimeConfig: {
    // dataDir only used locally — on Netlify all data is in Supabase
    dataDir: process.env.DATA_DIR || join(projectRoot, 'data'),
    dealPassword: process.env.DEAL_PASSWORD || 'brdb2024',
    sessionPassword: process.env.NUXT_SESSION_PASSWORD || 'change-me-in-production-32chars!!',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  },
})
