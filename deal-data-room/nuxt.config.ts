// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  modules: ['@nuxtjs/tailwindcss'],
  runtimeConfig: {
    dealPassword: process.env.DEAL_PASSWORD || 'brdb2024',
    sessionPassword: process.env.NUXT_SESSION_PASSWORD || 'change-me-in-production-32chars!!',
  },
})
