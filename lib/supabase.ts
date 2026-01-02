import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types
export interface Creator {
  id: string
  wallet_address: string
  display_name?: string
  avatar_url?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  campaign_id: number
  creator_wallet: string
  title: string
  description: string
  image_url?: string
  category?: string
  target_amount: string
  amount_collected: string
  deadline?: number
  state: number
  created_at: string
  updated_at: string
}

export interface Update {
  id: string
  campaign_id: number
  creator_wallet: string
  title: string
  content: string
  images?: string[]
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  campaign_id: number
  author_wallet: string
  content?: string
  image_url?: string
  parent_id?: string
  created_at: string
  updated_at: string
  deleted_at?: string
  reactions?: CommentReaction[]
  reaction_counts?: Record<string, number>
  is_creator?: boolean
}

export interface CommentReaction {
  id: string
  comment_id: string
  user_wallet: string
  reaction_type: 'like' | 'love' | 'laugh' | 'wow' | 'sad' | 'angry'
  created_at: string
}

