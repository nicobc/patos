import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export const allowedEmails: string[] =
  import.meta.env.VITE_ALLOWED_EMAILS?.split(',').map((e: string) => e.trim()) ?? []
