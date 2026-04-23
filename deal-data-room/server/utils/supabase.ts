import { createClient } from '@supabase/supabase-js'

let _client: ReturnType<typeof createClient> | null = null

export function useSupabase() {
  if (_client) return _client
  const config = useRuntimeConfig()
  const key = config.supabaseServiceRoleKey || config.supabaseAnonKey
  _client = createClient(config.supabaseUrl, key)
  return _client
}
