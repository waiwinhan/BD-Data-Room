const isNetlify = process.env.NETLIFY === 'true'

// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: !isNetlify },
  experimental: { appManifest: false },
  modules: ['@nuxtjs/tailwindcss', 'nuxt-auth-utils'],
  nitro: {
    preset: isNetlify ? 'netlify' : undefined,
    externals: {
      external: ['exceljs', 'pdf-parse'],
    },
  },
  runtimeConfig: {
    dataDir: process.env.DATA_DIR || 'data',
    dealPassword: process.env.DEAL_PASSWORD || 'brdb2024',
    sessionPassword: process.env.NUXT_SESSION_PASSWORD || 'change-me-in-production-32chars!!',
    anthropicApiKey: process.env.ANTHROPIC_API_KEY || '',
    supabaseUrl: process.env.SUPABASE_URL || '',
    supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  },
})
