import { createClient } from '@supabase/supabase-js'

let _client: ReturnType<typeof createClient> | null = null

export function useSupabase() {
  if (_client) return _client
  const config = useRuntimeConfig()
  _client = createClient(config.supabaseUrl, config.supabaseAnonKey)
  return _client
}
