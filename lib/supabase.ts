import { createClient, SupabaseClient } from '@supabase/supabase-js'

function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = []
    if (!supabaseUrl) missing.push('NEXT_PUBLIC_SUPABASE_URL')
    if (!supabaseAnonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY')
    
    throw new Error(
      `Missing Supabase environment variables: ${missing.join(', ')}. ` +
      `Please check your .env.local file and restart the dev server.`
    )
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// Export a function that returns the client to avoid module-level initialization issues
export const getSupabase = () => getSupabaseClient()

// For backward compatibility, export supabase as a getter
export const supabase = getSupabaseClient()

// Database types
export interface Comment {
  id: string
  campaign_id: number
  author: string
  content: string
  created_at: string
  updated_at: string | null
}

